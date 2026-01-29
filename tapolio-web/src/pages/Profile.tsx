import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
  IonInput,
  IonAlert,
} from "@ionic/react";
import {
  personCircle,
  lockClosed,
  trash,
  sparkles,
  statsChart,
  documentOutline,
  downloadOutline,
  arrowBack,
  logOut,
  timeOutline,
  checkmarkCircle,
  alertCircle,
} from "ionicons/icons";
import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import UserHeader from "../components/UserHeader";
import {
  changePassword,
  deleteAccount,
  getAccountStats,
  exportUserData,
  clearAllQuizHistory,
  getTransactionHistory,
  TransactionData,
  AccountStats,
  loadQuizResults,
  QuizResultData,
} from "../services/parse";

const Profile: React.FC = () => {
  const history = useHistory();
  const { user, credits, logout, setShowCreditsModal, refreshUser, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<QuizResultData[]>([]);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Clear history state
  const [showClearQuizConfirm, setShowClearQuizConfirm] = useState(false);

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [statsData, transData, quizData] = await Promise.all([
          getAccountStats(),
          getTransactionHistory(),
          loadQuizResults(),
        ]);
        setStats(statsData);
        setTransactions(transData);
        setRecentQuizzes(quizData.slice(0, 5));
      } catch (e) {
        console.error("Failed to load profile data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordChange(false);
    } catch (e: any) {
      setPasswordError(e.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== user?.email) {
      return;
    }

    setDeleting(true);
    try {
      await deleteAccount();
      await logout();
      history.push("/");
    } catch (e) {
      console.error("Failed to delete account:", e);
      setDeleting(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tapolio-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to export data:", e);
    }
  };

  const handleClearQuizHistory = async () => {
    try {
      await clearAllQuizHistory();
      setRecentQuizzes([]);
      // Refresh stats
      const newStats = await getAccountStats();
      setStats(newStats);
    } catch (e) {
      console.error("Failed to clear quiz history:", e);
    }
  };

  // Redirect if not logged in (after auth has loaded)
  useEffect(() => {
    if (!authLoading && !user) {
      history.push("/");
    }
  }, [authLoading, user, history]);

  // Show loading while auth is loading or data is loading
  if (authLoading || !user) {
    return (
      <IonPage>
        <IonContent className="ion-padding" style={{ background: "#f5f5f5", "--background": "#f5f5f5" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

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
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {/* Back button and title with logo */}
          <div
            style={{
              paddingTop: "4rem",
              paddingBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <IonButton
              fill="clear"
              onClick={() => history.goBack()}
              style={{ "--color": "#333" }}
            >
              <IonIcon icon={arrowBack} />
            </IonButton>
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  color: "#333333",
                  fontSize: "1.8rem",
                  fontWeight: "600",
                  margin: 0,
                }}
              >
                My Profile
              </h1>
            </div>
            {/* Logo */}
            <div 
              onClick={() => history.push("/")}
              style={{ 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <img 
                src="/tapolio_logo.png" 
                alt="Tapolio" 
                style={{ height: "40px" }}
              />
            </div>
          </div>

          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "3rem",
              }}
            >
              <IonSpinner name="crescent" />
            </div>
          ) : (
            <>
              {/* Account Info */}
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
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <IonIcon icon={personCircle} style={{ color: "#0066cc" }} />
                    Account
                  </h2>

                  <div style={{ marginBottom: "1rem" }}>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "#6c757d",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Email
                    </div>
                    <div style={{ fontSize: "1.1rem", color: "#333" }}>
                      {user.email}
                    </div>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "#6c757d",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Member Since
                    </div>
                    <div style={{ fontSize: "1.1rem", color: "#333" }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <IonButton
                    fill="outline"
                    size="small"
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    style={{
                      "--border-color": "#0066cc",
                      "--color": "#0066cc",
                    }}
                  >
                    <IonIcon slot="start" icon={lockClosed} />
                    Change Password
                  </IonButton>

                  {showPasswordChange && (
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "1rem",
                        background: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <IonInput
                        type="password"
                        placeholder="Current Password"
                        value={currentPassword}
                        onIonInput={(e) =>
                          setCurrentPassword(e.detail.value || "")
                        }
                        style={{
                          background: "#fff",
                          marginBottom: "0.5rem",
                          borderRadius: "4px",
                          border: "1px solid #dee2e6",
                        }}
                      />
                      <IonInput
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onIonInput={(e) => setNewPassword(e.detail.value || "")}
                        style={{
                          background: "#fff",
                          marginBottom: "0.5rem",
                          borderRadius: "4px",
                          border: "1px solid #dee2e6",
                        }}
                      />
                      <IonInput
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onIonInput={(e) =>
                          setConfirmPassword(e.detail.value || "")
                        }
                        style={{
                          background: "#fff",
                          marginBottom: "0.5rem",
                          borderRadius: "4px",
                          border: "1px solid #dee2e6",
                        }}
                      />
                      {passwordError && (
                        <div
                          style={{
                            color: "#dc3545",
                            fontSize: "0.9rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div
                          style={{
                            color: "#28a745",
                            fontSize: "0.9rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Password changed successfully!
                        </div>
                      )}
                      <IonButton
                        size="small"
                        onClick={handleChangePassword}
                        disabled={changingPassword}
                        style={{
                          "--background": "#0066cc",
                        }}
                      >
                        {changingPassword ? (
                          <IonSpinner name="dots" />
                        ) : (
                          "Update Password"
                        )}
                      </IonButton>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>

              {/* Credits & Transactions */}
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
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <IonIcon icon={sparkles} style={{ color: "#28a745" }} />
                    Credits & Purchases
                  </h2>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "1rem",
                      padding: "1rem",
                      background: "#e8f5e9",
                      borderRadius: "8px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          color: "#2e7d32",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Current Balance
                      </div>
                      <div
                        style={{
                          fontSize: "2rem",
                          fontWeight: "bold",
                          color: "#28a745",
                        }}
                      >
                        {credits} Credits
                      </div>
                    </div>
                    <IonButton
                      onClick={() => setShowCreditsModal(true)}
                      style={{
                        "--background": "#28a745",
                      }}
                    >
                      Buy Credits
                    </IonButton>
                  </div>

                  {transactions.length > 0 ? (
                    <>
                      <h3
                        style={{
                          color: "#333",
                          fontSize: "1rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Purchase History
                      </h3>
                      {transactions.map((t, i) => (
                        <div
                          key={t.id || i}
                          style={{
                            padding: "0.75rem",
                            marginBottom: "0.5rem",
                            background: "#f8f9fa",
                            borderRadius: "8px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: "600", color: "#333" }}>
                              +{t.credits} Credits
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#6c757d" }}>
                              {new Date(t.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: "#333" }}>
                              ${(t.amount / 100).toFixed(2)}
                            </div>
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color:
                                  t.status === "completed" ? "#28a745" : "#ffc107",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                              }}
                            >
                              <IonIcon
                                icon={
                                  t.status === "completed"
                                    ? checkmarkCircle
                                    : alertCircle
                                }
                              />
                              {t.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div style={{ color: "#6c757d", fontSize: "0.9rem" }}>
                      No purchases yet
                    </div>
                  )}
                </IonCardContent>
              </IonCard>

              {/* Activity Stats */}
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
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <IonIcon icon={statsChart} style={{ color: "#0066cc" }} />
                    Activity Stats
                  </h2>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "1rem",
                    }}
                  >
                    <div
                      style={{
                        padding: "1rem",
                        background: "#f8f9fa",
                        borderRadius: "8px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "2rem",
                          fontWeight: "bold",
                          color: "#0066cc",
                        }}
                      >
                        {stats?.totalQuizzes || 0}
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "#6c757d" }}>
                        Quizzes Completed
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "1rem",
                        background: "#f8f9fa",
                        borderRadius: "8px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "2rem",
                          fontWeight: "bold",
                          color: "#28a745",
                        }}
                      >
                        {stats?.averageScore.toFixed(0) || 0}%
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "#6c757d" }}>
                        Average Score
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "1rem",
                        background: "#f8f9fa",
                        borderRadius: "8px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                          color: "#28a745",
                        }}
                      >
                        {stats?.bestTopic || "—"}
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "#6c757d" }}>
                        Best Topic
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "1rem",
                        background: "#f8f9fa",
                        borderRadius: "8px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                          color: stats?.worstTopic ? "#dc3545" : "#6c757d",
                        }}
                      >
                        {stats?.worstTopic || "—"}
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "#6c757d" }}>
                        Needs Work
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "1rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.5rem 0",
                        borderBottom: "1px solid #dee2e6",
                      }}
                    >
                      <span style={{ color: "#6c757d" }}>Total Conversations</span>
                      <span style={{ color: "#333", fontWeight: "600" }}>
                        {stats?.totalConversations || 0}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.5rem 0",
                      }}
                    >
                      <span style={{ color: "#6c757d" }}>Credits Purchased</span>
                      <span style={{ color: "#333", fontWeight: "600" }}>
                        {stats?.totalCreditsSpent || 0}
                      </span>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>

              {/* Recent Quizzes */}
              {recentQuizzes.length > 0 && (
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
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <IonIcon icon={timeOutline} style={{ color: "#0066cc" }} />
                        Recent Quizzes
                      </h2>
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={() => history.push("/quiz")}
                        style={{ "--color": "#0066cc" }}
                      >
                        View All
                      </IonButton>
                    </div>

                    {recentQuizzes.map((quiz, i) => (
                      <div
                        key={quiz.id || i}
                        style={{
                          padding: "0.75rem",
                          marginBottom: "0.5rem",
                          background: "#f8f9fa",
                          borderRadius: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderLeft: `4px solid ${
                            quiz.grade === "A+" || quiz.grade === "A"
                              ? "#28a745"
                              : quiz.grade === "B" || quiz.grade === "C"
                              ? "#ffc107"
                              : "#dc3545"
                          }`,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "600", color: "#333" }}>
                            {quiz.topic}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#6c757d" }}>
                            {new Date(quiz.completedAt).toLocaleDateString()}
                          </div>
                        </div>
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
                      </div>
                    ))}
                  </IonCardContent>
                </IonCard>
              )}

              {/* Data & Privacy */}
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
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <IonIcon icon={documentOutline} style={{ color: "#6c757d" }} />
                    Data & Privacy
                  </h2>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <IonButton
                      fill="outline"
                      onClick={handleExportData}
                      style={{
                        "--border-color": "#0066cc",
                        "--color": "#0066cc",
                      }}
                    >
                      <IonIcon slot="start" icon={downloadOutline} />
                      Export My Data
                    </IonButton>

                    <IonButton
                      fill="outline"
                      onClick={() => setShowClearQuizConfirm(true)}
                      style={{
                        "--border-color": "#ffc107",
                        "--color": "#856404",
                      }}
                    >
                      <IonIcon slot="start" icon={trash} />
                      Clear Quiz History
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>

              {/* Danger Zone */}
              <IonCard
                style={{
                  background: "#fff5f5",
                  border: "1px solid #dc3545",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                <IonCardContent>
                  <h2
                    style={{
                      color: "#dc3545",
                      fontWeight: "600",
                      marginBottom: "1rem",
                      fontSize: "1.2rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <IonIcon icon={trash} />
                    Danger Zone
                  </h2>

                  <p
                    style={{
                      color: "#721c24",
                      fontSize: "0.9rem",
                      marginBottom: "1rem",
                    }}
                  >
                    Deleting your account will permanently remove all your data,
                    including conversations, quiz results, and credits. This
                    action cannot be undone.
                  </p>

                  <IonButton
                    fill="solid"
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      "--background": "#dc3545",
                      "--background-hover": "#c82333",
                    }}
                  >
                    <IonIcon slot="start" icon={trash} />
                    Delete My Account
                  </IonButton>
                </IonCardContent>
              </IonCard>

              {/* Logout button */}
              <div style={{ padding: "1rem", textAlign: "center" }}>
                <IonButton
                  fill="outline"
                  onClick={logout}
                  style={{
                    "--border-color": "#6c757d",
                    "--color": "#6c757d",
                  }}
                >
                  <IonIcon slot="start" icon={logOut} />
                  Logout
                </IonButton>
              </div>
            </>
          )}
        </div>
      </IonContent>

      {/* Delete Account Confirmation */}
      <IonAlert
        isOpen={showDeleteConfirm}
        onDidDismiss={() => {
          setShowDeleteConfirm(false);
          setDeleteConfirmEmail("");
        }}
        header="Delete Account"
        message={`This will permanently delete your account and all data. Type your email "${user?.email}" to confirm.`}
        inputs={[
          {
            name: "email",
            type: "email",
            placeholder: "Enter your email",
            value: deleteConfirmEmail,
          },
        ]}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
          },
          {
            text: deleting ? "Deleting..." : "Delete Forever",
            role: "destructive",
            handler: (data) => {
              setDeleteConfirmEmail(data.email);
              if (data.email === user?.email) {
                handleDeleteAccount();
              }
              return false; // Keep dialog open if email doesn't match
            },
          },
        ]}
      />

      {/* Clear Quiz History Confirmation */}
      <IonAlert
        isOpen={showClearQuizConfirm}
        onDidDismiss={() => setShowClearQuizConfirm(false)}
        header="Clear Quiz History"
        message="Are you sure you want to delete all your quiz results? This cannot be undone."
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
          },
          {
            text: "Clear All",
            role: "destructive",
            handler: handleClearQuizHistory,
          },
        ]}
      />
    </IonPage>
  );
};

export default Profile;
