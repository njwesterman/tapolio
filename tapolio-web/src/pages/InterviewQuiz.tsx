import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonIcon,
  IonPage,
  IonProgressBar,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  useIonViewWillLeave,
} from "@ionic/react";
import { play, refresh, checkmark, close, mic, micOff, bulbOutline, keypadOutline, lockClosed, sparkles, lockOpenOutline, timeOutline } from "ionicons/icons";
import { useState, useCallback, useEffect, useRef } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { startInterview, submitAnswer, getHint } from "../services/api";
import { useAuth, FREE_QUIZ_TOPICS } from "../contexts/AuthContext";
import UserHeader from "../components/UserHeader";
import { saveQuizResult, loadQuizResults, QuizResultData } from "../services/parse";

type Technology = "React" | "Angular" | "Product Owner" | "Product Manager" | "Business Analysis" | "QA Tester" | "Solution Architect" | "Scrum Master" | "DevOps Engineer" | "Data Analyst" | "General Knowledge" | "Java Developer" | "ServiceNow Developer" | "Python Developer" | "Node.js Developer" | "SQL Developer" | "AWS Solutions Architect";

interface QuestionResult {
  question: string;
  userAnswer: string;
  score: number;
  feedback: string;
}

const InterviewQuiz: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { 
    isAuthenticated, 
    credits, 
    useCredit, 
    canAccessQuizTopic, 
    setShowAuthModal, 
    setShowCreditsModal 
  } = useAuth();
  
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);

  // Pre-select topic from query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const topic = params.get('topic');
    if (topic) {
      const validTopics: Technology[] = ["React", "Angular", "Product Owner", "Product Manager", "Business Analysis", "QA Tester", "Solution Architect", "Scrum Master", "DevOps Engineer", "Data Analyst", "General Knowledge", "Java Developer", "ServiceNow Developer", "Python Developer", "Node.js Developer", "SQL Developer", "AWS Solutions Architect"];
      if (validTopics.includes(topic as Technology)) {
        setSelectedTech(topic as Technology);
      }
    }
  }, [location.search]);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [currentFeedback, setCurrentFeedback] = useState<{ score: number; feedback: string } | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('text'); // Default to text to avoid permission prompt
  const [textAnswer, setTextAnswer] = useState('');
  const [quizHistory, setQuizHistory] = useState<QuizResultData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const resultsSavedRef = useRef(false);

  // Load quiz history when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadQuizResults().then(history => {
        setQuizHistory(history);
        console.log("📚 Loaded quiz history:", history.length, "tests");
      }).catch(err => {
        console.error("Failed to load quiz history:", err);
      });
    } else {
      setQuizHistory([]);
    }
  }, [isAuthenticated]);

  // Save quiz results when quiz completes (3 for General Knowledge, 5 for others)
  const maxQuestions = selectedTech === "General Knowledge" ? 3 : 5;
  useEffect(() => {
    if (!isInterviewActive && results.length > 0 && results.length === maxQuestions && selectedTech && isAuthenticated && !resultsSavedRef.current) {
      resultsSavedRef.current = true;
      const total = results.reduce((sum, r) => sum + r.score, 0);
      const maxScore = maxQuestions * 10;
      const avg = total / results.length;
      const quizGrade = avg >= 9 ? "A+" : avg >= 8 ? "A" : avg >= 7 ? "B" : avg >= 6 ? "C" : avg >= 5 ? "D" : "F";
      
      saveQuizResult({
        topic: selectedTech,
        totalScore: total,
        maxScore: maxScore,
        percentage: (total / maxScore) * 100,
        grade: quizGrade,
        questionsCount: results.length,
        results: results,
      }).then(() => {
        // Refresh history after saving
        loadQuizResults().then(history => {
          setQuizHistory(history);
        });
      }).catch(err => {
        console.error("Failed to save quiz result:", err);
      });
    }
  }, [isInterviewActive, results, selectedTech, isAuthenticated, maxQuestions]);

  // Reset the saved flag when starting a new quiz
  useEffect(() => {
    if (isInterviewActive) {
      resultsSavedRef.current = false;
    }
  }, [isInterviewActive]);

  const handleFinalTranscript = useCallback(
    async (text: string) => {
      // Just update the transcript, don't auto-submit
      // User will click Submit Answer button when ready
      console.log("📝 Transcript updated:", text);
    },
    []
  );

  const handleSubmitAnswer = async () => {
    const answerText = inputMode === 'text' ? textAnswer : transcript;
    if (!answerText || !isInterviewActive || isProcessing) return;
    
    // Prevent duplicate submissions
    if (currentFeedback) return;

    console.log("📝 Submitting answer:", answerText);
    setIsProcessing(true);
    if (inputMode === 'voice') stopListening();

    try {
      const result = await submitAnswer(sessionId, answerText);
      
      setResults((prev) => [
        ...prev,
        {
          question: currentQuestion,
          userAnswer: answerText,
          score: result.score,
          feedback: result.feedback,
        },
      ]);

      // Show feedback immediately
      setCurrentFeedback({ score: result.score, feedback: result.feedback });
      setIsProcessing(false);
      resetTranscript();
      setTextAnswer('');

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
    if (!selectedTech || isStarting) return;

    // Check access for the selected topic
    if (!canAccessQuizTopic(selectedTech)) {
      if (!isAuthenticated) {
        setShowAuthModal(true);
      } else {
        setShowCreditsModal(true);
      }
      return;
    }

    setIsStarting(true);
    try {
      // Use a credit for paid topics
      const isFree = FREE_QUIZ_TOPICS.includes(selectedTech);
      if (!isFree && isAuthenticated) {
        try {
          await useCredit();
        } catch (creditError) {
          console.error("Failed to use credit:", creditError);
          setIsStarting(false);
          return;
        }
      }
      
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
    } finally {
      setIsStarting(false);
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
    setTextAnswer('');
    stopListening();
  };

  const handleContinue = () => {
    setCurrentFeedback(null);
    resetTranscript(); // Clear any leftover transcript
    setTextAnswer(''); // Clear text answer
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
      <UserHeader />
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
          paddingTop: "4rem",
          paddingBottom: "1rem",
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
                <IonSelect
                  value={selectedTech}
                  onIonChange={(e) => setSelectedTech(e.detail.value)}
                  placeholder="Choose a discipline..."
                  interface="action-sheet"
                  style={{
                    width: "100%",
                    background: "#f8f9fa",
                    borderRadius: "8px",
                    padding: "0.5rem",
                    border: "1px solid #dee2e6",
                  }}
                >
                  <IonSelectOption value="General Knowledge">🎯 General Knowledge (FREE - 3 Questions)</IonSelectOption>
                  <IonSelectOption value="Product Owner">📋 Product Owner</IonSelectOption>
                  <IonSelectOption value="React">⚛️ React</IonSelectOption>
                  <IonSelectOption value="Angular">🅰️ Angular</IonSelectOption>
                  <IonSelectOption value="Java Developer">☕ Java Developer</IonSelectOption>
                  <IonSelectOption value="Python Developer">🐍 Python Developer</IonSelectOption>
                  <IonSelectOption value="Node.js Developer">💚 Node.js Developer</IonSelectOption>
                  <IonSelectOption value="SQL Developer">🗃️ SQL Developer</IonSelectOption>
                  <IonSelectOption value="AWS Solutions Architect">☁️ AWS Solutions Architect</IonSelectOption>
                  <IonSelectOption value="ServiceNow Developer">🔧 ServiceNow Developer</IonSelectOption>
                  <IonSelectOption value="Product Manager">📊 Product Manager</IonSelectOption>
                  <IonSelectOption value="Business Analysis">📈 Business Analysis</IonSelectOption>
                  <IonSelectOption value="QA Tester">🔍 QA Tester</IonSelectOption>
                  <IonSelectOption value="Solution Architect">🏗️ Solution Architect</IonSelectOption>
                  <IonSelectOption value="Scrum Master">🏃 Scrum Master</IonSelectOption>
                  <IonSelectOption value="DevOps Engineer">⚙️ DevOps Engineer</IonSelectOption>
                  <IonSelectOption value="Data Analyst">📊 Data Analyst</IonSelectOption>
                </IonSelect>
                
                {/* Access Info */}
                {selectedTech && (
                  <div style={{ 
                    marginTop: "1rem",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    background: canAccessQuizTopic(selectedTech) ? "#e8f5e9" : "#fff3e0",
                    border: `1px solid ${canAccessQuizTopic(selectedTech) ? "#4caf50" : "#ff9800"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}>
                    <IonIcon 
                      icon={canAccessQuizTopic(selectedTech) ? lockOpenOutline : lockClosed} 
                      style={{ 
                        fontSize: "1.2rem", 
                        color: canAccessQuizTopic(selectedTech) ? "#4caf50" : "#ff9800" 
                      }} 
                    />
                    <span style={{ 
                      fontSize: "0.9rem", 
                      color: canAccessQuizTopic(selectedTech) ? "#2e7d32" : "#e65100" 
                    }}>
                      {FREE_QUIZ_TOPICS.includes(selectedTech) 
                        ? "This topic is free for everyone!"
                        : canAccessQuizTopic(selectedTech)
                          ? `You have ${credits} credit${credits !== 1 ? 's' : ''} available`
                          : !isAuthenticated 
                            ? "Sign in to access this topic (3 free credits on signup!)"
                            : "You need credits to access this topic"
                      }
                    </span>
                  </div>
                )}
                
                <IonButton
                  expand="block"
                  size="large"
                  onClick={handleStartInterview}
                  disabled={!selectedTech || isStarting}
                  style={{
                    marginTop: "1.5rem",
                    "--background": selectedTech && canAccessQuizTopic(selectedTech) ? "#28a745" : "#ff9800",
                    "--background-hover": selectedTech && canAccessQuizTopic(selectedTech) ? "#218838" : "#f57c00",
                    "--color": "#ffffff",
                    fontWeight: "700",
                    fontSize: "1.2rem",
                    height: "60px",
                    boxShadow: `0 4px 12px ${selectedTech && canAccessQuizTopic(selectedTech) ? "rgba(40, 167, 69, 0.3)" : "rgba(255, 152, 0, 0.3)"}`,
                    opacity: !selectedTech || isStarting ? 0.5 : 1,
                  }}
                >
                  {isStarting ? (
                    <IonSpinner name="dots" style={{ marginRight: "0.5rem" }} />
                  ) : selectedTech && !canAccessQuizTopic(selectedTech) ? (
                    <IonIcon slot="start" icon={!isAuthenticated ? lockClosed : sparkles} />
                  ) : (
                    <IonIcon slot="start" icon={play} />
                  )}
                  {isStarting 
                    ? "Starting..." 
                    : selectedTech && !canAccessQuizTopic(selectedTech)
                      ? !isAuthenticated ? "Sign In to Start" : "Get Credits to Start"
                      : `Start Interview (${selectedTech === "General Knowledge" ? 3 : 5} Questions)`
                  }
                </IonButton>
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

            {/* Quiz History */}
            {isAuthenticated && quizHistory.length > 0 && (
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
                      cursor: "pointer",
                    }}
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    <h2
                      style={{
                        color: "#333333",
                        fontWeight: "600",
                        margin: 0,
                        fontSize: "1.2rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <IonIcon icon={timeOutline} />
                      Previous Tests ({quizHistory.length})
                    </h2>
                    <span style={{ color: "#0066cc", fontSize: "0.9rem" }}>
                      {showHistory ? "Hide ▲" : "Show ▼"}
                    </span>
                  </div>
                  
                  {showHistory && (
                    <div style={{ marginTop: "0.5rem" }}>
                      {quizHistory.slice(0, 10).map((quiz, i) => (
                        <div
                          key={quiz.id || i}
                          style={{
                            padding: "0.75rem",
                            marginBottom: "0.5rem",
                            background: "#f8f9fa",
                            borderRadius: "8px",
                            border: `2px solid ${
                              quiz.grade === "A+" || quiz.grade === "A"
                                ? "#28a745"
                                : quiz.grade === "B" || quiz.grade === "C"
                                ? "#ffc107"
                                : "#dc3545"
                            }`,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ 
                              fontWeight: "600", 
                              color: "#333333",
                              marginBottom: "0.25rem",
                            }}>
                              {quiz.topic}
                            </div>
                            <div style={{ 
                              fontSize: "0.8rem", 
                              color: "#6c757d" 
                            }}>
                              {new Date(quiz.completedAt).toLocaleDateString()} at{" "}
                              {new Date(quiz.completedAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div
                              style={{
                                fontSize: "1.5rem",
                                fontWeight: "bold",
                                color:
                                  quiz.grade === "A+" || quiz.grade === "A"
                                    ? "#28a745"
                                    : quiz.grade === "B" || quiz.grade === "C"
                                    ? "#ffc107"
                                    : "#dc3545",
                              }}
                            >
                              {quiz.grade}
                            </div>
                            <div style={{ 
                              fontSize: "0.8rem", 
                              color: "#6c757d" 
                            }}>
                              {quiz.totalScore}/{quiz.maxScore}
                            </div>
                          </div>
                        </div>
                      ))}
                      {quizHistory.length > 10 && (
                        <div style={{ 
                          textAlign: "center", 
                          color: "#6c757d",
                          fontSize: "0.9rem",
                          marginTop: "0.5rem",
                        }}>
                          Showing 10 of {quizHistory.length} tests
                        </div>
                      )}
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            )}
          </>
        ) : (
          <>
            {/* Progress with Cancel button */}
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
                    marginBottom: "0.75rem",
                  }}
                >
                  <div style={{ color: "#333333" }}>
                    <span style={{ fontWeight: "bold" }}>
                      Question {questionNumber}/{maxQuestions}
                    </span>
                    <span style={{ marginLeft: "1rem" }}>
                      Score: {totalScore}/{maxQuestions * 10}
                    </span>
                  </div>
                  <IonButton
                    size="small"
                    onClick={handleReset}
                    style={{
                      "--background": "#dc3545",
                      "--background-hover": "#c82333",
                      "--color": "#ffffff",
                      "--box-shadow": "none",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                    }}
                  >
                    <IonIcon slot="start" icon={close} />
                    Cancel
                  </IonButton>
                </div>
                <IonProgressBar value={questionNumber / maxQuestions} />
              </IonCardContent>
            </IonCard>

            {/* Current Question - hide while showing feedback */}
            {!currentFeedback && (
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
            )}

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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <h2
                    style={{
                      color: "#333333",
                      fontWeight: "600",
                      margin: 0,
                      fontSize: "1.2rem",
                    }}
                  >
                    {inputMode === 'voice' ? '🎤' : '⌨️'} Your Answer
                  </h2>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <IonButton
                      size="small"
                      fill={inputMode === 'text' ? 'solid' : 'outline'}
                      onClick={() => {
                        if (isListening) stopListening();
                        setInputMode('text');
                      }}
                      style={{
                        "--background": inputMode === 'text' ? "#0066cc" : "transparent",
                        "--color": inputMode === 'text' ? "#ffffff" : "#0066cc",
                        "--border-color": "#0066cc",
                      }}
                    >
                      <IonIcon slot="start" icon={keypadOutline} />
                      Type
                    </IonButton>
                    <IonButton
                      size="small"
                      fill={inputMode === 'voice' ? 'solid' : 'outline'}
                      onClick={() => setInputMode('voice')}
                      style={{
                        "--background": inputMode === 'voice' ? "#0066cc" : "transparent",
                        "--color": inputMode === 'voice' ? "#ffffff" : "#0066cc",
                        "--border-color": "#0066cc",
                      }}
                    >
                      <IonIcon slot="start" icon={mic} />
                      Voice
                    </IonButton>
                  </div>
                </div>

                {inputMode === 'text' ? (
                  <IonTextarea
                    value={textAnswer}
                    onIonInput={(e) => setTextAnswer(e.detail.value || '')}
                    placeholder="Type your answer here..."
                    rows={4}
                    style={{
                      background: "#e9ecef",
                      borderRadius: "8px",
                      padding: "0.5rem",
                      fontSize: "1rem",
                      "--color": "#212529",
                    }}
                  />
                ) : (
                  <>
                    <IonButton
                      expand="block"
                      onClick={isListening ? stopListening : startListening}
                      style={{
                        marginBottom: "0.5rem",
                        "--background": isListening ? "#dc3545" : "#28a745",
                        "--background-hover": isListening ? "#c82333" : "#218838",
                        "--color": "#ffffff",
                        fontWeight: "600",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <IonIcon slot="start" icon={isListening ? micOff : mic} />
                      {isListening ? "Stop Recording" : "Start Recording"}
                    </IonButton>
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
                        border: isListening ? "2px solid #28a745" : "1px solid #dee2e6",
                      }}
                    >
                      {transcript || (
                        <span style={{ opacity: 0.6, color: "#6c757d" }}>
                          {isListening
                            ? "Listening... Speak your answer."
                            : "Tap Start Recording and speak your answer"}
                        </span>
                      )}
                    </div>
                  </>
                )}

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
                  disabled={!(inputMode === 'text' ? textAnswer : transcript) || isProcessing || !!currentFeedback}
                  style={{
                    marginTop: "1rem",
                    "--background": "#28a745",
                    "--background-hover": "#218838",
                    "--color": "#ffffff",
                    fontWeight: "600",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    opacity: !(inputMode === 'text' ? textAnswer : transcript) || isProcessing || !!currentFeedback ? 0.5 : 1,
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
