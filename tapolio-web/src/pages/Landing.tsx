import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonIcon,
  IonPage,
} from "@ionic/react";
import { mic, school, chatbubbles, sparkles, rocketOutline, logoGithub, logoLinkedin, logoTwitter, mail } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import "./Landing.css";

const Landing: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent>
        <div
          style={{
            background: "#ffffff",
            minHeight: "100vh",
            padding: "2rem 1rem",
          }}
        >
          {/* Hero Section */}
          <div
            className="hero-section"
            style={{
              maxWidth: "800px",
              margin: "0 auto",
              textAlign: "center",
              paddingTop: "3rem",
            }}
          >
            <img 
              src="/tapolio_logo.png" 
              alt="Tapolio Logo" 
              className="hero-logo"
              style={{
                width: "180px",
                height: "auto",
                marginBottom: "1.5rem",
              }}
            />
            <h1
              style={{
                fontSize: "3rem",
                fontWeight: "700",
                margin: "0 0 1rem 0",
                lineHeight: "1.2",
                color: "#333333",
              }}
            >
              Tapolio
            </h1>
            <p
              style={{
                fontSize: "1.3rem",
                marginBottom: "2rem",
                color: "#6c757d",
                lineHeight: "1.6",
              }}
            >
              AI-Powered Voice Assistant for Technical Interview Practice
            </p>
            <IonButton
              size="large"
              onClick={() => history.push("/app")}
              className="cta-button"
              style={{
                "--background": "#0066cc",
                "--background-hover": "#0052a3",
                "--color": "#ffffff",
                "--border-radius": "50px",
                "--box-shadow": "none",
                fontWeight: "700",
                fontSize: "1.1rem",
                padding: "0 2.5rem",
                height: "56px",
              }}
            >
              <IonIcon slot="start" icon={rocketOutline} />
              Get Started
            </IonButton>
          </div>

          {/* Features Section */}
          <div
            style={{
              maxWidth: "1000px",
              margin: "4rem auto 2rem",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.5rem",
                padding: "0 1rem",
              }}
            >
              {/* Feature 1 */}
              <IonCard
                className="feature-card"
                style={{
                  background: "#ffffff",
                  border: "1px solid #dee2e6",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  cursor: "pointer",
                }}
              >
                <IonCardContent style={{ textAlign: "center", padding: "2rem" }}>
                  <IonIcon
                    icon={chatbubbles}
                    style={{ fontSize: "3rem", color: "#0066cc", marginBottom: "1rem" }}
                  />
                  <h2 style={{ color: "#333333", fontSize: "1.3rem", margin: "0 0 0.5rem 0" }}>
                    Live Copilot
                  </h2>
                  <p style={{ color: "#6c757d", lineHeight: "1.6", margin: 0 }}>
                    Ask technical questions using your voice and get instant AI-powered answers in real-time
                  </p>
                </IonCardContent>
              </IonCard>

              {/* Feature 2 */}
              <IonCard
                className="feature-card"
                style={{
                  background: "#ffffff",
                  border: "1px solid #dee2e6",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  cursor: "pointer",
                }}
              >
                <IonCardContent style={{ textAlign: "center", padding: "2rem" }}>
                  <IonIcon
                    icon={school}
                    style={{ fontSize: "3rem", color: "#28a745", marginBottom: "1rem" }}
                  />
                  <h2 style={{ color: "#333333", fontSize: "1.3rem", margin: "0 0 0.5rem 0" }}>
                    Live Quiz
                  </h2>
                  <p style={{ color: "#6c757d", lineHeight: "1.6", margin: 0 }}>
                    Practice technical interviews with AI scoring, feedback, and personalized hints for improvement
                  </p>
                </IonCardContent>
              </IonCard>

              {/* Feature 3 */}
              <IonCard
                className="feature-card"
                style={{
                  background: "#ffffff",
                  border: "1px solid #dee2e6",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  cursor: "pointer",
                }}
              >
                <IonCardContent style={{ textAlign: "center", padding: "2rem" }}>
                  <IonIcon
                    icon={mic}
                    style={{ fontSize: "3rem", color: "#ffc107", marginBottom: "1rem" }}
                  />
                  <h2 style={{ color: "#333333", fontSize: "1.3rem", margin: "0 0 0.5rem 0" }}>
                    Voice-First
                  </h2>
                  <p style={{ color: "#6c757d", lineHeight: "1.6", margin: 0 }}>
                    Fully voice-powered interface using cutting-edge speech recognition for natural conversations
                  </p>
                </IonCardContent>
              </IonCard>
            </div>
          </div>

          {/* Topics Section */}
          <div
            style={{
              maxWidth: "800px",
              margin: "3rem auto 4rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <IonIcon icon={sparkles} style={{ fontSize: "1.5rem", color: "#0066cc" }} />
              <h2 style={{ fontSize: "1.8rem", margin: 0, fontWeight: "600", color: "#333333" }}>
                Practice Topics
              </h2>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                justifyContent: "center",
              }}
            >
              {["React", "Angular", "Product Owner", "Product Manager", "Business Analysis", "QA Tester", "Solution Architect", "Scrum Master", "DevOps Engineer", "Data Analyst"].map((topic) => (
                <div
                  key={topic}
                  className="topic-pill"
                  style={{
                    background: "#f8f9fa",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "50px",
                    border: "1px solid #dee2e6",
                    fontSize: "1rem",
                    fontWeight: "500",
                    color: "#333333",
                    cursor: "pointer",
                  }}
                >
                  {topic}
                </div>
              ))}
            </div>
          </div>

          {/* How It Works Section */}
          <div
            style={{
              maxWidth: "900px",
              margin: "4rem auto",
              padding: "3rem 2rem",
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2 style={{ fontSize: "2rem", margin: "0 0 2rem 0", fontWeight: "600", color: "#333333", textAlign: "center" }}>
              How It Works
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "2rem",
              }}
            >
              {/* Live Copilot Use Case */}
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "3rem",
                    marginBottom: "1rem",
                  }}
                >
                  🎤
                </div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "600", color: "#0066cc", margin: "0 0 0.5rem 0" }}>
                  During Your Interview
                </h3>
                <p style={{ color: "#6c757d", lineHeight: "1.6", margin: 0 }}>
                  Use your microphone to listen to interview questions and get instant AI-powered answers in real-time. Perfect for quick assistance during live interviews.
                </p>
              </div>

              {/* Live Quiz Use Case */}
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "3rem",
                    marginBottom: "1rem",
                  }}
                >
                  💬
                </div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "600", color: "#28a745", margin: "0 0 0.5rem 0" }}>
                  Before Your Interview
                </h3>
                <p style={{ color: "#6c757d", lineHeight: "1.6", margin: 0 }}>
                  Practice with AI-generated interview questions. Get detailed feedback, scoring, and personalized hints to improve your performance before the big day.
                </p>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div
            style={{
              maxWidth: "900px",
              margin: "3rem auto",
              padding: "3rem 2rem",
              background: "linear-gradient(135deg, #0066cc 0%, #0052a3 100%)",
              borderRadius: "16px",
              textAlign: "center",
              color: "#ffffff",
            }}
          >
            <h2 style={{ fontSize: "2rem", margin: "0 0 1rem 0", fontWeight: "600" }}>
              Ace Your Next Interview
            </h2>
            <p style={{ fontSize: "1.1rem", marginBottom: "2rem", opacity: 0.95 }}>
              Start practicing with AI-powered feedback today
            </p>
            <IonButton
              size="large"
              onClick={() => history.push("/app")}
              className="cta-button"
              style={{
                "--background": "#ffffff",
                "--color": "#0066cc",
                "--border-radius": "50px",
                "--box-shadow": "none",
                fontWeight: "700",
                fontSize: "1.1rem",
                padding: "0 2.5rem",
                height: "56px",
              }}
            >
              <IonIcon slot="start" icon={rocketOutline} />
              Get Started
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Landing;
