import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { businessService, categoryService, customMenuService } from '../services/api';
import { useProductEvents } from '../hooks/useSocket';
import SharedFooter from '../components/SharedFooter';
import './PublicMenu.css';

// URL base per le risorse statiche
const API_BASE_URL = (typeof window !== 'undefined' ? `${window.location.origin}/api` : ((process.env.REACT_APP_API_URL as string | undefined) || '/api'));

interface BusinessInfo {
  id: number;
  name: string;
  description?: string;
  logo_path?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
}

interface Category {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  parent_id: number | null;
  is_active: number;
  parent_name?: string;
  sort_order?: number;
}

const PublicMenu: React.FC = () => {
  const navigate = useNavigate();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'it' | 'en'>(
    (typeof window !== 'undefined' && localStorage.getItem('menu-language') === 'en') ? 'en' : 'it'
  );
  const [visibleCustom, setVisibleCustom] = useState<{ id: number; name: string } | null>(null);

  // Funzione per ricaricare le categorie
  const reloadCategories = useCallback(async () => {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Ricaricamento categorie in corso...');
      }
      const categoriesResponse = await categoryService.getPublic();
      if (categoriesResponse.success) {
        const cats = categoriesResponse.data.categories || [];
        cats.sort((a: Category, b: Category) => {
          const ao = a.sort_order ?? 0;
          const bo = b.sort_order ?? 0;
          if (ao !== bo) return ao - bo;
          return (a.name || '').localeCompare(b.name || '');
        });
        setCategories(cats);
        if (process.env.NODE_ENV !== 'production') {
          console.log('Categorie ricaricate con successo');
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Errore nel ricaricamento delle categorie:', err);
      }
    }
  }, []);

  // Gestione eventi Socket.IO per aggiornamenti in tempo reale
  useProductEvents({
    onProductAdded: (data) => {
      console.log('🆕 Prodotto aggiunto, ricaricamento menu...', data);
      reloadCategories();
    },
    onProductUpdated: (data) => {
      console.log('✏️ Prodotto aggiornato, ricaricamento menu...', data);
      reloadCategories();
    },
    onProductDeleted: (data) => {
      console.log('🗑️ Prodotto eliminato, ricaricamento menu...', data);
      reloadCategories();
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch business info
        const businessResponse = await businessService.get();
        setBusinessInfo(businessResponse);

        // Fetch public categories (only parent categories with products)
        const categoriesResponse = await categoryService.getPublic();
        if (categoriesResponse.success) {
          const cats = categoriesResponse.data.categories || [];
          cats.sort((a: Category, b: Category) => {
            const ao = a.sort_order ?? 0;
            const bo = b.sort_order ?? 0;
            if (ao !== bo) return ao - bo;
            return (a.name || '').localeCompare(b.name || '');
          });
          setCategories(cats);
        } else {
          setError('Errore nel caricamento delle categorie');
        }

        // Fetch custom menus to detect visible one
        try {
          const cm = await customMenuService.getAll();
          const menus = cm?.data?.menus || [];
          const firstVisible = menus.find((m: any) => m.is_visible);
          if (firstVisible) {
            setVisibleCustom({ id: firstVisible.id, name: firstVisible.name });
          } else {
            setVisibleCustom(null);
          }
        } catch { /* ignore */ }
      } catch (err) {
        console.error('Errore nel caricamento dei dati:', err);
        setError('Errore nel caricamento del menu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCategoryClick = (category: Category) => {
    navigate(`/menu/category/${category.id}`);
  };

  if (loading) {
    return (
      <div className="public-menu-loading">
        <div className="loading-spinner"></div>
        <p>Caricamento menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-menu-error">
        <h2>Errore</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="public-menu-container">
      {loading && (
        <div className="loading-state">
          <p>Caricamento menu...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>Errore nel caricamento del menu: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Header with logo */}
          <header className="public-menu-header">
            {businessInfo?.logo_path && (
              <div className="logo-container">
                  <img 
                  src={`${API_BASE_URL}${businessInfo.logo_path}`} 
                  alt={businessInfo.name || 'Logo'}
                  className="business-logo"
                  onLoad={() => {
                    if (process.env.NODE_ENV !== 'production') {
                      console.log('Logo caricato con successo:', `${API_BASE_URL}${businessInfo.logo_path}`);
                    }
                  }}
                  onError={(e) => {
                    if (process.env.NODE_ENV !== 'production') {
                      console.error('Errore nel caricamento del logo:', `${API_BASE_URL}${businessInfo.logo_path}`);
                    }
                  }}
                />
              </div>
            )}
            <div className="business-name">
              Menu
            </div>
            {businessInfo?.description && (
              <div className="business-subtitle">
                <p className="business-description">{businessInfo.description}</p>
              </div>
            )}
            <div className="language-switch">
              <button
                type="button"
                className={language === 'it' ? 'active' : ''}
                onClick={() => {
                  setLanguage('it');
                  if (typeof window !== 'undefined') localStorage.setItem('menu-language', 'it');
                }}
                aria-label="Imposta lingua italiana"
              >
                IT
              </button>
              <span className="separator">|</span>
              <button
                type="button"
                className={language === 'en' ? 'active' : ''}
                onClick={() => {
                  setLanguage('en');
                  if (typeof window !== 'undefined') localStorage.setItem('menu-language', 'en');
                }}
                aria-label="Set English language"
              >
                EN
              </button>
            </div>
          </header>

          {/* Main content */}
          <main className="public-menu-content">
            <div className="categories-container">
              {visibleCustom && (
                <button
                  key={`custom-${visibleCustom.id}`}
                  className="category-button"
                  onClick={() => navigate('/menu/custom')}
                >
                  {visibleCustom.name}
                </button>
              )}
              {categories.map((category) => (
                <button
                  key={category.id}
                  className="category-button"
                  onClick={() => handleCategoryClick(category)}
                >
                  {language === 'en' ? (category.name_en || category.name) : category.name}
                </button>
              ))}
            </div>
          </main>

          {/* Footer */}
          <SharedFooter />
        </>
      )}
    </div>
  );
};

export default PublicMenu;