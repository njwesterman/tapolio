// src/components/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer style={{
      background: '#1a1a2e',
      color: '#a0a0a0',
      padding: '2rem 1rem',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '2rem',
      }}>
        {/* Company Info */}
        <div>
          <h4 style={{ color: '#ffffff', marginBottom: '1rem', fontSize: '1.1rem' }}>
            Tapolio
          </h4>
          <p style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
            AI-powered interview practice to help you land your dream job.
          </p>
        </div>
        
        {/* Quick Links */}
        <div>
          <h4 style={{ color: '#ffffff', marginBottom: '1rem', fontSize: '1.1rem' }}>
            Quick Links
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <Link to="/" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '0.9rem' }}>
                Home
              </Link>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <Link to="/app/quiz" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '0.9rem' }}>
                Practice Quiz
              </Link>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <Link to="/app/copilot" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '0.9rem' }}>
                Live Copilot
              </Link>
            </li>
          </ul>
        </div>
        
        {/* Legal */}
        <div>
          <h4 style={{ color: '#ffffff', marginBottom: '1rem', fontSize: '1.1rem' }}>
            Legal
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <Link to="/privacy" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '0.9rem' }}>
                Privacy Policy
              </Link>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <Link to="/terms" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '0.9rem' }}>
                Terms of Service
              </Link>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <Link to="/refunds" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '0.9rem' }}>
                Refund Policy
              </Link>
            </li>
          </ul>
        </div>
        
        {/* Contact */}
        <div>
          <h4 style={{ color: '#ffffff', marginBottom: '1rem', fontSize: '1.1rem' }}>
            Contact
          </h4>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            <a href="mailto:support@tapolio.com" style={{ color: '#a0a0a0', textDecoration: 'none' }}>
              support@tapolio.com
            </a>
          </p>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div style={{
        maxWidth: '1200px',
        margin: '2rem auto 0',
        paddingTop: '1.5rem',
        borderTop: '1px solid #333',
        textAlign: 'center',
        fontSize: '0.8rem',
      }}>
        <p style={{ marginBottom: '0.5rem' }}>
          © {currentYear} Tapolio. All rights reserved.
        </p>
        <p style={{ color: '#707070' }}>
          A NAITEC PTY LTD company (ABN 88 611 039 466)
        </p>
      </div>
    </footer>
  );
};

export default Footer;
