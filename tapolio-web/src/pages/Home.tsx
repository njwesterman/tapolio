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
} from "@ionic/react";

import { mic, micOff, refresh } from "ionicons/icons";
import { useCallback, useState } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { fetchSuggestion, resetConversation } from "../services/api";

const MIN_CHARS_BEFORE_SUGGEST = 10;          // lower, since we're doing questions
const SUGGEST_DEBOUNCE_MS = 1200;

let debounceTimer: number | undefined;

const Home: React.FC = () => {
  const [suggestion, setSuggestion] = useState<string>("");
  const [loadingSuggestion, setLoadingSuggestion] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // NEW: conversation history from server
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

        // server now returns { suggestion, conversation }
        if (typeof res.suggestion === "string") {
          setSuggestion(res.suggestion);
          console.log("💬 Answer:", res.suggestion);
          
          // Reset transcript after successful question processing
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
      <IonHeader>
        <IonToolbar style={{ 
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderBottom: "2px solid #6df76d",
          "--background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          "--color": "#fff",
        }}>
          <IonTitle style={{ 
            fontWeight: "bold",
            textShadow: "0 0 10px rgba(109, 247, 109, 0.5)",
            color: "#fff",
          }}>
            ⚡ Tapolio · Live Copilot
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{
        background: "linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        "--background": "transparent"
      }}>
        {!isSupported && (
          <IonCard style={{
            background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
            border: "1px solid #ff6b6b",
            boxShadow: "0 0 20px rgba(231, 76, 60, 0.3)"
          }}>
            <IonCardContent style={{ color: "#fff" }}>
              Your browser doesn&apos;t support Speech Recognition. Try Chrome
              or Edge. Or just scream into the void, up to you.
            </IonCardContent>
          </IonCard>
        )}

        {speechError && (
          <IonCard style={{
            background: "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)",
            border: "1px solid #ffa502",
            boxShadow: "0 0 20px rgba(243, 156, 18, 0.3)"
          }}>
            <IonCardContent style={{ color: "#fff" }}>
              Speech error: {speechError}
            </IonCardContent>
          </IonCard>
        )}

        {apiError && (
          <IonCard style={{
            background: "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)",
            border: "1px solid #ffa502",
            boxShadow: "0 0 20px rgba(243, 156, 18, 0.3)"
          }}>
            <IonCardContent style={{ color: "#fff" }}>
              AI error: {apiError}
            </IonCardContent>
          </IonCard>
        )}

        {/* Controls */}
        <IonCard style={{
          background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
          border: "1px solid #4a90e2",
          boxShadow: "0 0 30px rgba(74, 144, 226, 0.2)"
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
                  background: isListening 
                    ? "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  fontWeight: "bold",
                  boxShadow: isListening 
                    ? "0 0 20px rgba(255, 107, 107, 0.5)"
                    : "0 0 20px rgba(102, 126, 234, 0.5)",
                  border: "none"
                }}
                onClick={isListening ? stopListening : startListening}
                disabled={!isSupported}
              >
                <IonIcon slot="start" icon={isListening ? micOff : mic} />
                {isListening ? "Stop Listening" : "Start Listening"}
              </IonButton>

              <IonButton
                style={{
                  background: "linear-gradient(135deg, #434343 0%, #000000 100%)",
                  fontWeight: "bold",
                  border: "1px solid #666",
                  boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)"
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
          background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
          border: "1px solid #52c7f2",
          boxShadow: "0 0 30px rgba(82, 199, 242, 0.2)"
        }}>
          <IonCardContent>
            <h2 style={{ 
              color: "#52c7f2",
              textShadow: "0 0 10px rgba(82, 199, 242, 0.5)",
              fontWeight: "bold",
              marginBottom: "1rem"
            }}>
              🎤 Transcript
            </h2>
            <div
              style={{
                border: "2px solid #52c7f2",
                borderRadius: 8,
                padding: "0.75rem",
                minHeight: 120,
                fontSize: "0.9rem",
                whiteSpace: "pre-wrap",
                background: "rgba(0, 0, 0, 0.3)",
                color: "#e0e0e0",
                boxShadow: "inset 0 0 15px rgba(82, 199, 242, 0.1)"
              }}
            >
              {transcript || (
                <span style={{ opacity: 0.6, color: "#52c7f2" }}>
                  Start talking and Tapolio will keep track.
                </span>
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Live suggestion */}
        <IonCard style={{
          background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
          border: "2px solid #6df76d",
          boxShadow: "0 0 40px rgba(109, 247, 109, 0.4)"
        }}>
          <IonCardContent>
            <h2 style={{ 
              color: "#6df76d",
              textShadow: "0 0 15px rgba(109, 247, 109, 0.8)",
              fontWeight: "bold",
              marginBottom: "1rem"
            }}>
              🤖 AI Suggestion
            </h2>

            <div
              style={{
                background: "#050608",
                color: "#6df76d",
                borderRadius: 8,
                padding: "0.75rem",
                minHeight: 80,
                fontFamily: "monospace",
                fontSize: "0.9rem",
                position: "relative",
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
                    opacity: 0.8,
                  }}
                >
                  <IonSpinner name="dots" />
                  <span>Thinking…</span>
                </div>
              )}

              {suggestion ? (
                suggestion
              ) : (
                <span style={{ opacity: 0.6 }}>
                  Ask something technical and Tapolio will answer. No small
                  talk, no rambling.
                </span>
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Conversation history */}
        <IonCard style={{
          background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
          border: "1px solid #a8dadc",
          boxShadow: "0 0 30px rgba(168, 218, 220, 0.2)"
        }}>
          <IonCardContent>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "1rem"
            }}>
              <h2 style={{ 
                color: "#a8dadc",
                textShadow: "0 0 10px rgba(168, 218, 220, 0.5)",
                fontWeight: "bold",
                margin: 0
              }}>
                💬 Conversation {conversation.length > 0 && `(${conversation.length})`}
              </h2>
              {conversation.length > 0 && (
                <IonButton
                  size="small"
                  style={{
                    background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                    boxShadow: "0 0 10px rgba(231, 76, 60, 0.3)",
                    border: "none"
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
                      borderBottom: i < conversation.length - 1 ? "2px solid rgba(168, 218, 220, 0.2)" : "none",
                      background: "rgba(0, 0, 0, 0.2)",
                      padding: "1rem",
                      borderRadius: "8px",
                      border: "1px solid rgba(168, 218, 220, 0.1)"
                    }}
                  >
                    <div style={{ marginBottom: "0.5rem" }}>
                      <strong style={{ 
                        color: "#52c7f2",
                        textShadow: "0 0 5px rgba(82, 199, 242, 0.5)",
                        fontSize: "1rem"
                      }}>Q:</strong> 
                      <span style={{ color: "#e0e0e0", marginLeft: "0.5rem" }}>{c.question}</span>
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                      <strong style={{ 
                        color: "#6df76d",
                        textShadow: "0 0 5px rgba(109, 247, 109, 0.5)",
                        fontSize: "1rem"
                      }}>A:</strong> 
                      <span style={{ color: "#d0d0d0", marginLeft: "0.5rem" }}>{c.answer}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ opacity: 0.6, color: "#a8dadc" }}>
                Questions and answers will appear here.
              </span>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Home;
