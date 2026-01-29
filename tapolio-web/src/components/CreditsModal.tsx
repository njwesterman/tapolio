// src/components/CreditsModal.tsx
import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonInput,
} from '@ionic/react';
import { close, sparkles, checkmarkCircle, pricetag } from 'ionicons/icons';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth, CREDIT_PACKAGES } from '../contexts/AuthContext';
import { validateCoupon, CouponData, calculateDiscountedPrice, getStoredReferralCode } from '../services/parse';

// Determine Stripe mode and select appropriate publishable key
const STRIPE_MODE = import.meta.env.VITE_STRIPE_MODE || 'test';
const STRIPE_PUBLISHABLE_KEY = STRIPE_MODE === 'live'
  ? import.meta.env.VITE_STRIPE_LIVE_PUBLISHABLE_KEY
  : import.meta.env.VITE_STRIPE_TEST_PUBLISHABLE_KEY;

// Initialize Stripe with the appropriate key
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const CreditsModal: React.FC = () => {
  const { 
    showCreditsModal, 
    setShowCreditsModal, 
    credits,
    isAuthenticated,
    setShowAuthModal,
    user,
  } = useAuth();
  
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setCouponLoading(true);
    setCouponError(null);
    
    try {
      const result = await validateCoupon(couponCode.trim());
      if (result.valid && result.coupon) {
        setAppliedCoupon(result.coupon);
        setCouponCode('');
      } else {
        setCouponError(result.error || 'Invalid coupon code');
      }
    } catch (err: any) {
      setCouponError('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handlePurchase = async () => {
    if (selectedPackage === null) return;
    
    if (!isAuthenticated || !user) {
      setShowCreditsModal(false);
      setShowAuthModal(true);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }
      
      const pkg = CREDIT_PACKAGES[selectedPackage];
      const discountedPrice = appliedCoupon 
        ? calculateDiscountedPrice(pkg.price, appliedCoupon.discountPercent) / 100
        : null;
      
      // Get referral code if user was referred
      const referredBy = getStoredReferralCode();
      
      // Create checkout session on server
      const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits: pkg.credits,
          userId: user.id,
          email: user.email,
          couponCode: appliedCoupon?.code || null,
          discountedPrice: discountedPrice,
          referredBy: referredBy,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }
      
      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(err.message || 'Purchase failed');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShowCreditsModal(false);
    setError(null);
    setSuccess(false);
    setSelectedPackage(null);
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  
  const getDisplayPrice = (originalPrice: number) => {
    if (appliedCoupon) {
      return calculateDiscountedPrice(originalPrice, appliedCoupon.discountPercent);
    }
    return originalPrice;
  };

  return (
    <IonModal isOpen={showCreditsModal} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar style={{ '--background': '#28a745' }}>
          <IonTitle style={{ color: '#ffffff' }}>
            <IonIcon icon={sparkles} style={{ marginRight: '8px' }} />
            Get Credits
          </IonTitle>
          <IonButton 
            slot="end" 
            fill="clear" 
            onClick={handleClose}
            style={{ '--color': '#ffffff' }}
          >
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          {/* Current Credits Display */}
          <div style={{
            background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
            color: '#ffffff',
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Your Current Balance</div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{credits}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Credits</div>
          </div>
          
          {success ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
            }}>
              <IonIcon 
                icon={checkmarkCircle} 
                style={{ fontSize: '4rem', color: '#28a745' }} 
              />
              <h2 style={{ color: '#28a745' }}>Purchase Successful!</h2>
              <p style={{ color: '#6c757d' }}>Your credits have been added.</p>
            </div>
          ) : (
            <>
              <h3 style={{ color: '#333', marginBottom: '1rem' }}>Select a Package</h3>
              
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {CREDIT_PACKAGES.map((pkg, index) => {
                  const discountedPrice = getDisplayPrice(pkg.price);
                  const hasDiscount = discountedPrice < pkg.price;
                  
                  return (
                    <IonCard
                      key={index}
                      onClick={() => setSelectedPackage(index)}
                      style={{
                        margin: 0,
                        cursor: 'pointer',
                        border: selectedPackage === index 
                          ? '2px solid #28a745' 
                          : '2px solid transparent',
                        background: selectedPackage === index 
                          ? '#f0fff4' 
                          : '#ffffff',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <IonCardContent style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                      }}>
                        <div>
                          <div style={{ 
                            fontSize: '1.25rem', 
                            fontWeight: 'bold',
                            color: '#333',
                          }}>
                            {pkg.credits} Credits
                          </div>
                          <div style={{ 
                            fontSize: '0.85rem', 
                            color: '#6c757d',
                          }}>
                            {(discountedPrice / pkg.credits / 100).toFixed(2)} per credit
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {hasDiscount && (
                            <div style={{
                              fontSize: '0.9rem',
                              color: '#999',
                              textDecoration: 'line-through',
                            }}>
                              {formatPrice(pkg.price)}
                            </div>
                          )}
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: hasDiscount ? '#dc3545' : '#28a745',
                          }}>
                            {formatPrice(discountedPrice)}
                          </div>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  );
                })}
              </div>
              
              {/* Coupon Code Section */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ 
                  color: '#333', 
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <IonIcon icon={pricetag} />
                  Have a coupon code?
                </h4>
                
                {appliedCoupon ? (
                  <div style={{
                    background: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <span style={{ fontWeight: '600', color: '#155724' }}>
                        {appliedCoupon.code}
                      </span>
                      <span style={{ color: '#155724', marginLeft: '0.5rem' }}>
                        - {appliedCoupon.discountPercent}% off
                      </span>
                    </div>
                    <IonButton 
                      fill="clear" 
                      size="small"
                      onClick={handleRemoveCoupon}
                      style={{ '--color': '#155724' }}
                    >
                      Remove
                    </IonButton>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <IonInput
                      value={couponCode}
                      onIonInput={(e) => setCouponCode(e.detail.value || '')}
                      placeholder="Enter coupon code"
                      style={{
                        '--background': '#f8f9fa',
                        '--padding-start': '12px',
                        '--padding-end': '12px',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        flex: 1,
                      }}
                    />
                    <IonButton
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || couponLoading}
                      style={{
                        '--background': '#6c757d',
                        '--background-hover': '#5a6268',
                      }}
                    >
                      {couponLoading ? <IonSpinner name="dots" /> : 'Apply'}
                    </IonButton>
                  </div>
                )}
                
                {couponError && (
                  <div style={{
                    color: '#dc3545',
                    fontSize: '0.85rem',
                    marginTop: '0.5rem',
                  }}>
                    {couponError}
                  </div>
                )}
              </div>
              
              {error && (
                <div style={{
                  background: '#f8d7da',
                  color: '#721c24',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  marginTop: '1rem',
                  fontSize: '0.9rem',
                }}>
                  {error}
                </div>
              )}
              
              <IonButton
                expand="block"
                onClick={handlePurchase}
                disabled={selectedPackage === null || isLoading}
                style={{
                  '--background': '#28a745',
                  '--background-hover': '#218838',
                  fontWeight: '600',
                  height: '52px',
                  marginTop: '1.5rem',
                }}
              >
                {isLoading ? (
                  <IonSpinner name="dots" />
                ) : (
                  selectedPackage !== null 
                    ? `Purchase ${CREDIT_PACKAGES[selectedPackage].credits} Credits - ${formatPrice(getDisplayPrice(CREDIT_PACKAGES[selectedPackage].price))}`
                    : 'Select a Package'
                )}
              </IonButton>
              
              <p style={{
                textAlign: 'center',
                color: '#6c757d',
                fontSize: '0.8rem',
                marginTop: '1rem',
              }}>
                🔒 Secure payment powered by Stripe
              </p>
            </>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default CreditsModal;
