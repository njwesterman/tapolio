// src/pages/PaymentSuccess.tsx
import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonContent,
  IonSpinner,
  IonIcon,
  IonButton,
} from '@ionic/react';
import { checkmarkCircle, closeCircle, sparkles } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const PaymentSuccess: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { purchaseCredits, isAuthenticated, user } = useAuth();
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [creditsAdded, setCreditsAdded] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const sessionId = params.get('session_id');
        const credits = parseInt(params.get('credits') || '0');
        const couponCode = params.get('coupon') || '';
        const referredBy = params.get('referredBy') || '';

        if (!sessionId) {
          setErrorMessage('Missing payment session');
          setStatus('error');
          return;
        }

        if (!isAuthenticated || !user) {
          setErrorMessage('Please log in to complete your purchase');
          setStatus('error');
          return;
        }

        // Verify payment with server
        const response = await fetch(`${API_BASE_URL}/verify-payment?session_id=${sessionId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setErrorMessage('Payment verification failed');
          setStatus('error');
          return;
        }

        // Allocate credits through purchaseCredits (this also tracks coupon/referral)
        const creditsToAdd = data.credits || credits;
        await purchaseCredits(
          creditsToAdd === 5 ? 0 : 
          creditsToAdd === 10 ? 1 : 
          creditsToAdd === 25 ? 2 : 3,
          couponCode || undefined,
          undefined // discount percent not needed for tracking, already applied
        );

        setCreditsAdded(creditsToAdd);
        setStatus('success');

        // Clear the referral code from localStorage after successful conversion
        if (referredBy) {
          localStorage.removeItem('tapolio_referral_code');
        }

      } catch (error: any) {
        console.error('Payment verification error:', error);
        setErrorMessage(error.message || 'Something went wrong');
        setStatus('error');
      }
    };

    verifyPayment();
  }, [location.search, isAuthenticated, user, purchaseCredits]);

  const handleGoHome = () => {
    history.push('/app/copilot');
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          padding: '2rem',
        }}>
          {status === 'verifying' && (
            <>
              <IonSpinner 
                name="crescent" 
                style={{ width: '60px', height: '60px', color: '#0066cc' }} 
              />
              <h2 style={{ color: '#333', marginTop: '1.5rem' }}>
                Verifying your payment...
              </h2>
              <p style={{ color: '#666' }}>
                Please wait while we confirm your purchase.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                borderRadius: '50%',
                padding: '1.5rem',
                marginBottom: '1.5rem',
              }}>
                <IonIcon 
                  icon={checkmarkCircle} 
                  style={{ fontSize: '4rem', color: '#ffffff' }} 
                />
              </div>
              <h1 style={{ color: '#28a745', marginBottom: '0.5rem' }}>
                Payment Successful!
              </h1>
              <p style={{ 
                color: '#333', 
                fontSize: '1.25rem',
                marginBottom: '0.5rem',
              }}>
                <IonIcon icon={sparkles} style={{ marginRight: '0.5rem' }} />
                {creditsAdded} credits added to your account
              </p>
              <p style={{ color: '#666', marginBottom: '2rem' }}>
                You can now use your credits for interview practice.
              </p>
              <IonButton
                onClick={handleGoHome}
                style={{
                  '--background': '#0066cc',
                  '--background-hover': '#0052a3',
                  fontWeight: '600',
                  height: '52px',
                }}
              >
                Start Practicing
              </IonButton>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{
                background: '#f8d7da',
                borderRadius: '50%',
                padding: '1.5rem',
                marginBottom: '1.5rem',
              }}>
                <IonIcon 
                  icon={closeCircle} 
                  style={{ fontSize: '4rem', color: '#dc3545' }} 
                />
              </div>
              <h1 style={{ color: '#dc3545', marginBottom: '0.5rem' }}>
                Something went wrong
              </h1>
              <p style={{ color: '#666', marginBottom: '2rem' }}>
                {errorMessage}
              </p>
              <IonButton
                onClick={handleGoHome}
                style={{
                  '--background': '#6c757d',
                  '--background-hover': '#5a6268',
                  fontWeight: '600',
                  height: '52px',
                }}
              >
                Go Back Home
              </IonButton>
              <p style={{ 
                color: '#666', 
                fontSize: '0.85rem', 
                marginTop: '1rem',
              }}>
                If you were charged, please contact support with your payment details.
              </p>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PaymentSuccess;
