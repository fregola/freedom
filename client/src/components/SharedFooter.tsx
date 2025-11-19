import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ContactModal from './ContactModal';
import CategoriesModal from './CategoriesModal';
import SearchModal from './SearchModal';
import { useBusinessInfo } from '../hooks/useBusinessInfo';
import './SharedFooter.css';

const SharedFooter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const { businessInfo, loading: businessLoading } = useBusinessInfo();

  const handleShare = async () => {
    const shareData = {
      title: 'Menu del Ristorante',
      text: 'Scopri il nostro menu!',
      url: window.location.origin + '/menu'
    };

    try {
      // Prova a usare l'API Web Share se disponibile (mobile)
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copia il link negli appunti
        await navigator.clipboard.writeText(shareData.url);
        alert('Link del menu copiato negli appunti!');
      }
    } catch (error) {
      console.error('Errore nella condivisione:', error);
      // Fallback finale: mostra il link in un alert
      alert(`Condividi questo link: ${shareData.url}`);
    }
  };

  const handleCategoriesClick = () => {
    setIsCategoriesModalOpen(true);
  };

  const handleMenuClick = () => {
    // Se siamo già nel menu, scorri verso l'alto per vedere le categorie
    if (location.pathname === '/menu') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/menu');
    }
  };

  const handleSearchClick = () => {
    setIsSearchModalOpen(true);
  };

  const handleContactClick = () => {
    setIsContactModalOpen(true);
  };

  return (
    <>
      <footer className="shared-footer">
        <nav className="footer-nav">
          <button onClick={handleMenuClick} className="footer-nav-item footer-nav-button">
            <svg className="footer-nav-icon" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="9"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            Menu
          </button>
          <button onClick={handleCategoriesClick} className="footer-nav-item footer-nav-button">
            <svg className="footer-nav-icon" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            Categorie
          </button>
          <button onClick={handleSearchClick} className="footer-nav-item footer-nav-button">
            <svg className="footer-nav-icon" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            Cerca
          </button>
          <button onClick={handleContactClick} className="footer-nav-item footer-nav-button">
            <svg className="footer-nav-icon" viewBox="0 0 24 24">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Contatti
          </button>
          <button onClick={handleShare} className="footer-nav-item footer-nav-button">
            <svg className="footer-nav-icon" viewBox="0 0 24 24">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Condividi
          </button>
        </nav>
        <div className="footer-website">
          <span>
            www.pubfreedom.it è stato realizzato da Nicola Fregola
          </span>
        </div>
      </footer>
      
      <ContactModal 
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        businessInfo={businessInfo}
      />
      
      <CategoriesModal 
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />
      
      <SearchModal 
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
};

export default SharedFooter;