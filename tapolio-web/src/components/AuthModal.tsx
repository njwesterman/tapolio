// src/components/AuthModal.tsx
import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonIcon,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { close, mail, lockClosed, sparkles } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';

const AuthModal: React.FC = () => {
  const { 
    showAuthModal, 
    setShowAuthModal, 
    authModalMode, 
    setAuthModalMode,
    login,
    signup,
  } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (authModalMode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (authModalMode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      // Reset form on success
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShowAuthModal(false);
    setError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <IonModal isOpen={showAuthModal} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar style={{ '--background': '#0066cc' }}>
          <IonTitle style={{ color: '#ffffff' }}>
            {authModalMode === 'login' ? 'Welcome Back' : 'Join Tapolio'}
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
        <div style={{ maxWidth: '400px', margin: '0 auto', paddingTop: '1rem' }}>
          {authModalMode === 'signup' && (
            <div style={{
              background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}>
              <IonIcon icon={sparkles} style={{ fontSize: '2rem', color: '#ffffff' }} />
              <h3 style={{ color: '#ffffff', margin: '0.5rem 0' }}>
                Get 3 Free Credits!
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '0.9rem' }}>
                Sign up now and get 3 free AI credits to try all features
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <IonItem style={{ marginBottom: '1rem', '--background': '#f8f9fa', borderRadius: '8px' }}>
              <IonIcon icon={mail} slot="start" style={{ color: '#6c757d' }} />
              <IonInput
                type="email"
                placeholder="Email"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value || '')}
                required
              />
            </IonItem>
            
            <IonItem style={{ marginBottom: '1rem', '--background': '#f8f9fa', borderRadius: '8px' }}>
              <IonIcon icon={lockClosed} slot="start" style={{ color: '#6c757d' }} />
              <IonInput
                type="password"
                placeholder="Password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value || '')}
                required
              />
            </IonItem>
            
            {authModalMode === 'signup' && (
              <IonItem style={{ marginBottom: '1rem', '--background': '#f8f9fa', borderRadius: '8px' }}>
                <IonIcon icon={lockClosed} slot="start" style={{ color: '#6c757d' }} />
                <IonInput
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onIonInput={(e) => setConfirmPassword(e.detail.value || '')}
                  required
                />
              </IonItem>
            )}
            
            {error && (
              <div style={{
                background: '#f8d7da',
                color: '#721c24',
                padding: '0.75rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}>
                {error}
              </div>
            )}
            
            <IonButton
              expand="block"
              type="submit"
              disabled={isLoading}
              style={{
                '--background': '#0066cc',
                '--background-hover': '#0052a3',
                fontWeight: '600',
                height: '48px',
                marginBottom: '1rem',
              }}
            >
              {isLoading ? (
                <IonSpinner name="dots" />
              ) : (
                authModalMode === 'login' ? 'Log In' : 'Sign Up'
              )}
            </IonButton>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <IonText color="medium">
              {authModalMode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <span
                    onClick={() => setAuthModalMode('signup')}
                    style={{ color: '#0066cc', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Sign Up
                  </span>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <span
                    onClick={() => setAuthModalMode('login')}
                    style={{ color: '#0066cc', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Log In
                  </span>
                </>
              )}
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default AuthModal;
