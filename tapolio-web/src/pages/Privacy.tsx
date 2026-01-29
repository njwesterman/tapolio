// src/pages/Privacy.tsx
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
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const Privacy: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#0066cc' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" style={{ '--color': '#ffffff' }} />
          </IonButtons>
          <IonTitle style={{ color: '#ffffff' }}>Privacy Policy</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <div style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.7' }}>
          <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '2rem' }}>
            <a href="/">
              <img src="/tapolio_logo.png" alt="Tapolio" style={{ height: '50px' }} />
            </a>
          </div>
          <h1 style={{ color: '#333' }}>Privacy Policy</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Last updated: {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>1. Introduction</h2>
            <p>
              NAITEC PTY LTD (ABN 88 611 039 466) ("we", "our", "us") operates Tapolio 
              (the "Service"). This Privacy Policy explains how we collect, use, disclose, 
              and safeguard your information when you use our Service.
            </p>
            <p>
              We are committed to protecting your privacy in accordance with the Australian 
              Privacy Principles (APPs) contained in the Privacy Act 1988 (Cth).
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>2. Information We Collect</h2>
            <h3 style={{ fontSize: '1.1rem', color: '#444' }}>Personal Information</h3>
            <ul>
              <li>Email address (for account creation and communication)</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Usage data (quiz responses, practice session data)</li>
            </ul>
            
            <h3 style={{ fontSize: '1.1rem', color: '#444' }}>Automatically Collected Information</h3>
            <ul>
              <li>Device information (browser type, operating system)</li>
              <li>IP address</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Usage patterns and preferences</li>
            </ul>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our Service</li>
              <li>Process transactions and send related information</li>
              <li>Send promotional communications (with your consent)</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent transactions</li>
              <li>Personalize and improve your experience</li>
            </ul>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>4. Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul>
              <li><strong>Service Providers:</strong> Third parties that perform services on our behalf (e.g., Stripe for payment processing, Back4App for data storage)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>5. Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our Service 
              and hold certain information. You can instruct your browser to refuse all cookies 
              or to indicate when a cookie is being sent.
            </p>
            <p>Types of cookies we use:</p>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for the Service to function</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our Service</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
            </ul>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>6. Data Security</h2>
            <p>
              We implement appropriate technical and organisational security measures to protect 
              your personal information. However, no method of transmission over the Internet or 
              electronic storage is 100% secure.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>7. Data Retention</h2>
            <p>
              We retain your personal information only for as long as necessary to fulfil the 
              purposes for which it was collected, including to satisfy legal, accounting, or 
              reporting requirements.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>8. Your Rights</h2>
            <p>Under Australian privacy law, you have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of marketing communications</li>
              <li>Lodge a complaint with the Office of the Australian Information Commissioner (OAIC)</li>
            </ul>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>9. Additional Rights for EU Residents (GDPR)</h2>
            <p>
              If you are located in the European Economic Area (EEA), you have additional rights 
              under the General Data Protection Regulation (GDPR):
            </p>
            <ul>
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Right to Restrict Processing:</strong> Request limitation of how we use your data</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or direct marketing</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent</li>
            </ul>
            <p>
              <strong>Legal Basis for Processing:</strong> We process your data based on: (a) your consent, 
              (b) performance of a contract, (c) compliance with legal obligations, or (d) our legitimate interests.
            </p>
            <p>
              To exercise these rights, contact us at <a href="mailto:privacy@tapolio.com">privacy@tapolio.com</a>. 
              You also have the right to lodge a complaint with your local data protection authority.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>10. Additional Rights for California Residents (CCPA)</h2>
            <p>
              If you are a California resident, you have rights under the California Consumer 
              Privacy Act (CCPA):
            </p>
            <ul>
              <li><strong>Right to Know:</strong> Request disclosure of the categories and specific pieces of personal information we've collected</li>
              <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
              <li><strong>Right to Opt-Out:</strong> Opt-out of the sale of your personal information (note: we do not sell personal information)</li>
              <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights</li>
            </ul>
            <p>
              <strong>Categories of Information Collected:</strong> Identifiers (email), commercial information 
              (purchase history), internet activity (usage data), and inferences drawn from the above.
            </p>
            <p>
              To exercise these rights, contact us at <a href="mailto:privacy@tapolio.com">privacy@tapolio.com</a> 
              or call us. We will verify your identity before processing your request.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>11. International Data Transfers</h2>
            <p>
              Your information may be transferred to and maintained on servers located outside 
              of your country of residence, including Australia and the United States. By using 
              our Service, you consent to such transfers.
            </p>
            <p>
              For EU residents: We ensure appropriate safeguards are in place for international 
              transfers, including Standard Contractual Clauses approved by the European Commission 
              where applicable.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>12. Children's Privacy</h2>
            <p>
              Our Service is not intended for individuals under the age of 18 (or 16 in the EEA). 
              We do not knowingly collect personal information from children. If you believe we 
              have collected information from a child, please contact us immediately.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>13. Do Not Track Signals</h2>
            <p>
              Some browsers have a "Do Not Track" feature. We currently do not respond to Do Not 
              Track signals, but you can manage your cookie preferences through the cookie consent 
              banner or your browser settings.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>14. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any 
              changes by posting the new Privacy Policy on this page and updating the "Last 
              updated" date. For material changes, we will notify you via email.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>15. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <ul>
              <li>Email: <a href="mailto:privacy@tapolio.com">privacy@tapolio.com</a></li>
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

export default Privacy;
