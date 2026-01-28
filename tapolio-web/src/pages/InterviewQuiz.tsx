import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonProgressBar,
  IonSpinner,
  IonTitle,
  IonToolbar,
  IonChip,
} from "@ionic/react";
import { play, refresh, checkmark, close } from "ionicons/icons";
import { useState, useCallback } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { startInterview, submitAnswer } from "../services/api";

type Technology = "React" | "Angular" | "Product Owner" | "Product Manager" | "Warm Up";

interface QuestionResult {
  question: string;
  userAnswer: string;
  score: number;
  feedback: string;
}

const InterviewQuiz: React.FC = () => {
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [currentFeedback, setCurrentFeedback] = useState<{ score: number; feedback: string } | null>(null);

  const handleFinalTranscript = useCallback(
    async (text: string) => {
      if (!isInterviewActive || isProcessing || text.trim().length === 0) return;
      
      // Prevent duplicate submissions - if we're showing feedback, don't submit again
      if (currentFeedback) return;

      console.log("📝 Submitting answer:", text);
      setIsProcessing(true);
      stopListening();

      try {
        const result = await submitAnswer(sessionId, text);
        
        setResults((prev) => [
          ...prev,
          {
            question: currentQuestion,
            userAnswer: text,
            score: result.score,
            feedback: result.feedback,
          },
        ]);

        // Show feedback immediately
        setCurrentFeedback({ score: result.score, feedback: result.feedback });
        setIsProcessing(false);
        resetTranscript();

        // Store next question but don't increment counter yet
        if (result.nextQuestion) {
          setCurrentQuestion(result.nextQuestion);
        } else {
          // Interview complete
          setIsInterviewActive(false);
        }
      } catch (e: any) {
        console.error("Failed to submit answer:", e);
        setIsProcessing(false);
      }
    },
    [isInterviewActive, isProcessing, sessionId, currentQuestion, currentFeedback]
  );

  const {
    isSupported,
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    lang: "en-US",
    continuous: true,
    interimResults: true,
    onFinalChunk: handleFinalTranscript,
  });

  const handleStartInterview = async () => {
    if (!selectedTech) return;

    try {
      const response = await startInterview(selectedTech);
      setSessionId(response.sessionId);
      setCurrentQuestion(response.firstQuestion);
      setQuestionNumber(1);
      setResults([]);
      setCurrentFeedback(null);
      setIsInterviewActive(true);
      setTimeout(() => startListening(), 500);
    } catch (e) {
      console.error("Failed to start interview:", e);
    }
  };

  const handleReset = () => {
    setIsInterviewActive(false);
    setCurrentQuestion("");
    setQuestionNumber(0);
    setResults([]);
    setSelectedTech(null);
    setCurrentFeedback(null);
    resetTranscript();
    stopListening();
  };

  const handleContinue = () => {
    setCurrentFeedback(null);
    resetTranscript(); // Clear any leftover transcript
    
    // If we've completed all 5 questions, end the interview
    if (questionNumber >= 5) {
      setIsInterviewActive(false);
      return;
    }
    
    setQuestionNumber((prev) => prev + 1);
    setTimeout(() => startListening(), 500);
  };

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const averageScore = results.length > 0 ? totalScore / results.length : 0;
  const grade =
    averageScore >= 9
      ? "A+"
      : averageScore >= 8
      ? "A"
      : averageScore >= 7
      ? "B"
      : averageScore >= 6
      ? "C"
      : averageScore >= 5
      ? "D"
      : "F";

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderBottom: "2px solid #6df76d",
            "--background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "--color": "#fff",
          }}
        >
          <IonTitle
            style={{
              fontWeight: "bold",
              textShadow: "0 0 10px rgba(109, 247, 109, 0.5)",
              color: "#fff",
            }}
          >
            🎓 Tapolio · Live Quiz
          </IonTitle>
          {isInterviewActive && (
            <IonButton
              slot="end"
              onClick={handleReset}
              style={{
                "--background": "rgba(255, 107, 107, 0.2)",
                "--background-hover": "rgba(255, 107, 107, 0.3)",
                "--color": "#ff6b6b",
                fontWeight: "bold",
                marginRight: "10px",
              }}
            >
              <IonIcon slot="start" icon={close} />
              Cancel Quiz
            </IonButton>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent
        className="ion-padding"
        style={{
          background:
            "linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
          "--background": "transparent",
        }}
      >
        {!isSupported && (
          <IonCard
            style={{
              background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
              border: "1px solid #ff6b6b",
              boxShadow: "0 0 20px rgba(231, 76, 60, 0.3)",
            }}
          >
            <IonCardContent style={{ color: "#fff" }}>
              Your browser doesn't support Speech Recognition. Try Chrome or
              Edge.
            </IonCardContent>
          </IonCard>
        )}

        {!isInterviewActive ? (
          <>
            {/* Technology Selection */}
            <IonCard
              style={{
                background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
                border: "1px solid #4a90e2",
                boxShadow: "0 0 30px rgba(74, 144, 226, 0.2)",
              }}
            >
              <IonCardContent>
                <h2
                  style={{
                    color: "#52c7f2",
                    textShadow: "0 0 10px rgba(82, 199, 242, 0.5)",
                    fontWeight: "bold",
                    marginBottom: "1rem",
                  }}
                >
                  Select Discipline or Topic
                </h2>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <IonChip
                    onClick={() => setSelectedTech("React")}
                    style={{
                      background:
                        selectedTech === "React"
                          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                          : "rgba(255, 255, 255, 0.1)",
                      border:
                        selectedTech === "React"
                          ? "2px solid #667eea"
                          : "1px solid #666",
                      color: "#fff",
                      fontSize: "1.1rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                    }}
                  >
                    ⚛️ React
                  </IonChip>
                  <IonChip
                    onClick={() => setSelectedTech("Angular")}
                    style={{
                      background:
                        selectedTech === "Angular"
                          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                          : "rgba(255, 255, 255, 0.1)",
                      border:
                        selectedTech === "Angular"
                          ? "2px solid #667eea"
                          : "1px solid #666",
                      color: "#fff",
                      fontSize: "1.1rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                    }}
                  >
                    🅰️ Angular
                  </IonChip>
                  <IonChip
                    onClick={() => setSelectedTech("Product Owner")}
                    style={{
                      background:
                        selectedTech === "Product Owner"
                          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                          : "rgba(255, 255, 255, 0.1)",
                      border:
                        selectedTech === "Product Owner"
                          ? "2px solid #667eea"
                          : "1px solid #666",
                      color: "#fff",
                      fontSize: "1.1rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                    }}
                  >
                    📋 Product Owner
                  </IonChip>
                  <IonChip
                    onClick={() => setSelectedTech("Product Manager")}
                    style={{
                      background:
                        selectedTech === "Product Manager"
                          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                          : "rgba(255, 255, 255, 0.1)",
                      border:
                        selectedTech === "Product Manager"
                          ? "2px solid #667eea"
                          : "1px solid #666",
                      color: "#fff",
                      fontSize: "1.1rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                    }}
                  >
                    📊 Product Manager
                  </IonChip>
                  <IonChip
                    onClick={() => setSelectedTech("Warm Up")}
                    style={{
                      background:
                        selectedTech === "Warm Up"
                          ? "linear-gradient(135deg, #ffa502 0%, #ff6348 100%)"
                          : "rgba(255, 255, 255, 0.1)",
                      border:
                        selectedTech === "Warm Up"
                          ? "2px solid #ffa502"
                          : "1px solid #666",
                      color: "#fff",
                      fontSize: "1.1rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                    }}
                  >
                    🎯 Warm Up
                  </IonChip>
                </div>
                {selectedTech && (
                  <IonButton
                    expand="block"
                    onClick={handleStartInterview}
                    style={{
                      marginTop: "1rem",
                      background:
                        "linear-gradient(135deg, #6df76d 0%, #4caf50 100%)",
                      fontWeight: "bold",
                      boxShadow: "0 0 20px rgba(109, 247, 109, 0.5)",
                    }}
                  >
                    <IonIcon slot="start" icon={play} />
                    Start Interview (5 Questions)
                  </IonButton>
                )}
              </IonCardContent>
            </IonCard>

            {/* Results Summary */}
            {results.length > 0 && (
              <IonCard
                style={{
                  background:
                    "linear-gradient(135deg, #232526 0%, #414345 100%)",
                  border: "1px solid #a8dadc",
                  boxShadow: "0 0 30px rgba(168, 218, 220, 0.2)",
                }}
              >
                <IonCardContent>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <h2
                      style={{
                        color: "#a8dadc",
                        textShadow: "0 0 10px rgba(168, 218, 220, 0.5)",
                        fontWeight: "bold",
                        margin: 0,
                      }}
                    >
                      📊 Final Results
                    </h2>
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: "bold",
                        color:
                          grade === "A+" || grade === "A"
                            ? "#6df76d"
                            : grade === "B" || grade === "C"
                            ? "#ffa502"
                            : "#ff6b6b",
                        textShadow: "0 0 15px currentColor",
                      }}
                    >
                      {grade}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "1.2rem",
                      color: "#e0e0e0",
                      marginBottom: "1rem",
                    }}
                  >
                    Average Score: {averageScore.toFixed(1)}/10
                  </div>
                  {results.map((result, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: "1rem",
                        padding: "1rem",
                        background: "rgba(0, 0, 0, 0.3)",
                        borderRadius: "8px",
                        border: `1px solid ${
                          result.score >= 7 ? "#6df76d" : "#ffa502"
                        }`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <strong style={{ color: "#52c7f2" }}>
                          Q{i + 1}:
                        </strong>
                        <div
                          style={{
                            color: result.score >= 7 ? "#6df76d" : "#ffa502",
                            fontWeight: "bold",
                          }}
                        >
                          {result.score}/10
                        </div>
                      </div>
                      <div style={{ color: "#d0d0d0", marginBottom: "0.5rem" }}>
                        {result.question}
                      </div>
                      <div
                        style={{
                          color: "#b0b0b0",
                          fontSize: "0.9rem",
                          fontStyle: "italic",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Your answer: {result.userAnswer}
                      </div>
                      <div style={{ color: "#a8dadc", fontSize: "0.9rem" }}>
                        💬 {result.feedback}
                      </div>
                    </div>
                  ))}
                  <IonButton
                    expand="block"
                    onClick={handleReset}
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      fontWeight: "bold",
                      marginTop: "1rem",
                    }}
                  >
                    <IonIcon slot="start" icon={refresh} />
                    Start New Quiz
                  </IonButton>
                </IonCardContent>
              </IonCard>
            )}
          </>
        ) : (
          <>
            {/* Progress */}
            <IonCard
              style={{
                background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
                border: "1px solid #4a90e2",
                boxShadow: "0 0 30px rgba(74, 144, 226, 0.2)",
              }}
            >
              <IonCardContent>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                    color: "#fff",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>
                    Question {questionNumber}/5
                  </span>
                  <span>
                    Score: {totalScore}/50
                  </span>
                </div>
                <IonProgressBar value={questionNumber / 5} />
              </IonCardContent>
            </IonCard>

            {/* Current Question */}
            <IonCard
              style={{
                background:
                  "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
                border: "2px solid #6df76d",
                boxShadow: "0 0 40px rgba(109, 247, 109, 0.4)",
              }}
            >
              <IonCardContent>
                <h2
                  style={{
                    color: "#6df76d",
                    textShadow: "0 0 15px rgba(109, 247, 109, 0.8)",
                    fontWeight: "bold",
                    marginBottom: "1rem",
                  }}
                >
                  ❓ Question
                </h2>
                <div
                  style={{
                    fontSize: "1.2rem",
                    color: "#e0e0e0",
                    lineHeight: "1.6",
                  }}
                >
                  {currentQuestion}
                </div>
              </IonCardContent>
            </IonCard>

            {/* Feedback Display */}
            {currentFeedback && (
              <IonCard
                style={{
                  background: `linear-gradient(135deg, ${
                    currentFeedback.score >= 7 ? "#2d5016" : "#8b4513"
                  } 0%, ${currentFeedback.score >= 7 ? "#4caf50" : "#d68910"} 100%)`,
                  border: `2px solid ${currentFeedback.score >= 7 ? "#6df76d" : "#ffa502"}`,
                  boxShadow: `0 0 40px ${
                    currentFeedback.score >= 7
                      ? "rgba(109, 247, 109, 0.4)"
                      : "rgba(255, 165, 2, 0.4)"
                  }`,
                }}
              >
                <IonCardContent>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <h2
                      style={{
                        color: "#fff",
                        fontWeight: "bold",
                        margin: 0,
                      }}
                    >
                      {currentFeedback.score >= 7 ? "✅ Great Answer!" : "💡 Room for Improvement"}
                    </h2>
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: "bold",
                        color: "#fff",
                        textShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      {currentFeedback.score}/10
                    </div>
                  </div>
                  <div
                    style={{
                      color: "#fff",
                      fontSize: "1rem",
                      lineHeight: "1.6",
                      marginBottom: "1rem",
                    }}
                  >
                    {currentFeedback.feedback}
                  </div>
                  <IonButton
                    expand="block"
                    onClick={handleContinue}
                    style={{
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      fontWeight: "bold",
                      boxShadow: "0 0 20px rgba(102, 126, 234, 0.5)",
                    }}
                  >
                    {questionNumber < 5 ? "Next Question →" : "See Final Results"}
                  </IonButton>
                </IonCardContent>
              </IonCard>
            )}

            {/* Answer Input */}
            {!currentFeedback && (
              <IonCard
                style={{
                  background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                  border: "1px solid #52c7f2",
                  boxShadow: "0 0 30px rgba(82, 199, 242, 0.2)",
                }}
              >
                <IonCardContent>
                <h2
                  style={{
                    color: "#52c7f2",
                    textShadow: "0 0 10px rgba(82, 199, 242, 0.5)",
                    fontWeight: "bold",
                    marginBottom: "1rem",
                  }}
                >
                  🎤 Your Answer
                </h2>
                <div
                  style={{
                    border: "2px solid #52c7f2",
                    borderRadius: 8,
                    padding: "0.75rem",
                    minHeight: 100,
                    fontSize: "0.9rem",
                    whiteSpace: "pre-wrap",
                    background: "rgba(0, 0, 0, 0.3)",
                    color: "#e0e0e0",
                    boxShadow: "inset 0 0 15px rgba(82, 199, 242, 0.1)",
                  }}
                >
                  {transcript || (
                    <span style={{ opacity: 0.6, color: "#52c7f2" }}>
                      {isListening
                        ? "Listening... Speak your answer."
                        : "Click to start speaking"}
                    </span>
                  )}
                </div>
                {isProcessing && (
                  <div
                    style={{
                      marginTop: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      color: "#6df76d",
                    }}
                  >
                    <IonSpinner name="dots" />
                    <span>AI is evaluating your answer...</span>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default InterviewQuiz;
