import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { categoryService, productService, businessService } from '../services/api';
import { useProductEvents } from '../hooks/useSocket';
import SharedFooter from '../components/SharedFooter';

// URL base per le risorse statiche via API (proxy-safe)
const API_BASE_URL = (typeof window !== 'undefined' ? `${window.location.origin}/api` : ((process.env.REACT_APP_API_URL as string | undefined) || '/api'));

interface Product {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  price: number;
  price_unit?: string;
  image_path?: string;
  is_active: number;
  category_id: number;
  category_name: string;
  allergens: Array<{
    id: number;
    name: string;
    name_en?: string;
  }>;
  ingredients: Array<{
    id: number;
    name: string;
    name_en?: string;
  }>;
}

interface BusinessInfo {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  website: string;
  logo_url?: string;
}

interface Allergen {
  id: number;
  name: string;
  name_en?: string;
  icon?: string;
}

interface Ingredient {
  id: number;
  name: string;
  name_en?: string;
  icon?: string;
}

interface Category {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  children?: Category[];
  parent_id?: number;
  sort_order?: number;
}

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f5f7fa; /* grigio uniforme senza sfumatura */
  padding: 20px;
  padding-bottom: 120px; /* Spazio per il footer fisso */
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
`;

const StickyBar = styled.div`
  position: sticky;
  top: 0;
  z-index: 1000; /* sopra tutto */
  background: #f5f7fa; /* stesso grigio chiaro dello sfondo pagina (top) */
  margin-left: -20px; /* full-bleed edge-to-edge */
  margin-right: -20px;
  padding: 8px 20px 12px; /* include header e tag nella fascia */
  border-bottom: none; /* rimosso per evitare stacchi visivi */
  box-shadow: none; /* rimosso per uniformare il colore */
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const BackButton = styled.button`
  background: rgba(204, 157, 109, 0.1);
  border: 1px solid rgba(204, 157, 109, 0.3);
  color: #cc9d6d;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: rgba(204, 157, 109, 0.2);
    transform: translateY(-1px);
  }
`;

const CategoryTitle = styled.h1`
  color: #cc9d6d;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  max-width: 1100px;
  margin: 0 auto;
  margin-top: 20px; /* spazio aumentato sotto la fascia */
`;

const ProductCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }
`;

const ProductImage = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'hasImage',
})<{ hasImage: boolean }>`
  width: 100%;
  height: 160px;
  border-radius: 15px;
  margin-bottom: 20px;
  background: ${props => props.hasImage ? 'none' : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 15px;
  }
`;

const ProductName = styled.h3`
  color: #2d3748;
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  line-height: 1.25;
`;

const PriceBadge = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(204, 157, 109, 0.95);
  color: #fff;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
`;

const ProductDescription = styled.p`
  color: #4a5568;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 10px;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 15px;
`;

// Spazio extra sotto i tag sottocategoria
const SubcategoryTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0; /* evito doppio spazio, lo gestisce la barra sticky */
`;

const IngredientsSection = styled.div`
  margin-bottom: 8px;
`;

const AllergensSection = styled.div`
  margin-bottom: 8px;
`;

const SectionRow = styled.div`
  display: block;
`;

const SectionLabel = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #4a5568;
  margin-right: 6px;
`;

const ItemsList = styled.div`
  color: #6b7280;
  display: inline;
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
  padding: 0;
  word-break: break-word;
`;

// Chip sottocategoria con colore coerente
// Chip sottocategoria con stato attivo per evidenziare il filtro
const SubcategoryChip = styled.button<{ $active?: boolean }>`
  background: rgba(204, 157, 109, 0.12);
  color: #b8906b;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid rgba(204, 157, 109, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(204, 157, 109, 0.2);
  }

  ${props => props.$active ? `
    background: rgba(204, 157, 109, 0.25);
    color: #9c6f4a;
    border-color: rgba(204, 157, 109, 0.8);
  ` : ''}
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
  color: #666;
  font-size: 1.2rem;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #666;
  font-size: 1.2rem;
  margin-top: 50px;
`;

const FixedNavigation = styled.div`
  position: fixed;
  bottom: 90px; /* posizionato sopra il footer fisso */
  right: 20px;
  z-index: 1100;
`;

const FloatingBackButton = styled.button`
  background: #cc9d6d;
  color: white;
  border: none;
  padding: 10px 16px; /* più piccolo */
  border-radius: 40px;
  cursor: pointer;
  font-size: 14px; /* più piccolo */
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(204, 157, 109, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: #b8906b;
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(204, 157, 109, 0.4);
  }
`;

const CategoryProducts: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [publicCategories, setPublicCategories] = useState<Category[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<number | null>(null);
  const [language] = useState<'it' | 'en'>(
    (typeof window !== 'undefined' && localStorage.getItem('menu-language') === 'en') ? 'en' : 'it'
  );

  // Funzione per ricaricare i prodotti
  const reloadProducts = useCallback(async () => {
    if (!categoryId) return;
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Ricaricamento prodotti (contesto padre) in corso...');
      }
      // Ottieni categoria corrente e mappa pubblica per calcolare il padre
      const [categoryResponse, parentsResponse] = await Promise.all([
        categoryService.getById(parseInt(categoryId)),
        categoryService.getPublic()
      ]);
      let publicParents: Category[] = [];
      if (parentsResponse?.success && parentsResponse.data?.categories) {
        publicParents = parentsResponse.data.categories || [];
      }
      const currentCat: Category | null = categoryResponse?.success ? categoryResponse.data.category : null;
      if (!currentCat) return;
      const directParent = publicParents.find((c) => (c.children || []).some((child) => child.id === currentCat.id));
      const isTopLevel = publicParents.some((c) => c.id === currentCat.id);
      const contextParent = directParent || (isTopLevel ? currentCat : currentCat);

      // Carica i prodotti del padre per permettere il filtro locale tra sottocategorie
      const productsResponse = await productService.getByCategory(contextParent.id);
      if (productsResponse.success) {
        setProducts(productsResponse.data.products);
        // Manteniamo la categoria in base al route corrente
        setCategory(currentCat);
        if (process.env.NODE_ENV !== 'production') {
          console.log('Prodotti ricaricati con successo (contesto padre)');
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Errore nel ricaricamento dei prodotti (contesto padre):', err);
      }
    }
  }, [categoryId]);

  // Gestione eventi Socket.IO per aggiornamenti in tempo reale
  useProductEvents({
    onProductAdded: (data) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Prodotto aggiunto, ricaricamento prodotti...', data);
      }
      reloadProducts();
    },
    onProductUpdated: (data) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Prodotto aggiornato, ricaricamento prodotti...', data);
      }
      reloadProducts();
    },
    onProductDeleted: (data) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Prodotto eliminato, ricaricamento prodotti...', data);
      }
      reloadProducts();
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!categoryId) return;
      
      try {
        setLoading(true);
        
        // Carica info categoria (con figli) e business; poi categorie pubbliche per contesto
        const [categoryResponse, businessResponse] = await Promise.all([
          categoryService.getById(parseInt(categoryId)),
          businessService.get()
        ]);
        const parentsResponse = await categoryService.getPublic();

        // Prepara categorie pubbliche e calcola il contesto (categoria padre) per mostrare SOLO i tag associati
        let publicParents: Category[] = [];
        if (parentsResponse?.success && parentsResponse.data?.categories) {
          publicParents = parentsResponse.data.categories || [];
          setPublicCategories(publicParents);
        }

        // Imposta sottocategorie dal contesto di categoria (padre): restano visibili anche navigando tra sottocategorie
        if (categoryResponse?.success && categoryResponse.data?.category) {
          const currentCat: Category = categoryResponse.data.category;

          // Trova la categoria padre nel set pubblico: se currentCat è figlio, usa il suo padre; altrimenti usa currentCat
          const findParent = (): Category | null => {
            // Diretti: currentCat come figlio di un top-level
            const directParent = publicParents.find((c) => (c.children || []).some((child) => child.id === currentCat.id));
            if (directParent) return directParent;
            // Se currentCat è top-level, il contesto è lui stesso
            const isTopLevel = publicParents.some((c) => c.id === currentCat.id);
            if (isTopLevel) return currentCat;
            return null;
          };

          const contextParent = findParent() || currentCat;
          // Se siamo entrati da una sottocategoria, selezioniamo quella come filtro attivo
          const fromSubcategory = !!publicParents.find((c) => (c.children || []).some((child) => child.id === currentCat.id));
          setActiveSubcategoryId(fromSubcategory ? currentCat.id : null);

          // Carica i prodotti del padre per avere tutte le sottocategorie filtrabili
          const productsResponse = await productService.getByCategory(contextParent.id);
          if (productsResponse.success) {
            setProducts(productsResponse.data.products);
            setCategory(currentCat); // Manteniamo il titolo coerente con la categoria corrente
          } else {
            setError('Errore nel caricamento dei prodotti');
          }

          const productCategoryIds = new Set(
            (productsResponse?.success ? productsResponse.data.products : []).map((p: Product) => p.category_id)
          );
          let contextChildren = (contextParent.children || []).filter((sub: Category) => productCategoryIds.has(sub.id));
          // Ordina per sort_order con fallback al nome
          contextChildren.sort((a, b) => {
            const ao = a.sort_order ?? 0;
            const bo = b.sort_order ?? 0;
            if (ao !== bo) return ao - bo;
            return (a.name || '').localeCompare(b.name || '');
          });
          setSubcategories(contextChildren);
        }

        // Il businessService restituisce direttamente i dati
        if (businessResponse) {
          setBusinessInfo(businessResponse);
        }
        
      } catch (err) {
        console.error('Errore nel caricamento dei dati:', err);
        setError('Errore nel caricamento dei dati');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId]);

  const handleBack = () => {
    navigate('/menu');
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingState>{language === 'en' ? 'Loading products...' : 'Caricamento prodotti...'}</LoadingState>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Header>
          <BackButton onClick={handleBack}>
            {language === 'en' ? '← Back to Menu' : '← Torna al Menu'}
          </BackButton>
        </Header>
        <EmptyState>{error}</EmptyState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <StickyBar>
        <Header>
          <HeaderLeft>
            <BackButton onClick={() => navigate('/menu')}>
              {language === 'en' ? '← Back to Menu' : '← Torna al Menu'}
            </BackButton>
            <CategoryTitle>{language === 'en' ? (category?.name_en || category?.name) : (category?.name || 'Categoria')}</CategoryTitle>
          </HeaderLeft>
        </Header>

        {/* Tags sottocategorie (filtri rapidi) */}
        {subcategories && subcategories.length > 0 && (
          <SubcategoryTags>
            {subcategories.map((sub) => (
              <SubcategoryChip
                key={sub.id}
                $active={activeSubcategoryId === sub.id}
                onClick={() => setActiveSubcategoryId(prev => prev === sub.id ? null : sub.id)}
              >
                {language === 'en' ? (sub.name_en || sub.name) : sub.name}
              </SubcategoryChip>
            ))}
          </SubcategoryTags>
        )}
      </StickyBar>

      {products.length === 0 ? (
        <EmptyState>{language === 'en' ? 'No products available in this category.' : 'Nessun prodotto disponibile in questa categoria.'}</EmptyState>
      ) : (
        <ProductsGrid>
          {(activeSubcategoryId ? products.filter(p => p.category_id === activeSubcategoryId) : products).map((product) => (
            <ProductCard key={product.id}>
              <ProductImage hasImage={true}>
                {product.image_path ? (
                  <img 
                    src={`${API_BASE_URL}${product.image_path}`}
                    alt={product.name}
                    onError={(e) => {
                      // Se l'immagine del prodotto non si carica, mostra l'immagine di default
                      e.currentTarget.src = '/nofoto.jpg';
                    }}
                  />
                ) : (
                  <img 
                    src="/nofoto.jpg"
                    alt="Immagine non disponibile"
                  />
                )}
                {/* Prezzo come badge nell'immagine con unità */}
                <PriceBadge>
                  € {product.price.toFixed(2)}
                  {product.price_unit ? ` / ${product.price_unit}` : ''}
                </PriceBadge>
              </ProductImage>

              <ProductName>{language === 'en' ? (product.name_en || product.name) : product.name}</ProductName>
              
              {(language === 'en' ? (product.description_en || product.description) : product.description) && (
                <ProductDescription>
                  {language === 'en' ? (product.description_en || product.description) : product.description}
                </ProductDescription>
              )}
              
              {/* Ingredienti */}
              {product.ingredients && product.ingredients.length > 0 && (
                <IngredientsSection>
                  <SectionRow>
                    <SectionLabel>
                      <span>🥄</span>
                      <span>{language === 'en' ? 'Ingredients:' : 'Ingredienti:'}</span>
                    </SectionLabel>
                    <ItemsList>
                      {product.ingredients
                        .map((ingredient) => (
                          language === 'en'
                            ? (ingredient?.name_en || ingredient?.name || '')
                            : (ingredient?.name || '')
                        ))
                        .filter(Boolean)
                        .sort((a, b) => (a || '').localeCompare((b || ''), language === 'en' ? 'en' : 'it', { sensitivity: 'base' }))
                        .join(', ')}
                    </ItemsList>
                  </SectionRow>
                </IngredientsSection>
              )}
              
              {/* Allergeni */}
              {product.allergens && product.allergens.length > 0 && (
                <AllergensSection>
                  <SectionRow>
                    <SectionLabel>
                      <span>⚠️</span>
                      <span>{language === 'en' ? 'Allergens:' : 'Allergeni:'}</span>
                    </SectionLabel>
                    <ItemsList>
                      {product.allergens
                        .map((allergen) => (
                          language === 'en'
                            ? (allergen?.name_en || allergen?.name || '')
                            : (allergen?.name || '')
                        ))
                        .filter(Boolean)
                        .sort((a, b) => (a || '').localeCompare((b || ''), language === 'en' ? 'en' : 'it', { sensitivity: 'base' }))
                        .join(', ')}
                    </ItemsList>
                  </SectionRow>
                </AllergensSection>
              )}
            </ProductCard>
          ))}
        </ProductsGrid>
      )}
      
      {/* Pulsante fisso rimosso su richiesta: si usa solo quello in header */}
      
      {/* Footer condiviso */}
      <SharedFooter />
    </PageContainer>
  );
};

export default CategoryProducts;