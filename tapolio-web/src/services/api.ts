// src/services/api.ts
export interface SuggestionResponse {
  suggestion: string;
  conversation?: { question: string; answer: string }[];
}


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export async function fetchSuggestion(
  transcript: string
): Promise<SuggestionResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const res = await fetch(`${API_BASE_URL}/suggest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `API error: ${res.status}`);
    }

    return res.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw error;
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function resetConversation(): Promise<void> {
  await fetch(`${API_BASE_URL}/reset`, {
    method: "POST",
  });
}

// Interview API functions
export interface InterviewStartResponse {
  sessionId: string;
  firstQuestion: string;
}

export interface InterviewAnswerResponse {
  score: number;
  feedback: string;
  nextQuestion: string | null;
  complete: boolean;
}

export async function startInterview(technology: string): Promise<InterviewStartResponse> {
  const res = await fetch(`${API_BASE_URL}/interview/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ technology }),
  });

  if (!res.ok) {
    throw new Error(`Failed to start interview: ${res.status}`);
  }

  return res.json();
}

export async function submitAnswer(sessionId: string, answer: string): Promise<InterviewAnswerResponse> {
  const res = await fetch(`${API_BASE_URL}/interview/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId, answer }),
  });

  if (!res.ok) {
    throw new Error(`Failed to submit answer: ${res.status}`);
  }

  return res.json();
}
