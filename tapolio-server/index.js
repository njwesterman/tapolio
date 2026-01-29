// tapolio-server/index.js
require("dotenv").config();

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY is not set in environment variables");
  process.exit(1);
}

// Determine Stripe mode and select appropriate keys
const STRIPE_MODE = process.env.STRIPE_MODE || 'test';
const STRIPE_SECRET_KEY = STRIPE_MODE === 'live' 
  ? process.env.STRIPE_LIVE_SECRET_KEY 
  : process.env.STRIPE_TEST_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error(`ERROR: STRIPE_${STRIPE_MODE.toUpperCase()}_SECRET_KEY is not set in environment variables`);
  process.exit(1);
}

console.log(`💳 Stripe running in ${STRIPE_MODE.toUpperCase()} mode`);

// Simple in-memory conversation for now
let conversation = [];

const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");
const Stripe = require("stripe");

// Initialize Stripe with the appropriate key
const stripe = new Stripe(STRIPE_SECRET_KEY);

const app = express();

// Trust proxy for accurate IP detection (needed for rate limiting behind load balancers)
app.set('trust proxy', 1);

// CORS - restrict to allowed domains in production
const allowedOrigins = [
  'https://tapolio.com',
  'https://www.tapolio.com',
  'http://localhost:5173',  // Vite dev server
  'http://localhost:5174',  // Vite dev server (alt port)
  'http://localhost:8100',  // Ionic dev server
];

app.use(cors({
  origin: (origin, callback) => {
    // Log the origin for debugging
    console.log(`🌐 CORS check - Origin: ${origin || 'none'}`);
    
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Origin'],
  credentials: true,
  maxAge: 86400 // Cache preflight for 24 hours
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.removeHeader('X-Powered-By');
  next();
});

// Stripe webhook endpoint - MUST be before express.json() middleware
// Uses raw body for signature verification
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  // If no webhook secret configured, just log and return success
  // (allows testing without webhooks configured)
  if (!endpointSecret) {
    console.log('⚠️ Stripe webhook received but no STRIPE_WEBHOOK_SECRET configured');
    return res.status(200).json({ received: true });
  }
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(`💰 Payment successful! Session ID: ${session.id}`);
    console.log(`   Customer email: ${session.customer_details?.email}`);
    console.log(`   Amount: ${session.amount_total / 100} ${session.currency?.toUpperCase()}`);
    console.log(`   Credits package: ${session.metadata?.credits}`);
    console.log(`   User ID: ${session.metadata?.userId}`);
    
    // Note: Credit allocation happens on frontend after redirect
    // The metadata can be used for reconciliation if needed
  }
  
  res.status(200).json({ received: true });
});

// Limit request body size
app.use(express.json({ limit: '10kb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 4000;

// Simple rate limiting: track requests per IP
const requestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15; // Tightened from 20

// Interview sessions storage (with expiry)
const interviewSessions = new Map();
const SESSION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// Clean up expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [sessionId, session] of interviewSessions.entries()) {
    if (now - session.createdAt > SESSION_EXPIRY_MS) {
      interviewSessions.delete(sessionId);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
  }
  // Also clean up old rate limit entries
  for (const [ip, requests] of requestCounts.entries()) {
    const recent = requests.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) {
      requestCounts.delete(ip);
    } else {
      requestCounts.set(ip, recent);
    }
  }
}, 5 * 60 * 1000);

// Rate limiting middleware
app.use((req, res, next) => {
  // Skip rate limiting for health checks
  if (req.path === '/health') {
    return next();
  }
  
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }
  
  const requests = requestCounts.get(ip);
  // Remove old requests outside the time window
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ error: "Too many requests, please try again later" });
  }
  
  recentRequests.push(now);
  requestCounts.set(ip, recentRequests);
  next();
});

app.post("/suggest", async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({ error: "Missing or invalid transcript" });
    }

    // Validate transcript length
    if (transcript.length > 5000) {
      return res.status(400).json({ error: "Transcript too long (max 5000 characters)" });
    }

    const trimmed = transcript.trim();
    console.log(`📝 Received transcript: "${trimmed}"`);

    // Use AI to determine if this is a question and extract it
    const detectionPrompt = `Analyze this transcript and determine if it contains a technical question.

Transcript: "${trimmed}"

If it contains a question:
- Reply with just the question in a clear, concise form
- Add a question mark if missing
- If multiple questions, extract the LAST one only

If it does NOT contain a question:
- Reply with exactly: "NOT_A_QUESTION"

Your response:`;

    console.log("🔍 Asking AI to detect question...");
    const detectionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: detectionPrompt }],
      temperature: 0.1,
      max_tokens: 100
    });

    const detectedQuestion = detectionResponse.choices[0]?.message?.content?.trim();
    console.log(`🔍 AI detection result: "${detectedQuestion}"`);

    if (!detectedQuestion || detectedQuestion === "NOT_A_QUESTION") {
      console.log("⏭️ Not a question, ignoring");
      return res.json({
        suggestion: "",
        conversation
      });
    }

    const lastQuestion = detectedQuestion.toLowerCase();

    // Prevent duplicate answers for the same question
    const alreadyAnswered = conversation.some(
      (item) => item.question === lastQuestion
    );

    if (alreadyAnswered) {
      const last = conversation.find((item) => item.question === lastQuestion);
      return res.json({
        suggestion: last?.answer || "",
        conversation
      });
    }

    // Build prompt - handles multi-question transcripts from speech
    const prompt = `
You are Tapolio, a fast technical assistant for developers.

User transcript (may contain multiple questions spoken naturally):
"${lastQuestion}"

INSTRUCTIONS:
1. First, identify if this contains multiple distinct questions
2. If multiple questions detected, answer each one separately using this format:

**Q1:** [first question restated concisely]
**A1:** [answer - 2-4 sentences]

**Q2:** [second question]
**A2:** [answer]

(continue for all questions found)

3. If only ONE question, just answer it directly in 3-6 sentences without the Q/A format.

For each answer:
- Definitions: Explain briefly with an example
- How-to: Give 3-5 key steps
- Troubleshooting: Identify causes and solutions
- Math/simple questions: Give the direct answer

Be concise, direct, and actionable. No fluff.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 250
    });

    const answer =
      completion.choices[0]?.message?.content?.trim() ||
      "Answer unavailable.";
    
    console.log(`✅ OpenAI answered:\n${answer}\n`);

    const item = {
      question: lastQuestion,
      answer
    };

    conversation.push(item);

    return res.json({
      suggestion: answer,
      conversation
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Reset conversation endpoint (disabled in production)
if (process.env.NODE_ENV !== 'production') {
  app.post("/reset", (req, res) => {
    conversation = [];
    res.json({ success: true, message: "Conversation history cleared" });
  });
}

// Interview endpoints
app.post("/interview/start", async (req, res) => {
  try {
    const { technology } = req.body;
    
    if (!technology) {
      return res.status(400).json({ error: "Technology required" });
    }

    // Validate technology is from allowed list
    const allowedTechnologies = [
      'React', 'Angular', 'Product Owner', 'Product Manager', 
      'Business Analysis', 'QA Tester', 'Solution Architect', 
      'Scrum Master', 'DevOps Engineer', 'Data Analyst', 'General Knowledge',
      'Java Developer', 'ServiceNow Developer', 'Python Developer',
      'Node.js Developer', 'SQL Developer', 'AWS Solutions Architect'
    ];
    
    if (!allowedTechnologies.includes(technology)) {
      return res.status(400).json({ error: "Invalid technology" });
    }

    // Limit concurrent sessions per IP
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const activeSessions = [...interviewSessions.values()].filter(s => s.ip === ip).length;
    if (activeSessions >= 3) {
      return res.status(429).json({ error: "Too many active sessions. Please complete or wait for existing sessions to expire." });
    }

    console.log(`🎓 Starting interview for: ${technology}`);
    const sessionId = Date.now().toString() + Math.random().toString(36).substring(7);
    
    const prompt = technology === "General Knowledge" 
      ? `Generate an extremely simple general knowledge question suitable for anyone.
This is question 1 of 3.
Examples: "What color is grass?", "How many days are in a week?", "What is the capital of France?"
Make it easy and fun - this is a warm-up quiz.
Just return the question, nothing else.`
      : `Generate a verbal interview question about ${technology}. 
This is question 1 of 5 in a SPOKEN interview (not a coding test).

IMPORTANT: 
- Ask about concepts, explanations, or experiences
- DO NOT ask for code examples or implementations
- Questions should be answerable in 1-2 spoken sentences
- Focus on understanding, not memorization

Just return the question, nothing else.`;

    console.log(`🤖 Asking OpenAI to generate first question...`);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 150
    });

    const firstQuestion = completion.choices[0]?.message?.content?.trim() || "What is " + technology + "?";
    console.log(`❓ Generated Q1: "${firstQuestion}"`);
    
    interviewSessions.set(sessionId, {
      technology,
      questionNumber: 1,
      questions: [firstQuestion],
      answers: [],
      scores: [],
      createdAt: Date.now(),
      ip
    });

    console.log(`✅ Session ${sessionId} created for ${technology}`);

    res.json({ sessionId, firstQuestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start interview" });
  }
});

app.post("/interview/answer", async (req, res) => {
  try {
    const { sessionId, answer } = req.body;
    
    if (!sessionId || !answer) {
      return res.status(400).json({ error: "Missing sessionId or answer" });
    }

    // Validate answer length
    if (typeof answer !== 'string' || answer.length > 5000) {
      return res.status(400).json({ error: "Answer too long (max 5000 characters)" });
    }

    // Sanitize session ID
    if (typeof sessionId !== 'string' || sessionId.length > 50) {
      return res.status(400).json({ error: "Invalid session ID" });
    }

    const session = interviewSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const currentQuestion = session.questions[session.questionNumber - 1];
    console.log(`🎤 Received answer for Q${session.questionNumber}: "${answer.substring(0, 100)}${answer.length > 100 ? '...' : ''}"}`);
    
    // Evaluate the answer with special handling for General Knowledge
    const evalPrompt = session.technology === "General Knowledge"
      ? `You are evaluating a simple general knowledge question. This is meant to be easy and fun.

Question: ${currentQuestion}
Answer: ${answer}

IMPORTANT: Be generous with scoring. Any reasonable answer should get a high score (8-10).
For example: "What color is grass?" → "green" = 10/10

Evaluate:
1. Score 9-10 if the answer is correct
2. Score 7-8 if partially correct or close
3. Score below 7 only if completely wrong

Format your response as:
SCORE: [number]
FEEDBACK: [1-2 sentences of encouragement]`
      : `You are evaluating a technical interview answer about ${session.technology}.

Question: ${currentQuestion}
Candidate's Answer: ${answer}

Evaluate the answer and provide:
1. A score from 0-10 (be fair but realistic)
2. Constructive feedback that includes:
   - What they got right (if anything)
   - Key points they missed or should have mentioned
   - A brief example or explanation of the correct answer to help them learn

Keep feedback to 3-4 sentences. Be educational and encouraging.

Format your response as:
SCORE: [number]
FEEDBACK: [your feedback]`;

    console.log(`🤖 Asking AI to evaluate answer...`);
    const evalCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: evalPrompt }],
      temperature: 0.3,
      max_tokens: 300
    });

    const evalResult = evalCompletion.choices[0]?.message?.content?.trim() || "";
    const scoreMatch = evalResult.match(/SCORE:\s*(\d+)/);
    const feedbackMatch = evalResult.match(/FEEDBACK:\s*(.+)/s);
    
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : "Good effort!";

    session.answers.push(answer);
    session.scores.push(score);

    console.log(`✅ Q${session.questionNumber} scored: ${score}/10`);
    console.log(`💬 Feedback: "${feedback}"`);

    // Check if interview is complete (3 questions for General Knowledge, 5 for others)
    const maxQuestions = session.technology === "General Knowledge" ? 3 : 5;
    if (session.questionNumber >= maxQuestions) {
      const totalScore = session.scores.reduce((sum, s) => sum + s, 0);
      const avgScore = (totalScore / session.scores.length).toFixed(1);
      console.log(`🎉 Interview ${sessionId} completed! Average score: ${avgScore}/10`);
      
      // Clean up completed session after sending response
      setTimeout(() => {
        interviewSessions.delete(sessionId);
        console.log(`🧹 Cleaned up completed session: ${sessionId}`);
      }, 5000);
      
      return res.json({
        score,
        feedback,
        nextQuestion: null,
        complete: true
      });
    }

    // Generate next question
    session.questionNumber++;
    const nextPrompt = session.technology === "General Knowledge"
      ? `Generate an extremely simple general knowledge question suitable for anyone.
This is question ${session.questionNumber} of 3.
Make it easy, fun, and different from previous questions.
Previous questions: ${session.questions.join("; ")}
Examples: "What sound does a dog make?", "How many legs does a spider have?", "What is 2 + 2?"
Just return the question, nothing else.`
      : `Generate a verbal interview question about ${session.technology}.
This is question ${session.questionNumber} of 5 in a SPOKEN interview (not a coding test).

IMPORTANT:
- Ask about concepts, explanations, or experiences  
- DO NOT ask for code examples or implementations
- Questions should be answerable in 1-2 spoken sentences
- Make it different from previous topics

Previous questions: ${session.questions.join("; ")}
Just return the question, nothing else.`;

    console.log(`🤖 Generating next question (Q${session.questionNumber})...`);
    const nextCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: nextPrompt }],
      temperature: 0.7,
      max_tokens: 150
    });

    const nextQuestion = nextCompletion.choices[0]?.message?.content?.trim() || `Question ${session.questionNumber} about ${session.technology}`;
    session.questions.push(nextQuestion);
    console.log(`❓ Generated Q${session.questionNumber}: "${nextQuestion}"`);

    res.json({
      score,
      feedback,
      nextQuestion,
      complete: false
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process answer" });
  }
});

// Get a hint for the current question
app.post("/interview/hint", async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    // Validate session ID
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 50) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    
    const session = interviewSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Limit hints per session (max 1 per question)
    if (!session.hintsUsed) session.hintsUsed = new Set();
    if (session.hintsUsed.has(session.questionNumber)) {
      return res.status(429).json({ error: "Hint already used for this question" });
    }
    session.hintsUsed.add(session.questionNumber);

    const currentQuestion = session.questions[session.questions.length - 1];
    console.log(`💡 Generating hint for: "${currentQuestion}"`);

    const hintPrompt = `You are helping someone answer this interview question: "${currentQuestion}"

Give a helpful hint (1-2 sentences) that guides them toward a good answer without giving away the full response. Be encouraging and specific.`;

    const hintCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: hintPrompt }],
      temperature: 0.7,
      max_tokens: 100
    });

    const hint = hintCompletion.choices[0]?.message?.content?.trim() || "Think about the key concepts and your practical experience.";
    console.log(`💡 Hint: "${hint}"`);

    res.json({ hint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate hint" });
  }
});

// ============================================
// STRIPE PAYMENT ENDPOINTS
// ============================================

// Credit packages configuration (must match frontend)
const CREDIT_PACKAGES = {
  10: { price: 499, name: '10 Credits' },     // $4.99
  25: { price: 999, name: '25 Credits' },     // $9.99
  50: { price: 1499, name: '50 Credits' },    // $14.99
  100: { price: 2499, name: '100 Credits' }   // $24.99
};

// Create Stripe Checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { credits, userId, email, couponCode, discountedPrice, referredBy } = req.body;
    
    // Validate credits package
    if (!credits || !CREDIT_PACKAGES[credits]) {
      return res.status(400).json({ error: 'Invalid credits package' });
    }
    
    // Validate userId
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const pkg = CREDIT_PACKAGES[credits];
    
    // Use discounted price if provided (already validated on frontend)
    // Price is in cents
    const finalPrice = discountedPrice != null ? Math.round(discountedPrice * 100) : pkg.price;
    
    // Determine success/cancel URLs based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = isProduction 
      ? 'https://tapolio.com' 
      : 'http://localhost:5174';
    
    console.log(`💳 Creating checkout session for ${credits} credits at $${finalPrice / 100}`);
    console.log(`   User: ${userId}, Email: ${email || 'not provided'}`);
    if (couponCode) console.log(`   Coupon: ${couponCode}`);
    if (referredBy) console.log(`   Referred by: ${referredBy}`);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Tapolio ${pkg.name}`,
              description: `${credits} interview practice credits`,
            },
            unit_amount: finalPrice,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&credits=${credits}&coupon=${couponCode || ''}&referredBy=${referredBy || ''}`,
      cancel_url: `${baseUrl}/home`,
      customer_email: email || undefined,
      metadata: {
        userId,
        credits: credits.toString(),
        couponCode: couponCode || '',
        referredBy: referredBy || '',
        originalPrice: pkg.price.toString(),
        finalPrice: finalPrice.toString()
      }
    });
    
    console.log(`✅ Checkout session created: ${session.id}`);
    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Verify payment was successful (called from frontend after redirect)
app.get('/verify-payment', async (req, res) => {
  try {
    const { session_id } = req.query;
    
    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === 'paid') {
      console.log(`✅ Payment verified for session: ${session_id}`);
      res.json({
        success: true,
        credits: parseInt(session.metadata?.credits || '0'),
        couponCode: session.metadata?.couponCode || null,
        referredBy: session.metadata?.referredBy || null,
        userId: session.metadata?.userId
      });
    } else {
      console.log(`⚠️ Payment not completed for session: ${session_id}`);
      res.json({ success: false });
    }
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});


app.listen(PORT, () => {
  console.log(`Tapolio server listening on port ${PORT}`);
});
