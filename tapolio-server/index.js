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
