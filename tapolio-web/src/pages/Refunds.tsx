// src/pages/Refunds.tsx
import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import Footer from '../components/Footer';

const Refunds: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#0066cc' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" style={{ '--color': '#ffffff' }} />
          </IonButtons>
          <IonTitle style={{ color: '#ffffff' }}>Refund Policy</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <div style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.7' }}>
          <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '2rem' }}>
            <a href="/">
              <img src="/tapolio_logo.png" alt="Tapolio" style={{ height: '50px' }} />
            </a>
          </div>
          <h1 style={{ color: '#333' }}>Refund Policy</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Last updated: {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>1. Overview</h2>
            <p>
              NAITEC PTY LTD (ABN 88 611 039 466) is committed to providing quality service 
              through Tapolio. This Refund Policy outlines the circumstances under which 
              refunds may be granted for credit purchases.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>2. Australian Consumer Law</h2>
            <p>
              Our refund policy operates in accordance with Australian Consumer Law. Nothing 
              in this policy limits your rights under the Competition and Consumer Act 2010 (Cth).
            </p>
            <p>
              Under Australian Consumer Law, you are entitled to a refund if:
            </p>
            <ul>
              <li>The service has a major problem that cannot be fixed</li>
              <li>The service is substantially different from its description</li>
              <li>The service does not do what we said it would do</li>
            </ul>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>3. Credit Purchases</h2>
            <h3 style={{ fontSize: '1.1rem', color: '#444' }}>Refund Eligibility</h3>
            <p>
              You may be eligible for a refund on credit purchases if:
            </p>
            <ul>
              <li><strong>Technical Issues:</strong> You experienced significant technical problems 
                that prevented you from using purchased credits, and we were unable to resolve them</li>
              <li><strong>Billing Errors:</strong> You were charged incorrectly or multiple times 
                for the same purchase</li>
              <li><strong>Within 14 Days:</strong> You request a refund within 14 days of purchase 
                and have not used more than 20% of the purchased credits</li>
            </ul>
            
            <h3 style={{ fontSize: '1.1rem', color: '#444' }}>Non-Refundable Situations</h3>
            <p>Refunds are generally NOT available when:</p>
            <ul>
              <li>Credits have been substantially used (more than 20% consumed)</li>
              <li>More than 14 days have passed since purchase</li>
              <li>You simply changed your mind about the purchase</li>
              <li>You are dissatisfied with AI-generated responses (as these vary by nature)</li>
              <li>Your account was suspended for violating our Terms of Service</li>
            </ul>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>4. How to Request a Refund</h2>
            <p>To request a refund:</p>
            <ol>
              <li>Email us at <a href="mailto:support@tapolio.com">support@tapolio.com</a></li>
              <li>Include your account email address</li>
              <li>Provide the date and amount of your purchase</li>
              <li>Explain the reason for your refund request</li>
              <li>Include any relevant screenshots or documentation</li>
            </ol>
            <p>
              We aim to respond to all refund requests within 3-5 business days.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>5. Refund Process</h2>
            <p>If your refund is approved:</p>
            <ul>
              <li>Refunds will be processed to your original payment method</li>
              <li>Please allow 5-10 business days for the refund to appear</li>
              <li>Any unused credits will be removed from your account</li>
              <li>You will receive email confirmation when the refund is processed</li>
            </ul>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>6. Partial Refunds</h2>
            <p>
              In some cases, we may offer a partial refund proportional to the unused credits 
              remaining in your account. This will be calculated at our discretion based on 
              the specific circumstances.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>7. Promotional Credits</h2>
            <p>
              Free or promotional credits (including sign-up bonuses, referral credits, and 
              coupon-based credits) are not eligible for cash refunds. These credits are 
              provided at no cost and have no monetary value.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>8. Disputes</h2>
            <p>
              If you are not satisfied with our refund decision, you may:
            </p>
            <ul>
              <li>Request a review by emailing <a href="mailto:support@tapolio.com">support@tapolio.com</a></li>
              <li>Lodge a complaint with your state or territory consumer protection agency</li>
              <li>Contact the Australian Competition and Consumer Commission (ACCC)</li>
            </ul>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>9. Changes to This Policy</h2>
            <p>
              We reserve the right to modify this Refund Policy at any time. Changes will be 
              effective when posted on this page. We encourage you to review this policy 
              periodically.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>10. Contact Us</h2>
            <p>For refund inquiries or assistance:</p>
            <ul>
              <li>Email: <a href="mailto:support@tapolio.com">support@tapolio.com</a></li>
              <li>Company: NAITEC PTY LTD</li>
              <li>ABN: 88 611 039 466</li>
            </ul>
          </section>
        </div>
        
        <Footer />
      </IonContent>
    </IonPage>
  );
};

export default Refunds;
