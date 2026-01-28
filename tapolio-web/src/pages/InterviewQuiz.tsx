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
  useIonViewWillLeave,
} from "@ionic/react";
import { play, refresh, checkmark, close, mic, micOff, bulbOutline } from "ionicons/icons";
import { useState, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { startInterview, submitAnswer, getHint } from "../services/api";

type Technology = "React" | "Angular" | "Product Owner" | "Product Manager" | "Business Analysis" | "QA Tester" | "Solution Architect" | "Scrum Master" | "DevOps Engineer" | "Data Analyst" | "Warm Up";

interface QuestionResult {
  question: string;
  userAnswer: string;
  score: number;
  feedback: string;
}

const InterviewQuiz: React.FC = () => {
  const history = useHistory();
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [currentFeedback, setCurrentFeedback] = useState<{ score: number; feedback: string } | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  const handleFinalTranscript = useCallback(
    async (text: string) => {
      // Just update the transcript, don't auto-submit
      // User will click Submit Answer button when ready
      console.log("📝 Transcript updated:", text);
    },
    []
  );

  const handleSubmitAnswer = async () => {
    if (!transcript || !isInterviewActive || isProcessing) return;
    
    // Prevent duplicate submissions
    if (currentFeedback) return;

    console.log("📝 Submitting answer:", transcript);
    setIsProcessing(true);
    stopListening();

    try {
      const result = await submitAnswer(sessionId, transcript);
      
      setResults((prev) => [
        ...prev,
        {
          question: currentQuestion,
          userAnswer: transcript,
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
  };

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

  // Stop listening when leaving this tab
  useIonViewWillLeave(() => {
    if (isListening) {
      stopListening();
    }
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
      setHint(null);
      setIsInterviewActive(true);
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
    setHint(null);
    resetTranscript();
    stopListening();
  };

  const handleContinue = () => {
    setCurrentFeedback(null);
    resetTranscript(); // Clear any leftover transcript
    setHint(null); // Clear hint for next question
    
    // If we've completed all 5 questions, end the interview
    if (questionNumber >= 5) {
      setIsInterviewActive(false);
      return;
    }
    
    setQuestionNumber((prev) => prev + 1);
  };

  const handleGetHint = async () => {
    if (!sessionId || loadingHint || hint) return;
    
    setLoadingHint(true);
    try {
      const response = await getHint(sessionId);
      setHint(response.hint);
      console.log("💡 Hint received:", response.hint);
    } catch (e) {
      console.error("Failed to get hint:", e);
    } finally {
      setLoadingHint(false);
    }
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
      <IonContent
        className="ion-padding"
        style={{
          background: "#f5f5f5",
          "--background": "#f5f5f5",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Logo */}
        <div style={{ 
          textAlign: "center", 
          paddingTop: "2rem",
          paddingBottom: "1rem",
          position: "relative"
        }}>
          <img 
            src="/tapolio_logo.png" 
            alt="Tapolio" 
            onClick={() => history.push("/")}
            style={{
              width: "180px",
              height: "auto",
              cursor: "pointer",
            }}
          />
          <h1 style={{
            color: "#333333",
            fontSize: "2rem",
            fontWeight: "600",
            marginTop: "1rem",
            marginBottom: "0"
          }}>
            Live Quiz
          </h1>
          {isInterviewActive && (
            <IonButton
              onClick={handleReset}
              style={{
                "--background": "#dc3545",
                "--background-hover": "#c82333",
                "--color": "#ffffff",
                "--box-shadow": "none",
                fontWeight: "600",
                position: "absolute",
                right: "0",
                top: "2rem",
                fontSize: "0.9rem",
              }}
            >
              <IonIcon slot="start" icon={close} />
              Cancel
            </IonButton>
          )}
        </div>
        {!isSupported && (
          <IonCard
            style={{
              background: "#ffffff",
              border: "1px solid #dc3545",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
          >
            <IonCardContent style={{ color: "#dc3545" }}>
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
                background: "#ffffff",
                border: "1px solid #dee2e6",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              }}
            >
              <IonCardContent>
                <h2
                  style={{
                    color: "#333333",
                    fontWeight: "600",
                    marginBottom: "1rem",
                    fontSize: "1.2rem",
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
                          ? "#0066cc"
                          : "#ffffff",
                      border:
                        selectedTech === "React"
                          ? "2px solid #0066cc"
                          : "1px solid #dee2e6",
                      color: selectedTech === "React" ? "#ffffff" : "#333333",
                      fontSize: "1.1rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    ⚛️ React
                  </IonChip>
                  <IonChip
                    onClick={() => setSelectedTech("Angular")}
                    style={{
                      background:
                        selectedTech === "Angular"
                          ? "#0066cc"
                          : "#ffffff",
                      border:
                        selectedTech === "Angular"
                          ? "2px solid #0066cc"
                          : "1px solid #dee2e6",
                      color: selectedTech === "Angular" ? "#ffffff" : "#333333",
                      fontSize: "1.1rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    🅰️ Angular
                  </IonChip>
                  <IonChip
                    onClick={() => setSelectedTech("Product Owner")}
                    style={{
                      background:
                        selectedTech === "Product Owner"
                          ? "#0066cc"
                          : "#ffffff",
                      border:
                        selectedTech === "Product Owner"
                          ? "2px solid #0066cc"
                          : "1px solid #dee2e6",
                      color: selectedTech === "Product Owner" ? "#ffffff" : "#333333",
                      fontSize: "1.1rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    📋 Product Owner
                  </IonChip>
                  <IonChip
                    onClick={() => setSelectedTech("Product Manager")}
                    style={{
                      background:
                        selectedTech === "Product Manager"
                          ? "#0066cc"
                          : "#ffffff",
                      border:
                        selectedTech === "Product Manager"
                          ? "2px solid #0066cc"
                          : "1px solid #dee2e6",
                      color: selectedTech === "Product Manager" ? "#ffffff" : "#333333",
                      fontSize: "1.1rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    📊 Product Manager
                  </IonChip>
                  <IonChip
                    onClick={() => setSelectedTech("Business Analysis")}
                    style={{
                      background:
                        selectedTech === "Business Analysis"
                          ? "#0066cc"
                          : "#ffffff",
                      border:
                        selectedTech === "Business Analysis"
                          ? "2px solid #0066cc"
                          : "1px solid #dee2e6",
                      color: selectedTech === "Business Analysis" ? "#ffffff" : "#333333",
                      fontSize: "1.1rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    📈 Business Analysis
                  </IonChip>
                  <IonChip
                    onClick={() => setSelectedTech("QA Tester")}
                    style={{
                      background:
                        selectedTech === "QA Tester"
                          ? "#0066cc"
                          : "#ffffff",
                      border:
                        selectedTech === "QA Tester"
                          ? "2px solid #0066cc"
                          : "1px solid #dee2e6",
                      color: selectedTech === "QA Tester" ? "#ffffff" : "#333333",
                      fontSize: "1.1rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    🔍 QA Tester
                  </IonChip>
                  <IonChip
                    onClick={() => setSelectedTech("Solution Architect")}
                    style={{
                      background:
                        selectedTech === "Solution Architect"
                          ? "#0066cc"
                          : "#ffffff",
                      border:
                        selectedTech === "Solution Architect"
                          ? "2px solid #0066cc"
                          : "1px solid #dee2e6",
                      color: selectedTech === "Solution Architect" ? "#ffffff" : "#333333",
                      fontSize: "1.1rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    🏗️ Solution Architect
                  </IonChip>
                  <IonChip
                    onClick={() => setSelectedTech("Scrum Master")}
                    style={{
                      background:
                        selectedTech === "Scrum Master"
                          ? "#0066cc"
                          : "#ffffff",
                      border:
                        selectedTech === "Scrum Master"
                          ? "2px solid #0066cc"
                          : "1px solid #dee2e6",
                      color: selectedTech === "Scrum Master" ? "#ffffff" : "#333333",
                      fontSize: "1.1rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    🏃 Scrum Master
                  </IonChip>
                  <IonChip
                    onClick={() => setSelectedTech("DevOps Engineer")}
                    style={{
                      background:
                        selectedTech === "DevOps Engineer"
                          ? "#0066cc"
                          : "#ffffff",
                      border:
                        selectedTech === "DevOps Engineer"
                          ? "2px solid #0066cc"
                          : "1px solid #dee2e6",
                      color: selectedTech === "DevOps Engineer" ? "#ffffff" : "#333333",
                      fontSize: "1.1rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    ⚙️ DevOps Engineer
                  </IonChip>
                  <IonChip
                    onClick={() => setSelectedTech("Data Analyst")}
                    style={{
                      background:
                        selectedTech === "Data Analyst"
                          ? "#0066cc"
                          : "#ffffff",
                      border:
                        selectedTech === "Data Analyst"
                          ? "2px solid #0066cc"
                          : "1px solid #dee2e6",
                      color: selectedTech === "Data Analyst" ? "#ffffff" : "#333333",
                      fontSize: "1.1rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    📊 Data Analyst
                  </IonChip>
                  <IonChip
                    onClick={() => setSelectedTech("Warm Up")}
                    style={{
                      background:
                        selectedTech === "Warm Up"
                          ? "#28a745"
                          : "#ffffff",
                      border:
                        selectedTech === "Warm Up"
                          ? "2px solid #28a745"
                          : "1px solid #dee2e6",
                      color: selectedTech === "Warm Up" ? "#ffffff" : "#333333",
                      fontSize: "1.1rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
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
                      "--background": "#28a745",
                      "--background-hover": "#218838",
                      "--color": "#ffffff",
                      fontWeight: "600",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
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
                  background: "#ffffff",
                  border: "1px solid #dee2e6",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
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
                        color: "#333333",
                        fontWeight: "600",
                        margin: 0,
                        fontSize: "1.2rem",
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
                            ? "#28a745"
                            : grade === "B" || grade === "C"
                            ? "#ffc107"
                            : "#dc3545",
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
                        background: "#f8f9fa",
                        borderRadius: "8px",
                        border: `2px solid ${
                          result.score >= 7 ? "#28a745" : "#ffc107"
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
                        <strong style={{ color: "#0066cc" }}>
                          Q{i + 1}:
                        </strong>
                        <div
                          style={{
                            color: result.score >= 7 ? "#28a745" : "#ffc107",
                            fontWeight: "bold",
                          }}
                        >
                          {result.score}/10
                        </div>
                      </div>
                      <div style={{ color: "#333333", marginBottom: "0.5rem" }}>
                        {result.question}
                      </div>
                      <div
                        style={{
                          color: "#6c757d",
                          fontSize: "0.9rem",
                          fontStyle: "italic",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Your answer: {result.userAnswer}
                      </div>
                      <div style={{ color: "#495057", fontSize: "0.9rem" }}>
                        💬 {result.feedback}
                      </div>
                    </div>
                  ))}
                  <IonButton
                    expand="block"
                    onClick={handleReset}
                    style={{
                      "--background": "#0066cc",
                      "--background-hover": "#0052a3",
                      "--color": "#ffffff",
                      fontWeight: "600",
                      marginTop: "1rem",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
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
                background: "#ffffff",
                border: "1px solid #dee2e6",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              }}
            >
              <IonCardContent>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                    color: "#333333",
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
                background: "#ffffff",
                border: "2px solid #0066cc",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              }}
            >
              <IonCardContent>
                <h2
                  style={{
                    color: "#0066cc",
                    fontWeight: "600",
                    marginBottom: "1rem",
                    fontSize: "1.2rem",
                  }}
                >
                  ❓ Question
                </h2>
                <div
                  style={{
                    fontSize: "1.2rem",
                    color: "#333333",
                    lineHeight: "1.6",
                    marginBottom: "1rem",
                  }}
                >
                  {currentQuestion}
                </div>
                <IonButton
                  size="small"
                  fill="outline"
                  onClick={handleGetHint}
                  disabled={loadingHint || !!hint || !!currentFeedback}
                  style={{
                    "--border-color": "#ffc107",
                    "--color": "#ffc107",
                  }}
                >
                  <IonIcon slot="start" icon={bulbOutline} />
                  {loadingHint ? "Getting hint..." : hint ? "Hint shown below" : "Get a Hint"}
                </IonButton>
              </IonCardContent>
            </IonCard>

            {/* Hint Display */}
            {hint && !currentFeedback && (
              <IonCard
                style={{
                  background: "#fffbf0",
                  border: "1px solid #ffc107",
                  borderLeft: "4px solid #ffc107",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                <IonCardContent>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <IonIcon icon={bulbOutline} style={{ color: "#ffc107", fontSize: "1.5rem" }} />
                    <h3
                      style={{
                        color: "#856404",
                        fontWeight: "600",
                        margin: 0,
                        fontSize: "1rem",
                      }}
                    >
                      Hint
                    </h3>
                  </div>
                  <div
                    style={{
                      color: "#856404",
                      fontSize: "1rem",
                      lineHeight: "1.6",
                    }}
                  >
                    {hint}
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            {/* Feedback Display */}
            {currentFeedback && (
              <IonCard
                style={{
                  background: "#ffffff",
                  border: "1px solid #dee2e6",
                  borderLeft: currentFeedback.score >= 7 ? "4px solid #28a745" : "4px solid #ffc107",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
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
                        color: currentFeedback.score >= 7 ? "#28a745" : "#ffc107",
                        fontWeight: "600",
                        margin: 0,
                        fontSize: "1.2rem",
                      }}
                    >
                      {currentFeedback.score >= 7 ? "✅ Great Answer!" : "💡 Room for Improvement"}
                    </h2>
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: "bold",
                        color: currentFeedback.score >= 7 ? "#28a745" : "#ffc107",
                      }}
                    >
                      {currentFeedback.score}/10
                    </div>
                  </div>
                  <div
                    style={{
                      color: "#333333",
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
                      "--background": "#0066cc",
                      "--background-hover": "#0052a3",
                      "--color": "#ffffff",
                      fontWeight: "600",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
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
                  background: "#ffffff",
                  border: "1px solid #dee2e6",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                <IonCardContent>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h2
                    style={{
                      color: "#333333",
                      fontWeight: "600",
                      margin: 0,
                      fontSize: "1.2rem",
                    }}
                  >
                    🎤 Your Answer
                  </h2>
                  <IonButton
                    onClick={isListening ? stopListening : startListening}
                    style={{
                      "--background": isListening ? "#dc3545" : "#28a745",
                      "--background-hover": isListening ? "#c82333" : "#218838",
                      "--color": "#ffffff",
                      fontWeight: "600",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <IonIcon slot="start" icon={isListening ? micOff : mic} />
                    {isListening ? "Stop" : "Start Recording"}
                  </IonButton>
                </div>
                <div
                  style={{
                    borderRadius: 8,
                    padding: "0.75rem",
                    minHeight: 100,
                    fontSize: "0.9rem",
                    whiteSpace: "pre-wrap",
                    background: "#e9ecef",
                    color: "#212529",
                    fontFamily: "monospace",
                    border: isListening ? "2px solid #28a745" : "none",
                  }}
                >
                  {transcript || (
                    <span style={{ opacity: 0.6, color: "#6c757d" }}>
                      {isListening
                        ? "Listening... Speak your answer."
                        : "Click the Start Recording button above"}
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
                      color: "#28a745",
                    }}
                  >
                    <IonSpinner name="dots" />
                    <span>AI is evaluating your answer...</span>
                  </div>
                )}
                <IonButton
                  expand="block"
                  onClick={handleSubmitAnswer}
                  disabled={!transcript || isProcessing || !!currentFeedback}
                  style={{
                    marginTop: "1rem",
                    "--background": "#28a745",
                    "--background-hover": "#218838",
                    "--color": "#ffffff",
                    fontWeight: "600",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    opacity: !transcript || isProcessing || !!currentFeedback ? 0.5 : 1,
                  }}
                >
                  {isProcessing ? "Submitting..." : "Submit Answer"}
                </IonButton>
              </IonCardContent>
            </IonCard>
            )}
          </>
        )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default InterviewQuiz;
