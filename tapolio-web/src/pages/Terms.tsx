// src/pages/Terms.tsx
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

const Terms: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#0066cc' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" style={{ '--color': '#ffffff' }} />
          </IonButtons>
          <IonTitle style={{ color: '#ffffff' }}>Terms of Service</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <div style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.7' }}>
          <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '2rem' }}>
            <a href="/">
              <img src="/tapolio_logo.png" alt="Tapolio" style={{ height: '50px' }} />
            </a>
          </div>
          <h1 style={{ color: '#333' }}>Terms of Service</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Last updated: {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>1. Agreement to Terms</h2>
            <p>
              By accessing or using Tapolio (the "Service"), operated by NAITEC PTY LTD 
              (ABN 88 611 039 466) ("we", "our", "us"), you agree to be bound by these 
              Terms of Service ("Terms"). If you do not agree to these Terms, please do 
              not use the Service.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>2. Description of Service</h2>
            <p>
              Tapolio is an AI-powered interview practice platform that provides:
            </p>
            <ul>
              <li>Interactive interview quiz sessions</li>
              <li>Real-time interview copilot assistance</li>
              <li>Performance feedback and scoring</li>
              <li>Practice across various technical topics</li>
            </ul>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>3. Account Registration</h2>
            <p>
              To access certain features, you must create an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update any changes to your information</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>4. Credits and Payments</h2>
            <h3 style={{ fontSize: '1.1rem', color: '#444' }}>Credit System</h3>
            <ul>
              <li>Credits are required to access premium features</li>
              <li>New users receive complimentary credits upon registration</li>
              <li>Credits do not expire but are non-transferable</li>
              <li>Credits have no cash value and cannot be exchanged for money</li>
            </ul>
            
            <h3 style={{ fontSize: '1.1rem', color: '#444' }}>Purchases</h3>
            <ul>
              <li>All prices are displayed in USD</li>
              <li>Payments are processed securely through Stripe</li>
              <li>You agree to pay all charges at the prices in effect when incurred</li>
              <li>We reserve the right to modify pricing at any time</li>
            </ul>
            
            <p>
              For refund information, please see our <Link to="/refunds">Refund Policy</Link>.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>5. Acceptable Use</h2>
            <p>You agree NOT to:</p>
            <ul>
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Transmit viruses, malware, or harmful code</li>
              <li>Use automated systems to access the Service (bots, scrapers)</li>
              <li>Share your account credentials with others</li>
              <li>Misrepresent your identity or affiliation</li>
              <li>Use the Service to cheat in actual job interviews</li>
              <li>Copy, modify, or distribute our content without permission</li>
            </ul>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>6. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned 
              by NAITEC PTY LTD and are protected by international copyright, trademark, 
              and other intellectual property laws.
            </p>
            <p>
              You retain ownership of any content you submit through the Service, but grant 
              us a license to use it for providing and improving the Service.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>7. AI-Generated Content</h2>
            <p>
              Our Service uses artificial intelligence to generate interview questions, 
              feedback, and suggestions. You acknowledge that:
            </p>
            <ul>
              <li>AI-generated content may not always be accurate or appropriate</li>
              <li>The Service is for practice purposes only</li>
              <li>We do not guarantee any specific outcomes from using the Service</li>
              <li>You should verify important information independently</li>
            </ul>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>8. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY 
              KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES 
              OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              We do not warrant that the Service will be uninterrupted, error-free, or 
              completely secure.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NAITEC PTY LTD SHALL NOT BE LIABLE 
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, 
              INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE 
              SERVICE.
            </p>
            <p>
              Our total liability shall not exceed the amount you paid us in the twelve (12) 
              months preceding the claim.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless NAITEC PTY LTD and its officers, 
              directors, employees, and agents from any claims, damages, losses, or expenses 
              arising from your use of the Service or violation of these Terms.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>11. Modifications to Service</h2>
            <p>
              We reserve the right to modify, suspend, or discontinue the Service at any 
              time without notice. We shall not be liable to you or any third party for 
              any modification, suspension, or discontinuance.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws 
              of New South Wales, Australia, without regard to conflict of law principles. 
              Any disputes shall be subject to the exclusive jurisdiction of the courts of 
              New South Wales.
            </p>
            <p>
              <strong>For EU Residents:</strong> Nothing in these Terms affects your rights 
              under mandatory consumer protection laws in your country of residence. You may 
              bring proceedings in your local courts if required by applicable law.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>13. International Users</h2>
            <p>
              The Service is operated from Australia. If you access the Service from outside 
              Australia, you do so at your own initiative and are responsible for compliance 
              with local laws. By using the Service, you consent to the transfer of your 
              information to Australia and other countries where we operate.
            </p>
            <p>
              We make no representation that the Service is appropriate or available for use 
              in all locations. Prices are displayed in USD for international convenience.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>14. Currency and Pricing</h2>
            <p>
              All prices are displayed and charged in United States Dollars (USD). Your bank 
              or payment provider may apply currency conversion fees for non-USD transactions. 
              We are not responsible for any additional fees charged by your financial institution.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>15. Changes to Terms</h2>
            <p>
              We may revise these Terms at any time by posting the updated version on the 
              Service. Your continued use of the Service following any changes constitutes 
              acceptance of the new Terms. For material changes, we will notify you via email.
            </p>
          </section>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.3rem' }}>16. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us:</p>
            <ul>
              <li>Email: <a href="mailto:legal@tapolio.com">legal@tapolio.com</a></li>
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

export default Terms;
