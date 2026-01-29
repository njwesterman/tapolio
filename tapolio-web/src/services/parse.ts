// src/services/parse.ts
// @ts-ignore
import Parse from 'parse';

// Initialize Parse with Back4App credentials
Parse.initialize(
  '6IYYatIwxEt2tVDey2UQYHCoVLAStnCrKVxNCK0c', // Application ID
  'IDQGjLxH3zpZvGgaQjRrxL9cn3xnQPNTMx1TvxzR'  // JavaScript Key
);
Parse.serverURL = 'https://parseapi.back4app.com/';

export default Parse;

// ============ USER / AUTH ============

export interface TapolioUser {
  id: string;
  email: string;
  credits: number;
  createdAt: Date;
}

export async function signUp(email: string, password: string): Promise<TapolioUser> {
  const user = new Parse.User();
  user.set('username', email);
  user.set('email', email);
  user.set('password', password);
  user.set('credits', 3); // Free 3 credits on signup
  
  // Check for referral code
  const referralCode = localStorage.getItem('tapolio_referral_code');
  if (referralCode) {
    user.set('referralCode', referralCode);
  }

  await user.signUp();
  
  // Track referral signup after successful signup
  if (referralCode) {
    try {
      const Referral = Parse.Object.extend('referral');
      const query = new Parse.Query(Referral);
      query.equalTo('code', referralCode);
      query.equalTo('active', true);
      const referral = await query.first();
      if (referral) {
        referral.increment('signupCount', 1);
        await referral.save();
        console.log('📊 Referral signup tracked for:', referralCode);
      }
    } catch (e) {
      console.error('Failed to track referral signup:', e);
    }
  }
  
  return {
    id: user.id || '',
    email: user.get('email'),
    credits: user.get('credits'),
    createdAt: user.createdAt!,
  };
}

export async function logIn(email: string, password: string): Promise<TapolioUser> {
  const user = await Parse.User.logIn(email, password);
  
  return {
    id: user.id || '',
    email: user.get('email'),
    credits: user.get('credits') || 0,
    createdAt: user.createdAt!,
  };
}

export async function logOut(): Promise<void> {
  await Parse.User.logOut();
}

export function getCurrentUser(): TapolioUser | null {
  const user = Parse.User.current();
  if (!user) return null;
  
  return {
    id: user.id || '',
    email: user.get('email'),
    credits: user.get('credits') || 0,
    createdAt: user.createdAt!,
  };
}

export async function refreshCurrentUser(): Promise<TapolioUser | null> {
  const user = Parse.User.current();
  if (!user) return null;
  
  await user.fetch();
  
  return {
    id: user.id || '',
    email: user.get('email'),
    credits: user.get('credits') || 0,
    createdAt: user.createdAt!,
  };
}

// ============ CREDITS ============

export async function getCredits(): Promise<number> {
  const user = Parse.User.current();
  if (!user) return 0;
  
  await user.fetch();
  return user.get('credits') || 0;
}

export async function useCredit(): Promise<{ success: boolean; remainingCredits: number }> {
  const user = Parse.User.current();
  if (!user) {
    throw new Error('Must be logged in to use credits');
  }
  
  await user.fetch();
  const currentCredits = user.get('credits') || 0;
  
  if (currentCredits <= 0) {
    throw new Error('No credits remaining. Please purchase more credits.');
  }
  
  user.set('credits', currentCredits - 1);
  await user.save();
  
  return {
    success: true,
    remainingCredits: currentCredits - 1,
  };
}

export async function addCredits(amount: number): Promise<number> {
  const user = Parse.User.current();
  if (!user) {
    throw new Error('Must be logged in');
  }
  
  await user.fetch();
  const currentCredits = user.get('credits') || 0;
  const newCredits = currentCredits + amount;
  
  user.set('credits', newCredits);
  await user.save();
  
  return newCredits;
}

// ============ TRANSACTIONS ============

export interface CreditPackage {
  credits: number;
  price: number; // in cents
  label: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { credits: 10, price: 499, label: '10 Credits - $4.99' },
  { credits: 25, price: 999, label: '25 Credits - $9.99' },
  { credits: 50, price: 1499, label: '50 Credits - $14.99' },
  { credits: 100, price: 2499, label: '100 Credits - $24.99' },
];

export async function purchaseCredits(packageIndex: number, couponId?: string, discountPercent?: number): Promise<{ success: boolean; newCredits: number }> {
  const user = Parse.User.current();
  if (!user) {
    throw new Error('Must be logged in to purchase credits');
  }
  
  const pkg = CREDIT_PACKAGES[packageIndex];
  if (!pkg) {
    throw new Error('Invalid credit package');
  }
  
  // Calculate final price with discount
  let finalPrice = pkg.price;
  if (discountPercent && discountPercent > 0) {
    finalPrice = Math.round(pkg.price - (pkg.price * discountPercent / 100));
  }
  
  // Create transaction record
  const Transaction = Parse.Object.extend('transaction');
  const transaction = new Transaction();
  
  transaction.set('user', user);
  transaction.set('credits', pkg.credits);
  transaction.set('amount', finalPrice);
  transaction.set('originalAmount', pkg.price);
  transaction.set('stripeId', `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  transaction.set('status', 'completed');
  
  // Track coupon if used
  if (couponId) {
    transaction.set('couponId', couponId);
    transaction.set('discountPercent', discountPercent);
    
    // Increment coupon use count
    try {
      const Coupon = Parse.Object.extend('coupon');
      const couponQuery = new Parse.Query(Coupon);
      const coupon = await couponQuery.get(couponId);
      if (coupon) {
        coupon.increment('useCount', 1);
        await coupon.save();
        console.log('🎟️ Coupon use tracked');
      }
    } catch (e) {
      console.error('Failed to track coupon use:', e);
    }
  }
  
  // Track referral conversion
  const referralCode = user.get('referralCode');
  if (referralCode) {
    transaction.set('referralCode', referralCode);
    
    try {
      const Referral = Parse.Object.extend('referral');
      const refQuery = new Parse.Query(Referral);
      refQuery.equalTo('code', referralCode);
      refQuery.equalTo('active', true);
      const referral = await refQuery.first();
      if (referral) {
        referral.increment('conversionCount', 1);
        referral.increment('totalRevenue', finalPrice / 100); // Convert cents to dollars
        referral.increment('totalUnitsPaid', pkg.credits);
        await referral.save();
        console.log('💰 Referral conversion tracked for:', referralCode);
      }
    } catch (e) {
      console.error('Failed to track referral conversion:', e);
    }
  }
  
  // Set ACL so only the user can read their transactions
  const acl = new Parse.ACL(user);
  acl.setPublicReadAccess(false);
  transaction.setACL(acl);
  
  await transaction.save();
  
  // Add credits to user
  const newCredits = await addCredits(pkg.credits);
  
  return {
    success: true,
    newCredits,
  };
}

export interface TransactionData {
  id: string;
  credits: number;
  amount: number;
  status: string;
  createdAt: Date;
}

export async function getTransactionHistory(): Promise<TransactionData[]> {
  const user = Parse.User.current();
  if (!user) return [];
  
  const Transaction = Parse.Object.extend('transaction');
  const query = new Parse.Query(Transaction);
  query.equalTo('user', user);
  query.descending('createdAt');
  query.limit(50);
  
  const results = await query.find();
  
  return results.map(t => ({
    id: t.id || '',
    credits: t.get('credits'),
    amount: t.get('amount'),
    status: t.get('status'),
    createdAt: t.createdAt!,
  }));
}

// ============ CONVERSATION HISTORY ============

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export async function saveConversation(messages: ConversationMessage[]): Promise<void> {
  const user = Parse.User.current();
  if (!user) return;
  
  const Conversation = Parse.Object.extend('conversation');
  const query = new Parse.Query(Conversation);
  query.equalTo('user', user);
  query.notEqualTo('deleted', true); // Only get active conversations
  
  const existing = await query.first();
  
  if (existing) {
    existing.set('messages', messages);
    await existing.save();
  } else {
    const conversation = new Conversation();
    conversation.set('user', user);
    conversation.set('messages', messages);
    conversation.set('deleted', false);
    
    // Set ACL so only the user can access their conversation
    const acl = new Parse.ACL(user);
    acl.setPublicReadAccess(false);
    conversation.setACL(acl);
    
    await conversation.save();
  }
}

export async function loadConversation(): Promise<ConversationMessage[]> {
  const user = Parse.User.current();
  if (!user) return [];
  
  const Conversation = Parse.Object.extend('conversation');
  const query = new Parse.Query(Conversation);
  query.equalTo('user', user);
  query.notEqualTo('deleted', true); // Only load active conversations
  
  const conversation = await query.first();
  
  if (!conversation) return [];
  
  return conversation.get('messages') || [];
}

export async function clearConversation(): Promise<void> {
  const user = Parse.User.current();
  if (!user) return;
  
  const Conversation = Parse.Object.extend('conversation');
  const query = new Parse.Query(Conversation);
  query.equalTo('user', user);
  query.notEqualTo('deleted', true);
  
  const conversation = await query.first();
  
  if (conversation) {
    // Soft delete - preserve data but mark as deleted
    conversation.set('deleted', true);
    await conversation.save();
  }
}

// ============ QUIZ RESULTS HISTORY ============

export interface QuizQuestionResult {
  question: string;
  userAnswer: string;
  score: number;
  feedback: string;
}

export interface QuizResultData {
  id?: string;
  topic: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  questionsCount: number;
  results: QuizQuestionResult[];
  completedAt: Date;
}

export async function saveQuizResult(result: Omit<QuizResultData, 'id' | 'completedAt'>): Promise<void> {
  const user = Parse.User.current();
  if (!user) return;
  
  const QuizResult = Parse.Object.extend('quizResult');
  const quizResult = new QuizResult();
  
  quizResult.set('user', user);
  quizResult.set('topic', result.topic);
  quizResult.set('totalScore', result.totalScore);
  quizResult.set('maxScore', result.maxScore);
  quizResult.set('percentage', result.percentage);
  quizResult.set('grade', result.grade);
  quizResult.set('questionsCount', result.questionsCount);
  quizResult.set('results', result.results);
  
  // Set ACL so only the user can access their quiz results
  const acl = new Parse.ACL(user);
  acl.setPublicReadAccess(false);
  quizResult.setACL(acl);
  
  await quizResult.save();
  console.log('📝 Quiz result saved to Back4App');
}

export async function loadQuizResults(): Promise<QuizResultData[]> {
  const user = Parse.User.current();
  if (!user) return [];
  
  const QuizResult = Parse.Object.extend('quizResult');
  const query = new Parse.Query(QuizResult);
  query.equalTo('user', user);
  query.descending('createdAt'); // Most recent first
  query.limit(50); // Limit to last 50 tests
  
  const results = await query.find();
  
  return results.map(r => ({
    id: r.id || '',
    topic: r.get('topic'),
    totalScore: r.get('totalScore'),
    maxScore: r.get('maxScore'),
    percentage: r.get('percentage'),
    grade: r.get('grade'),
    questionsCount: r.get('questionsCount'),
    results: r.get('results') || [],
    completedAt: r.createdAt!,
  }));
}

export async function loadQuizResultById(id: string): Promise<QuizResultData | null> {
  const user = Parse.User.current();
  if (!user) return null;
  
  const QuizResult = Parse.Object.extend('quizResult');
  const query = new Parse.Query(QuizResult);
  query.equalTo('objectId', id);
  query.equalTo('user', user); // Security: only load user's own results
  
  const result = await query.first();
  
  if (!result) return null;
  
  return {
    id: result.id || '',
    topic: result.get('topic'),
    totalScore: result.get('totalScore'),
    maxScore: result.get('maxScore'),
    percentage: result.get('percentage'),
    grade: result.get('grade'),
    questionsCount: result.get('questionsCount'),
    results: result.get('results') || [],
    completedAt: result.createdAt!,
  };
}

// ============ ACCESS CONTROL ============

// Topics that are free for everyone (no login required)
export const FREE_QUIZ_TOPICS = ['General Knowledge'];

export function isTopicFree(topic: string): boolean {
  return FREE_QUIZ_TOPICS.includes(topic);
}

export function canAccessFeature(feature: 'copilot' | 'quiz', topic?: string): {
  allowed: boolean;
  reason?: string;
} {
  const user = getCurrentUser();
  
  // Quiz access
  if (feature === 'quiz' && topic) {
    // Free topics are always accessible
    if (isTopicFree(topic)) {
      return { allowed: true };
    }
    
    // Premium topics require login and credits
    if (!user) {
      return { allowed: false, reason: 'signup_required' };
    }
    if (user.credits <= 0) {
      return { allowed: false, reason: 'no_credits' };
    }
    return { allowed: true };
  }
  
  // Copilot always requires login and credits
  if (feature === 'copilot') {
    if (!user) {
      return { allowed: false, reason: 'signup_required' };
    }
    if (user.credits <= 0) {
      return { allowed: false, reason: 'no_credits' };
    }
    return { allowed: true };
  }
  
  return { allowed: false, reason: 'unknown_feature' };
}

// ============ PROFILE / ACCOUNT ============

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = Parse.User.current();
  if (!user) throw new Error('Not logged in');
  
  // Verify current password by logging in again
  const email = user.get('email');
  try {
    await Parse.User.logIn(email, currentPassword);
  } catch (e) {
    throw new Error('Current password is incorrect');
  }
  
  // Update password
  user.set('password', newPassword);
  await user.save();
}

export async function deleteAccount(): Promise<void> {
  const user = Parse.User.current();
  if (!user) throw new Error('Not logged in');
  
  // Delete all user's data first
  
  // Delete conversations
  const Conversation = Parse.Object.extend('conversation');
  const convQuery = new Parse.Query(Conversation);
  convQuery.equalTo('user', user);
  const conversations = await convQuery.find();
  await Parse.Object.destroyAll(conversations);
  
  // Delete quiz results
  const QuizResult = Parse.Object.extend('quizResult');
  const quizQuery = new Parse.Query(QuizResult);
  quizQuery.equalTo('user', user);
  const quizResults = await quizQuery.find();
  await Parse.Object.destroyAll(quizResults);
  
  // Delete transactions
  const Transaction = Parse.Object.extend('transaction');
  const transQuery = new Parse.Query(Transaction);
  transQuery.equalTo('user', user);
  const transactions = await transQuery.find();
  await Parse.Object.destroyAll(transactions);
  
  // Finally delete the user
  await user.destroy();
}

export interface AccountStats {
  totalQuizzes: number;
  averageScore: number;
  bestTopic: string | null;
  worstTopic: string | null;
  totalConversations: number;
  totalCreditsSpent: number;
}

export async function getAccountStats(): Promise<AccountStats> {
  const user = Parse.User.current();
  if (!user) return {
    totalQuizzes: 0,
    averageScore: 0,
    bestTopic: null,
    worstTopic: null,
    totalConversations: 0,
    totalCreditsSpent: 0,
  };
  
  // Get quiz results
  const QuizResult = Parse.Object.extend('quizResult');
  const quizQuery = new Parse.Query(QuizResult);
  quizQuery.equalTo('user', user);
  const quizResults = await quizQuery.find();
  
  let totalScore = 0;
  let totalMaxScore = 0;
  const topicScores: { [topic: string]: { total: number; count: number } } = {};
  
  for (const result of quizResults) {
    const score = result.get('totalScore') || 0;
    const maxScore = result.get('maxScore') || 50;
    const topic = result.get('topic') || 'Unknown';
    
    totalScore += score;
    totalMaxScore += maxScore;
    
    if (!topicScores[topic]) {
      topicScores[topic] = { total: 0, count: 0 };
    }
    topicScores[topic].total += (score / maxScore) * 100;
    topicScores[topic].count++;
  }
  
  // Find best and worst topics
  let bestTopic: string | null = null;
  let worstTopic: string | null = null;
  let bestAvg = -1;
  let worstAvg = 101;
  
  for (const [topic, data] of Object.entries(topicScores)) {
    const avg = data.total / data.count;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestTopic = topic;
    }
    if (avg < worstAvg) {
      worstAvg = avg;
      worstTopic = topic;
    }
  }
  
  // Get conversation count
  const Conversation = Parse.Object.extend('conversation');
  const convQuery = new Parse.Query(Conversation);
  convQuery.equalTo('user', user);
  const conversationCount = await convQuery.count();
  
  // Get total credits spent from transactions
  const Transaction = Parse.Object.extend('transaction');
  const transQuery = new Parse.Query(Transaction);
  transQuery.equalTo('user', user);
  transQuery.equalTo('status', 'completed');
  const transactions = await transQuery.find();
  const totalCreditsSpent = transactions.reduce((sum, t) => sum + (t.get('credits') || 0), 0);
  
  return {
    totalQuizzes: quizResults.length,
    averageScore: totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0,
    bestTopic,
    worstTopic: worstTopic !== bestTopic ? worstTopic : null,
    totalConversations: conversationCount,
    totalCreditsSpent,
  };
}

export async function exportUserData(): Promise<object> {
  const user = Parse.User.current();
  if (!user) throw new Error('Not logged in');
  
  // Get all user data
  const Conversation = Parse.Object.extend('conversation');
  const convQuery = new Parse.Query(Conversation);
  convQuery.equalTo('user', user);
  const conversations = await convQuery.find();
  
  const QuizResult = Parse.Object.extend('quizResult');
  const quizQuery = new Parse.Query(QuizResult);
  quizQuery.equalTo('user', user);
  const quizResults = await quizQuery.find();
  
  const Transaction = Parse.Object.extend('transaction');
  const transQuery = new Parse.Query(Transaction);
  transQuery.equalTo('user', user);
  const transactions = await transQuery.find();
  
  return {
    exportedAt: new Date().toISOString(),
    user: {
      email: user.get('email'),
      credits: user.get('credits'),
      createdAt: user.createdAt,
    },
    conversations: conversations.map(c => ({
      messages: c.get('messages'),
      createdAt: c.createdAt,
      deleted: c.get('deleted'),
    })),
    quizResults: quizResults.map(r => ({
      topic: r.get('topic'),
      totalScore: r.get('totalScore'),
      maxScore: r.get('maxScore'),
      grade: r.get('grade'),
      results: r.get('results'),
      completedAt: r.createdAt,
    })),
    transactions: transactions.map(t => ({
      credits: t.get('credits'),
      amount: t.get('amount'),
      status: t.get('status'),
      createdAt: t.createdAt,
    })),
  };
}

export async function clearAllQuizHistory(): Promise<void> {
  const user = Parse.User.current();
  if (!user) return;
  
  const QuizResult = Parse.Object.extend('quizResult');
  const query = new Parse.Query(QuizResult);
  query.equalTo('user', user);
  const results = await query.find();
  await Parse.Object.destroyAll(results);
}

// ============ REFERRAL SYSTEM ============

const REFERRAL_STORAGE_KEY = 'tapolio_referral_code';

export function captureReferralCode(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  if (refCode) {
    localStorage.setItem(REFERRAL_STORAGE_KEY, refCode);
    console.log('📎 Referral code captured:', refCode);
  }
}

export function getStoredReferralCode(): string | null {
  return localStorage.getItem(REFERRAL_STORAGE_KEY);
}

export function clearStoredReferralCode(): void {
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
}

export async function validateReferralCode(code: string): Promise<boolean> {
  const Referral = Parse.Object.extend('referral');
  const query = new Parse.Query(Referral);
  query.equalTo('code', code);
  query.equalTo('active', true);
  const result = await query.first();
  return !!result;
}

export async function trackReferralSignup(code: string): Promise<void> {
  const Referral = Parse.Object.extend('referral');
  const query = new Parse.Query(Referral);
  query.equalTo('code', code);
  query.equalTo('active', true);
  const referral = await query.first();
  
  if (referral) {
    referral.increment('signupCount', 1);
    await referral.save();
    console.log('📊 Referral signup tracked for:', code);
  }
}

export async function trackReferralConversion(code: string, amount: number, credits: number): Promise<void> {
  const Referral = Parse.Object.extend('referral');
  const query = new Parse.Query(Referral);
  query.equalTo('code', code);
  query.equalTo('active', true);
  const referral = await query.first();
  
  if (referral) {
    referral.increment('conversionCount', 1);
    referral.increment('totalRevenue', amount / 100); // Convert cents to dollars
    referral.increment('totalUnitsPaid', credits);
    await referral.save();
    console.log('💰 Referral conversion tracked for:', code);
  }
}

// ============ COUPON SYSTEM ============

export interface CouponData {
  id: string;
  code: string;
  discountPercent: number;
  useCount: number;
  maxUses: number | null;
  active: boolean;
  expiresAt: Date | null;
}

export async function validateCoupon(code: string): Promise<{ valid: boolean; coupon?: CouponData; error?: string }> {
  const Coupon = Parse.Object.extend('coupon');
  const query = new Parse.Query(Coupon);
  query.equalTo('code', code.toUpperCase());
  const coupon = await query.first();
  
  if (!coupon) {
    return { valid: false, error: 'Coupon code not found' };
  }
  
  if (!coupon.get('active')) {
    return { valid: false, error: 'This coupon is no longer active' };
  }
  
  const expiresAt = coupon.get('expiresAt');
  if (expiresAt && new Date(expiresAt) < new Date()) {
    return { valid: false, error: 'This coupon has expired' };
  }
  
  const maxUses = coupon.get('maxUses');
  const useCount = coupon.get('useCount') || 0;
  if (maxUses && useCount >= maxUses) {
    return { valid: false, error: 'This coupon has reached its usage limit' };
  }
  
  return {
    valid: true,
    coupon: {
      id: coupon.id || '',
      code: coupon.get('code'),
      discountPercent: coupon.get('discountPercent') || 0,
      useCount: coupon.get('useCount') || 0,
      maxUses: coupon.get('maxUses') || null,
      active: coupon.get('active'),
      expiresAt: coupon.get('expiresAt') || null,
    },
  };
}

export async function incrementCouponUse(couponId: string): Promise<void> {
  const Coupon = Parse.Object.extend('coupon');
  const query = new Parse.Query(Coupon);
  const coupon = await query.get(couponId);
  
  if (coupon) {
    coupon.increment('useCount', 1);
    await coupon.save();
    console.log('🎟️ Coupon use count incremented');
  }
}

export function calculateDiscountedPrice(originalPrice: number, discountPercent: number): number {
  const discount = (originalPrice * discountPercent) / 100;
  return Math.round(originalPrice - discount);
}
