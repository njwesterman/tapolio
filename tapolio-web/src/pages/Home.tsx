import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonViewWillLeave,
} from "@ionic/react";

import { mic, micOff, refresh } from "ionicons/icons";
import { useCallback, useState } from "react";
import { useHistory } from "react-router-dom";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { fetchSuggestion, resetConversation } from "../services/api";

const MIN_CHARS_BEFORE_SUGGEST = 10;
const SUGGEST_DEBOUNCE_MS = 1200;

let debounceTimer: number | undefined;

const Home: React.FC = () => {
  const history = useHistory();
  const [suggestion, setSuggestion] = useState<string>("");
  const [loadingSuggestion, setLoadingSuggestion] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<
    { question: string; answer: string }[]
  >([]);

  const handleFinalTranscript = useCallback((text: string) => {
    console.log("🎤 Final transcript received:", text);
    
    if (text.length < MIN_CHARS_BEFORE_SUGGEST) {
      console.log("⏭️ Skipping: too short");
      return;
    }

    console.log("✅ Sending to AI for processing...");
    if (debounceTimer) window.clearTimeout(debounceTimer);

    debounceTimer = window.setTimeout(async () => {
      try {
        console.log("📤 Sending to API:", text);
        setLoadingSuggestion(true);
        setApiError(null);

        const res = await fetchSuggestion(text);
        console.log("📥 Received from API:", res);

        if (typeof res.suggestion === "string") {
          setSuggestion(res.suggestion);
          console.log("💬 Answer:", res.suggestion);
          
          if (res.suggestion && res.suggestion !== "") {
            console.log("🔄 Resetting transcript after answer");
            resetTranscript();
          }
        }

        if (Array.isArray(res.conversation)) {
          setConversation(res.conversation);
        }
      } catch (e: any) {
        console.error(e);
        setApiError(e.message || "Failed to get suggestion");
      } finally {
        setLoadingSuggestion(false);
      }
    }, SUGGEST_DEBOUNCE_MS);
  }, []);

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

  const handleReset = () => {
    resetTranscript();
    setSuggestion("");
    setConversation([]);
    setApiError(null);
  };

  const handleClearConversation = async () => {
    try {
      await resetConversation();
      setConversation([]);
      console.log("🗑️ Conversation cleared");
    } catch (e) {
      console.error("Failed to clear conversation:", e);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{
        background: "#f5f5f5",
        "--background": "#f5f5f5"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Logo */}
        <div style={{ 
          textAlign: "center", 
          paddingTop: "2rem",
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

        {apiError && (
          <IonCard style={{
            background: "#fff3cd",
            border: "1px solid #ffc107",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
          }}>
            <IonCardContent style={{ color: "#856404" }}>
              AI error: {apiError}
            </IonCardContent>
          </IonCard>
        )}

        {/* Controls */}
        <IonCard style={{
          background: "#ffffff",
          border: "1px solid #dee2e6",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
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
                disabled={!isSupported}
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
          background: "#ffffff",
          border: "2px solid #28a745",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
        }}>
          <IonCardContent>
            <h2 style={{ 
              color: "#333333",
              fontWeight: "600",
              marginBottom: "1rem",
              fontSize: "1.2rem"
            }}>
              🤖 AI Suggestion
            </h2>

            <div
              style={{
                background: "#f8f9fa",
                color: "#333333",
                borderRadius: 8,
                padding: "0.75rem",
                minHeight: 80,
                fontSize: "0.9rem",
                position: "relative",
                border: "1px solid #dee2e6"
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
                    color: "#6c757d"
                  }}
                >
                  <IonSpinner name="dots" />
                  <span>Thinking…</span>
                </div>
              )}

              {suggestion ? (
                suggestion
              ) : (
                <span style={{ opacity: 0.6, color: "#6c757d" }}>
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
                💬 Conversation {conversation.length > 0 && `(${conversation.length})`}
              </h2>
              {conversation.length > 0 && (
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
                  onClick={handleClearConversation}
                >
                  🗑️ Clear
                </IonButton>
              )}
            </div>

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
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                      <strong style={{ 
                        color: "#28a745",
                        fontSize: "1rem"
                      }}>A:</strong> 
                      <span style={{ color: "#495057", marginLeft: "0.5rem" }}>{c.answer}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ opacity: 0.6, color: "#6c757d" }}>
                Questions and answers will appear here.
              </span>
            )}
          </IonCardContent>
        </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
