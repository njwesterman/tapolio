// tapolio-server/index.js
require("dotenv").config();

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY is not set in environment variables");
  process.exit(1);
}

// Simple in-memory conversation for now
let conversation = [];

const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

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
const MAX_REQUESTS_PER_WINDOW = 20;

// Interview sessions storage
const interviewSessions = new Map();

// Rate limiting middleware
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
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

    // Build prompt
    const prompt = `
You are Tapolio, a fast technical assistant for developers.

Question: ${lastQuestion}

Provide a clear, practical answer. Handle any of these question types:
- Definitions: Explain briefly with an example
- How-to: Give 3-5 key steps or best practices
- Troubleshooting: Identify likely causes and solutions
- Best practices: Share proven approaches

Keep it concise (3-6 sentences max). Be direct and actionable. No fluff.
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

// Reset conversation endpoint (useful for development)
app.post("/reset", (req, res) => {
  conversation = [];
  res.json({ success: true, message: "Conversation history cleared" });
});

// Interview endpoints
app.post("/interview/start", async (req, res) => {
  try {
    const { technology } = req.body;
    
    if (!technology) {
      return res.status(400).json({ error: "Technology required" });
    }

    console.log(`🎓 Starting interview for: ${technology}`);
    const sessionId = Date.now().toString() + Math.random().toString(36).substring(7);
    
    const prompt = technology === "Warm Up" 
      ? `Generate an extremely simple question suitable for primary/elementary school children (ages 5-10).
This is question 1 of 5.
Examples: "What color is grass?", "How many days are in a week?", "Is water wet or dry?"
Make it very easy - suitable for testing that voice recognition is working.
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
      scores: []
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

    const session = interviewSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const currentQuestion = session.questions[session.questionNumber - 1];
    console.log(`🎤 Received answer for Q${session.questionNumber}: "${answer.substring(0, 100)}${answer.length > 100 ? '...' : ''}"}`);
    
    // Evaluate the answer with special handling for Warm Up
    const evalPrompt = session.technology === "Warm Up"
      ? `You are evaluating a simple baseline question. This is meant to be VERY EASY.

Question: ${currentQuestion}
Answer: ${answer}

IMPORTANT: These are baseline questions. Any reasonable answer should get a high score (9-10).
For example: "What sound does a dog make?" → "bark" or "woof" = 10/10

Evaluate:
1. Score 9-10 if the answer is correct in any way
2. Score 7-8 only if partially correct
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

    // Check if interview is complete
    if (session.questionNumber >= 5) {
      const totalScore = session.scores.reduce((sum, s) => sum + s, 0);
      const avgScore = (totalScore / session.scores.length).toFixed(1);
      console.log(`🎉 Interview ${sessionId} completed! Average score: ${avgScore}/10`);
      return res.json({
        score,
        feedback,
        nextQuestion: null,
        complete: true
      });
    }

    // Generate next question
    session.questionNumber++;
    const nextPrompt = session.technology === "Warm Up"
      ? `Generate an extremely simple question suitable for primary/elementary school children (ages 5-10).
This is question ${session.questionNumber} of 5.
Make it very easy and different from previous questions.
Previous questions: ${session.questions.join("; ")}
Examples: "What sound does a dog make?", "How many legs does a cat have?", "What is 2 + 2?"
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
