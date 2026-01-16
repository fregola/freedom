import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { categoryService } from '../services/api';

interface Category {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  is_active: boolean;
}

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalOverlay = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isOpen'].includes(prop),
})<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding: 0;

  @media (min-width: 768px) {
    align-items: center;
    padding: 20px;
  }
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  animation: slideUp 0.3s ease-out;

  @media (min-width: 768px) {
    border-radius: 20px;
    max-height: 90vh;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid #f0f0f0;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #e74c3c;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(231, 76, 60, 0.1);
  }
`;

const ModalBody = styled.div`
  padding: 8px 24px 24px 24px;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 14px;
  margin: 0 0 24px 0;
`;

const CategoriesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const CategoryItem = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  text-decoration: none;
  color: #333;
  border: none;
  background: none;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
  border-radius: 8px;
  margin-bottom: 2px;
  cursor: pointer;
  text-align: left;
  width: 100%;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const CategoryText = styled.div`
  flex: 1;
  font-size: 16px;
  font-weight: 500;
`;

const CategoryArrow = styled.div`
  color: #ccc;
  font-size: 18px;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #e74c3c;
`;

const CategoriesModal: React.FC<CategoriesModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language] = useState<'it' | 'en'>(
    (typeof window !== 'undefined' && localStorage.getItem('menu-language') === 'en') ? 'en' : 'it'
  );

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usa l'API public che filtra già le categorie con prodotti
      const response = await categoryService.getPublic();
      
      if (response.success) {
        setCategories(response.data.categories);
      } else {
        setError('Errore nel caricamento delle categorie');
      }
    } catch (err) {
      console.error('Errore nel caricamento delle categorie:', err);
      setError('Errore nel caricamento delle categorie');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    onClose();
    navigate(`/menu/category/${category.id}`);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Categorie</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <Subtitle>Consulta velocemente le categorie del Menù</Subtitle>
          
          {loading && (
            <LoadingState>Caricamento categorie...</LoadingState>
          )}
          
          {error && (
            <ErrorState>{error}</ErrorState>
          )}
          
          {!loading && !error && (
            <CategoriesList>
              {categories.map((category) => (
                <CategoryItem
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                >
                  <CategoryText>
                    <div>{language === 'en' ? (category.name_en || category.name) : category.name}</div>
                    {(language === 'en' ? category.description_en : category.description) && (
                      <div style={{ fontSize: '13px', color: '#888', marginTop: '2px', fontWeight: 'normal' }}>
                        {language === 'en' ? category.description_en : category.description}
                      </div>
                    )}
                  </CategoryText>
                  <CategoryArrow>›</CategoryArrow>
                </CategoryItem>
              ))}
            </CategoriesList>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CategoriesModal;