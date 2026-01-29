import { IonButton, IonIcon } from "@ionic/react";
import { sparkles, personCircle, logOut } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface UserHeaderProps {
  transparent?: boolean;
}

const UserHeader: React.FC<UserHeaderProps> = ({ transparent = false }) => {
  const { 
    isAuthenticated, 
    user, 
    credits, 
    logout, 
    setShowAuthModal,
    setAuthModalMode,
    setShowCreditsModal 
  } = useAuth();
  const history = useHistory();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        padding: "0.75rem 1.5rem 0.75rem 1rem",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "0.75rem",
        background: transparent ? "transparent" : "#f5f5f5",
        zIndex: 100,
      }}
    >
      {isAuthenticated ? (
        <>
          {/* Credits Badge - Clickable */}
          <div
            onClick={() => setShowCreditsModal(true)}
            style={{
              background: "#28a745",
              color: "#ffffff",
              padding: "0.35rem 0.75rem",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <IonIcon icon={sparkles} style={{ fontSize: "0.9rem" }} />
            {credits} Credits
          </div>
          
          {/* User Email - Clickable to Profile */}
          <div
            onClick={() => history.push("/profile")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              color: "#333333",
              fontSize: "0.9rem",
              cursor: "pointer",
              padding: "0.25rem 0.5rem",
              borderRadius: "8px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 102, 204, 0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <IonIcon icon={personCircle} style={{ fontSize: "1.3rem", color: "#0066cc" }} />
            <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "none" }}>
              {user?.email}
            </span>
          </div>
          
          {/* Logout Button */}
          <IonButton
            fill="clear"
            size="small"
            onClick={logout}
            style={{
              "--color": "#6c757d",
              fontSize: "0.85rem",
            }}
          >
            <IonIcon icon={logOut} slot="start" />
            Logout
          </IonButton>
        </>
      ) : (
        <>
          <IonButton
            fill="clear"
            size="small"
            onClick={() => {
              setAuthModalMode('login');
              setShowAuthModal(true);
            }}
            style={{
              "--color": "#0066cc",
              fontSize: "0.9rem",
              fontWeight: "500",
            }}
          >
            Log In
          </IonButton>
          <IonButton
            size="small"
            onClick={() => {
              setAuthModalMode('signup');
              setShowAuthModal(true);
            }}
            style={{
              "--background": "#0066cc",
              "--border-radius": "20px",
              fontSize: "0.9rem",
              fontWeight: "500",
            }}
          >
            Sign Up
          </IonButton>
        </>
      )}
    </div>
  );
};

export default UserHeader;
