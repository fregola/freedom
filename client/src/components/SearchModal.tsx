import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { productService } from '../services/api';

// URL base per le risorse statiche via API (proxy-safe)
const API_BASE_URL = (typeof window !== 'undefined' ? `${window.location.origin}/api` : ((process.env.REACT_APP_API_URL as string | undefined) || '/api'));

interface Product {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  price?: number;
  category_id?: number;
  category_name?: string;
  image_path?: string;
  is_available: boolean;
  allergens?: any[];
  ingredients?: any[];
}

interface SearchModalProps {
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
  max-width: 600px;
  max-height: 85vh;
  overflow: hidden;
  position: relative;
  animation: slideUp 0.3s ease-out;
  display: flex;
  flex-direction: column;

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
  flex-shrink: 0;
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

const SearchContainer = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: #007bff;
  }

  &::placeholder {
    color: #999;
  }
`;

const ResultsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
`;

const SearchInfo = styled.div`
  padding: 0 24px 16px 24px;
  color: #666;
  font-size: 14px;
`;

const ProductsList = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProductItem = styled.button`
  display: flex;
  align-items: center;
  padding: 16px 24px;
  text-decoration: none;
  color: #333;
  border: none;
  background: none;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
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

const ProductImage = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: #f5f5f5;
  margin-right: 16px;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ProductInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ProductName = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
`;

const ProductCategory = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
`;

const ProductPrice = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #cc9d6d;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 24px;
  color: #666;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px 24px;
  color: #666;
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 40px 24px;
  color: #e74c3c;
`;

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus sull'input quando il modal si apre
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset quando il modal si chiude
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setProducts([]);
      setError(null);
      setHasSearched(false);
    }
  }, [isOpen]);

  // Debounce della ricerca
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        performSearch(searchQuery.trim());
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setProducts([]);
      setHasSearched(false);
      setError(null);
    }
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      
      const response = await productService.search(query);
      
      if (response.success) {
        setProducts(response.data.products);
      } else {
        setError('Errore nella ricerca');
        setProducts([]);
      }
    } catch (err) {
      console.error('Errore nella ricerca:', err);
      setError('Errore nella ricerca');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    onClose();
    // Naviga alla categoria del prodotto
    if (product.category_id) {
      navigate(`/menu/category/${product.category_id}`);
    } else {
      navigate('/menu');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return '';
    return `€${price.toFixed(2)}`;
  };

  return (
    <ModalOverlay isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Cerca Prodotti</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <SearchContainer>
          <SearchInput
            ref={searchInputRef}
            type="text"
            placeholder="Cerca prodotti, categorie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchContainer>
        
        <ResultsContainer>
          {searchQuery.trim().length < 2 && (
            <EmptyState>
              Inserisci almeno 2 caratteri per iniziare la ricerca
            </EmptyState>
          )}
          
          {loading && (
            <LoadingState>Ricerca in corso...</LoadingState>
          )}
          
          {error && (
            <ErrorState>{error}</ErrorState>
          )}
          
          {hasSearched && !loading && !error && searchQuery.trim().length >= 2 && (
            <>
              <SearchInfo>
                {products.length > 0 
                  ? `${products.length} prodotto${products.length !== 1 ? 'i' : ''} trovato${products.length !== 1 ? 'i' : ''} per "${searchQuery}"`
                  : `Nessun prodotto trovato per "${searchQuery}"`
                }
              </SearchInfo>
              
              {products.length > 0 && (
                <ProductsList>
                  {products.map((product) => (
                    <ProductItem
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                    >
                      <ProductImage>
                        {product.image_path ? (
                          <img 
                            src={`${API_BASE_URL}${product.image_path}`} 
                            alt={product.name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div style={{ color: '#ccc', fontSize: '24px' }}>📷</div>
                        )}
                      </ProductImage>
                      
                      <ProductInfo>
                        <ProductName>{product.name}</ProductName>
                        {product.category_name && (
                          <ProductCategory>{product.category_name}</ProductCategory>
                        )}
                        {product.price && (
                          <ProductPrice>{formatPrice(product.price)}</ProductPrice>
                        )}
                      </ProductInfo>
                    </ProductItem>
                  ))}
                </ProductsList>
              )}
            </>
          )}
        </ResultsContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SearchModal;