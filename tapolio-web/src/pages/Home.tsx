import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
  IonAlert,
  useIonViewWillLeave,
  useIonViewWillEnter,
} from "@ionic/react";

import { mic, micOff, refresh, lockClosed, sparkles } from "ionicons/icons";
import { useCallback, useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { fetchSuggestion, resetConversation } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { saveConversation, loadConversation, clearConversation, ConversationMessage } from "../services/parse";
import UserHeader from "../components/UserHeader";

const MIN_CHARS_BEFORE_SUGGEST = 25; // Require meaningful question length
const SUGGEST_DEBOUNCE_MS = 2000; // Wait 2 seconds of silence before sending

let debounceTimer: number | undefined;
let lastSentText: string = ""; // Track what we've already sent to avoid duplicates

const Home: React.FC = () => {
  const history = useHistory();
  const { 
    isAuthenticated, 
    credits, 
    useCredit, 
    setShowAuthModal,
    setAuthModalMode,
    setShowCreditsModal 
  } = useAuth();
  
  const [suggestion, setSuggestion] = useState<string>("");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [loadingSuggestion, setLoadingSuggestion] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [outOfCredits, setOutOfCredits] = useState<boolean>(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [conversation, setConversation] = useState<
    { question: string; answer: string }[]
  >([]);

  // Load/clear conversation history when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      loadConversation().then(messages => {
        if (messages.length > 0) {
          setConversationHistory(messages);
          console.log("📚 Loaded conversation history:", messages.length, "messages");
        }
      }).catch(err => {
        console.error("Failed to load conversation:", err);
      });
    } else {
      // User logged out - clear local conversation
      setConversationHistory([]);
      setConversation([]);
    }
  }, [isAuthenticated]);

  // Check if user can use the Live Copilot
  const canUseCopilot = isAuthenticated && credits > 0;

  const handleFinalTranscript = useCallback(async (text: string) => {
    console.log("🎤 Final transcript received:", text);
    
    if (text.length < MIN_CHARS_BEFORE_SUGGEST) {
      console.log("⏭️ Skipping: too short (<25 chars)");
      return;
    }

    // Check access before making API call
    if (!isAuthenticated) {
      setApiError("Please log in to use Live Copilot");
      return;
    }
    
    if (credits <= 0) {
      setOutOfCredits(true);
      return;
    }

    // Clear any existing timer and set a new one
    // This ensures we wait for the user to stop speaking
    if (debounceTimer) window.clearTimeout(debounceTimer);

    debounceTimer = window.setTimeout(async () => {
      // Double-check we haven't already sent this (or very similar) text
      if (lastSentText && text.startsWith(lastSentText)) {
        const newPart = text.slice(lastSentText.length).trim();
        if (newPart.length < 20) {
          console.log("⏭️ Skipping: too similar to last sent text");
          return;
        }
      }
      
      console.log("✅ Debounce complete, sending to AI...");
      
      try {
        console.log("📤 Sending to API:", text);
        setLoadingSuggestion(true);
        setApiError(null);
        
        // Mark this text as sent
        lastSentText = text;

        const res = await fetchSuggestion(text);
        console.log("📥 Received from API:", res);

        if (typeof res.suggestion === "string" && res.suggestion.trim() !== "") {
          setSuggestion(res.suggestion);
          console.log("💬 Answer:", res.suggestion);
          
          // Only deduct credit AFTER successful non-empty response
          try {
            await useCredit();
          } catch (creditError) {
            console.error("Failed to deduct credit:", creditError);
            // Don't block the user - they got the response, just log the error
          }
          
          // Save to conversation history in Back4App
          const newMessages: ConversationMessage[] = [
            ...conversationHistory,
            { role: 'user' as const, content: text, timestamp: new Date() },
            { role: 'assistant' as const, content: res.suggestion, timestamp: new Date() }
          ];
          setConversationHistory(newMessages);
          
          // Save to Back4App (async, don't block)
          saveConversation(newMessages).then(() => {
            console.log("💾 Conversation saved to Back4App");
          }).catch(err => {
            console.error("Failed to save conversation:", err);
          });
          
          console.log("🔄 Resetting transcript after answer");
          resetTranscript();
          lastSentText = ""; // Clear so next question can be sent
        }

        if (Array.isArray(res.conversation) && res.conversation.length > 0) {
          setConversation(res.conversation);
          // Set the current question from the latest conversation entry
          const latest = res.conversation[res.conversation.length - 1];
          if (latest?.question) {
            setCurrentQuestion(latest.question);
          }
        }
      } catch (e: any) {
        console.error(e);
        setApiError(e.message || "Failed to get suggestion");
      } finally {
        setLoadingSuggestion(false);
      }
    }, SUGGEST_DEBOUNCE_MS);
  }, [isAuthenticated, credits, useCredit, conversationHistory]);

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

  // Stop listening when out of credits
  useEffect(() => {
    if (outOfCredits && isListening) {
      stopListening();
    }
  }, [outOfCredits, isListening, stopListening]);

  // Reset outOfCredits when credits are added
  useEffect(() => {
    if (credits > 0 && outOfCredits) {
      setOutOfCredits(false);
    }
  }, [credits, outOfCredits]);

  // Stop listening when leaving this tab
  useIonViewWillLeave(() => {
    if (isListening) {
      stopListening();
    }
  }, [isListening, stopListening]);

  // Load conversation when entering the page (if logged in)
  useIonViewWillEnter(() => {
    // Clear UI state but preserve conversation history
    setCurrentQuestion("");
    setSuggestion("");
    setApiError(null);
    
    // Load conversation from Back4App if authenticated
    if (isAuthenticated) {
      loadConversation().then(messages => {
        if (messages.length > 0) {
          setConversationHistory(messages);
          console.log("📚 Loaded conversation history:", messages.length, "messages");
        }
      }).catch(err => {
        console.error("Failed to load conversation:", err);
      });
    } else {
      // Not logged in - clear local conversation
      setConversation([]);
      setConversationHistory([]);
    }
  }, [isAuthenticated]);

  const handleReset = () => {
    resetTranscript();
    setSuggestion("");
    setCurrentQuestion("");
    setConversation([]);
    setApiError(null);
    lastSentText = ""; // Clear so next question can be sent
    // Don't reset outOfCredits here - they still need to buy credits
  };

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearConversation = async () => {
    try {
      await resetConversation();
      setConversation([]);
      setCurrentQuestion("");
      
      // Also clear from Back4App
      setConversationHistory([]);
      await clearConversation();
      
      console.log("🗑️ Conversation cleared");
    } catch (e) {
      console.error("Failed to clear conversation:", e);
    }
  };

  return (
    <IonPage>
      <UserHeader />
      <IonContent className="ion-padding" style={{
        background: "#f5f5f5",
        "--background": "#f5f5f5"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Logo */}
        <div style={{ 
          textAlign: "center", 
          paddingTop: "4rem",
          paddingBottom: "1rem"
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
            Live Copilot
          </h1>
        </div>
        {!isSupported && (
          <IonCard style={{
            background: "#ffffff",
            border: "1px solid #dc3545",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
          }}>
            <IonCardContent style={{ color: "#dc3545" }}>
              Your browser doesn&apos;t support Speech Recognition. Try Chrome or Edge.
            </IonCardContent>
          </IonCard>
        )}

        {speechError && (
          <IonCard style={{
            background: "#fff3cd",
            border: "1px solid #ffc107",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
          }}>
            <IonCardContent style={{ color: "#856404" }}>
              Speech error: {speechError}
            </IonCardContent>
          </IonCard>
        )}

        {/* Access Control Card */}
        {!canUseCopilot && (
          <IonCard style={{
            background: "linear-gradient(135deg, #0066cc 0%, #0052a3 100%)",
            border: "none",
            boxShadow: "0 4px 12px rgba(0, 102, 204, 0.3)",
            color: "#ffffff",
          }}>
            <IonCardContent style={{ 
              textAlign: "center", 
              padding: "2rem",
            }}>
              <IonIcon 
                icon={lockClosed} 
                style={{ fontSize: "2.5rem", marginBottom: "1rem" }} 
              />
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", fontWeight: "600" }}>
                {!isAuthenticated 
                  ? "Sign in to Use Live Copilot" 
                  : "No Credits Remaining"}
              </h3>
              <p style={{ margin: "0 0 1.5rem 0", opacity: 0.9, fontSize: "0.95rem" }}>
                {!isAuthenticated 
                  ? "Create a free account to get 5 credits and start using the AI interview copilot." 
                  : "Purchase more credits to continue using the Live Copilot feature."}
              </p>
              <IonButton
                onClick={() => {
                  if (!isAuthenticated) {
                    setAuthModalMode('signup');
                    setShowAuthModal(true);
                  } else {
                    setShowCreditsModal(true);
                  }
                }}
                style={{
                  "--background": "#ffffff",
                  "--color": "#0066cc",
                  "--border-radius": "25px",
                  fontWeight: "600",
                  padding: "0 1.5rem",
                }}
              >
                <IonIcon slot="start" icon={!isAuthenticated ? lockClosed : sparkles} />
                {!isAuthenticated ? "Sign Up Free" : "Get More Credits"}
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}

        {/* API Error (not credit-related) */}
        {apiError && !outOfCredits && (
          <IonCard style={{
            background: "#fff3cd",
            border: "1px solid #ffc107",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
          }}>
            <IonCardContent style={{ color: "#856404" }}>
              ⚠️ {apiError}
            </IonCardContent>
          </IonCard>
        )}

        {/* Controls */}
        <IonCard style={{
          background: "#ffffff",
          border: "1px solid #dee2e6",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          opacity: canUseCopilot ? 1 : 0.6,
        }}>
          <IonCardContent>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <IonButton
                style={{
                  "--background": isListening ? "#dc3545" : "#0066cc",
                  "--background-hover": isListening ? "#c82333" : "#0052a3",
                  "--color": "#ffffff",
                  fontWeight: "600",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                }}
                onClick={isListening ? stopListening : startListening}
                disabled={!isSupported || !canUseCopilot}
              >
                <IonIcon slot="start" icon={isListening ? micOff : mic} />
                {isListening ? "Stop Listening" : "Start Listening"}
              </IonButton>

              <IonButton
                style={{
                  "--background": "#6c757d",
                  "--background-hover": "#5a6268",
                  "--color": "#ffffff",
                  fontWeight: "600",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                }}
                onClick={handleReset}
                disabled={!transcript && !suggestion && conversation.length === 0}
              >
                <IonIcon slot="start" icon={refresh} />
                Reset
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Transcript */}
        <IonCard style={{
          background: "#ffffff",
          border: "1px solid #dee2e6",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
        }}>
          <IonCardContent>
            <h2 style={{ 
              color: "#333333",
              fontWeight: "600",
              marginBottom: "1rem",
              fontSize: "1.2rem"
            }}>
              🎤 Transcript
            </h2>
            <div
              style={{
                borderRadius: 8,
                padding: "0.75rem",
                minHeight: 120,
                fontSize: "0.9rem",
                whiteSpace: "pre-wrap",
                background: "#e9ecef",
                color: "#212529",
                fontFamily: "monospace",
              }}
            >
              {transcript || (
                <span style={{ opacity: 0.6, color: "#6c757d" }}>
                  Start talking and Tapolio will keep track.
                </span>
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Live suggestion */}
        <IonCard style={{
          background: "#0a0a0a",
          border: "2px solid #00ff00",
          boxShadow: "0 0 20px rgba(0, 255, 0, 0.3)"
        }}>
          <IonCardContent>
            <h2 style={{ 
              color: "#00ff00",
              fontWeight: "600",
              marginBottom: "1rem",
              fontSize: "1.2rem",
              textShadow: "0 0 10px rgba(0, 255, 0, 0.5)"
            }}>
              🤖 AI Suggestion
            </h2>

            <div
              style={{
                background: "#0d0d0d",
                color: "#00ff00",
                borderRadius: 8,
                padding: "1rem",
                paddingTop: loadingSuggestion ? "2.5rem" : "1rem",
                minHeight: 80,
                fontSize: "0.95rem",
                position: "relative",
                border: "1px solid #00aa00",
                fontFamily: "'Fira Code', 'Consolas', monospace",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
                textShadow: "0 0 5px rgba(0, 255, 0, 0.3)"
              }}
            >
              {loadingSuggestion && (
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.8rem",
                    color: "#00ff00",
                    background: "#0d0d0d",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  <IonSpinner name="dots" style={{ "--color": "#00ff00" }} />
                  <span>Processing…</span>
                </div>
              )}

              {suggestion ? (
                <>
                  {currentQuestion && (
                    <div style={{ marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid #00aa00" }}>
                      <span style={{ color: "#00aaff", fontWeight: "bold" }}>Q: </span>
                      <span style={{ color: "#66ffff" }}>{currentQuestion}</span>
                    </div>
                  )}
                  <div 
                    style={{ whiteSpace: "pre-wrap" }}
                    dangerouslySetInnerHTML={{ 
                      __html: suggestion
                        .replace(/\*\*(.+?)\*\*/g, '<strong style="color: #00ff88;">$1</strong>')
                        .replace(/\n/g, '<br/>')
                        .replace(/^- /gm, '• ')
                        .replace(/^\d+\. /gm, (match) => `<span style="color: #00ffcc;">${match}</span>`)
                    }} 
                  />
                </>
              ) : (
                <span style={{ opacity: 0.6, color: "#00aa00" }}>
                  Ask something technical and Tapolio will answer.
                </span>
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Conversation history */}
        <IonCard style={{
          background: "#ffffff",
          border: "1px solid #dee2e6",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
        }}>
          <IonCardContent>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "1rem"
            }}>
              <h2 style={{ 
                color: "#333333",
                fontWeight: "600",
                margin: 0,
                fontSize: "1.2rem"
              }}>
                💬 Conversation {(conversation.length > 0 || conversationHistory.length > 0) && `(${Math.max(conversation.length, Math.floor(conversationHistory.length / 2))})`}
              </h2>
              {(conversation.length > 0 || conversationHistory.length > 0) && (
                <IonButton
                  size="small"
                  style={{
                    "--background": "#dc3545",
                    "--background-hover": "#c82333",
                    "--color": "#ffffff",
                    fontWeight: "600",
                    fontSize: "0.8rem",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                  }}
                  onClick={() => setShowClearConfirm(true)}
                >
                  🗑️ Clear
                </IonButton>
              )}
            </div>

            {/* Show API conversation if available, otherwise show saved history */}
            {conversation.length > 0 ? (
              <div>
                {[...conversation].reverse().map((c, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      marginBottom: "1rem",
                      paddingBottom: "1rem",
                      borderBottom: i < conversation.length - 1 ? "1px solid #dee2e6" : "none",
                      background: "#f8f9fa",
                      padding: "1rem",
                      borderRadius: "8px",
                      border: "1px solid #dee2e6"
                    }}
                  >
                    <div style={{ marginBottom: "0.5rem" }}>
                      <strong style={{ 
                        color: "#0066cc",
                        fontSize: "1rem"
                      }}>Q:</strong> 
                      <span style={{ color: "#333333", marginLeft: "0.5rem" }}>{c.question}</span>
                    </div>
                    <div style={{ lineHeight: "1.6" }}>
                      <strong style={{ 
                        color: "#28a745",
                        fontSize: "1rem"
                      }}>A:</strong> 
                      <span 
                        style={{ color: "#333333", marginLeft: "0.5rem" }}
                        dangerouslySetInnerHTML={{ 
                          __html: c.answer
                            .replace(/\*\*(.+?)\*\*/g, '<strong style="color: #0066cc;">$1</strong>')
                            .replace(/\n/g, '<br/>')
                            .replace(/^- /gm, '• ')
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversationHistory.length > 0 ? (
              <div>
                {/* Group conversationHistory into Q&A pairs (user message followed by assistant) */}
                {(() => {
                  const pairs: { question: string; answer: string }[] = [];
                  for (let i = 0; i < conversationHistory.length; i += 2) {
                    const userMsg = conversationHistory[i];
                    const assistantMsg = conversationHistory[i + 1];
                    if (userMsg?.role === 'user' && assistantMsg?.role === 'assistant') {
                      pairs.push({ question: userMsg.content, answer: assistantMsg.content });
                    }
                  }
                  return [...pairs].reverse().map((c, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        marginBottom: "1rem",
                        paddingBottom: "1rem",
                        borderBottom: i < pairs.length - 1 ? "1px solid #dee2e6" : "none",
                        background: "#f8f9fa",
                        padding: "1rem",
                        borderRadius: "8px",
                        border: "1px solid #dee2e6"
                      }}
                    >
                      <div style={{ marginBottom: "0.5rem" }}>
                        <strong style={{ 
                          color: "#0066cc",
                          fontSize: "1rem"
                        }}>Q:</strong> 
                        <span style={{ color: "#333333", marginLeft: "0.5rem" }}>{c.question}</span>
                      </div>
                      <div style={{ lineHeight: "1.6" }}>
                        <strong style={{ 
                          color: "#28a745",
                          fontSize: "1rem"
                        }}>A:</strong> 
                        <span 
                          style={{ color: "#333333", marginLeft: "0.5rem" }}
                          dangerouslySetInnerHTML={{ 
                            __html: c.answer
                              .replace(/\*\*(.+?)\*\*/g, '<strong style="color: #0066cc;">$1</strong>')
                              .replace(/\n/g, '<br/>')
                              .replace(/^- /gm, '• ')
                          }} 
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <span style={{ opacity: 0.6, color: "#888888" }}>
                Questions and answers will appear here.
              </span>
            )}
          </IonCardContent>
        </IonCard>
        </div>
      </IonContent>

      {/* Clear conversation confirmation */}
      <IonAlert
        isOpen={showClearConfirm}
        onDidDismiss={() => setShowClearConfirm(false)}
        header="Clear Conversation"
        message="Are you sure you want to clear all conversation history? This cannot be undone."
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary',
          },
          {
            text: 'Clear All',
            role: 'destructive',
            handler: () => {
              handleClearConversation();
            },
          },
        ]}
      />
    </IonPage>
  );
};

export default Home;
