// src/components/CookieConsent.tsx
import React, { useState, useEffect } from 'react';
import { IonButton } from '@ionic/react';
import { Link } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'tapolio_cookie_consent';

const CookieConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to avoid showing immediately on page load
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#1a1a2e',
      color: '#ffffff',
      padding: '1rem',
      zIndex: 10000,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          <div style={{ flex: '1 1 300px' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
              🍪 We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. 
              By clicking "Accept", you consent to our use of cookies. 
              <Link 
                to="/privacy" 
                style={{ color: '#4da6ff', marginLeft: '0.5rem' }}
              >
                Learn more
              </Link>
            </p>
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '0.75rem',
            flexShrink: 0,
          }}>
            <IonButton
              fill="outline"
              size="small"
              onClick={handleDecline}
              style={{
                '--color': '#a0a0a0',
                '--border-color': '#a0a0a0',
              }}
            >
              Decline
            </IonButton>
            <IonButton
              size="small"
              onClick={handleAccept}
              style={{
                '--background': '#28a745',
                '--background-hover': '#218838',
              }}
            >
              Accept All
            </IonButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
