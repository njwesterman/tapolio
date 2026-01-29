// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  TapolioUser,
  getCurrentUser,
  refreshCurrentUser,
  logIn as parseLogIn,
  logOut as parseLogOut,
  signUp as parseSignUp,
  useCredit as parseUseCredit,
  purchaseCredits as parsePurchaseCredits,
  canAccessFeature,
  isTopicFree,
  FREE_QUIZ_TOPICS,
  CREDIT_PACKAGES,
} from '../services/parse';

interface AuthContextType {
  user: TapolioUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  credits: number;
  
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Credit actions
  useCredit: () => Promise<{ success: boolean; remainingCredits: number }>;
  purchaseCredits: (packageIndex: number, couponId?: string, discountPercent?: number) => Promise<{ success: boolean; newCredits: number }>;
  
  // Access control
  canAccess: (feature: 'copilot' | 'quiz', topic?: string) => { allowed: boolean; reason?: string };
  canAccessQuizTopic: (topic: string) => boolean;
  isTopicFree: (topic: string) => boolean;
  
  // UI state
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  showCreditsModal: boolean;
  setShowCreditsModal: (show: boolean) => void;
  authModalMode: 'login' | 'signup';
  setAuthModalMode: (mode: 'login' | 'signup') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TapolioUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Initialize - check for existing session
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    const refreshedUser = await refreshCurrentUser();
    setUser(refreshedUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await parseLogIn(email, password);
    setUser(loggedInUser);
    setShowAuthModal(false);
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const newUser = await parseSignUp(email, password);
    setUser(newUser);
    setShowAuthModal(false);
  }, []);

  const logout = useCallback(async () => {
    await parseLogOut();
    setUser(null);
    // Redirect to landing page
    window.location.href = '/';
  }, []);

  const useCredit = useCallback(async () => {
    const result = await parseUseCredit();
    await refreshUser();
    return result;
  }, [refreshUser]);

  const purchaseCredits = useCallback(async (packageIndex: number, couponId?: string, discountPercent?: number) => {
    const result = await parsePurchaseCredits(packageIndex, couponId, discountPercent);
    await refreshUser();
    setShowCreditsModal(false);
    return result;
  }, [refreshUser]);

  const canAccess = useCallback((feature: 'copilot' | 'quiz', topic?: string) => {
    return canAccessFeature(feature, topic);
  }, []);

  // Helper to check if user can access a quiz topic
  const canAccessQuizTopic = useCallback((topic: string): boolean => {
    // Free topics are always accessible
    if (isTopicFree(topic)) return true;
    // Paid topics require login and credits
    return !!user && (user.credits || 0) > 0;
  }, [user]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    credits: user?.credits || 0,
    
    login,
    signup,
    logout,
    refreshUser,
    
    useCredit,
    purchaseCredits,
    
    canAccess,
    canAccessQuizTopic,
    isTopicFree,
    
    showAuthModal,
    setShowAuthModal,
    showCreditsModal,
    setShowCreditsModal,
    authModalMode,
    setAuthModalMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export for convenience
export { FREE_QUIZ_TOPICS, CREDIT_PACKAGES };
