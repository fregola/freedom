import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { customMenuService, productService } from '../services/api';
import SharedFooter from '../components/SharedFooter';

const API_BASE_URL = (typeof window !== 'undefined' ? `${window.location.origin}/api` : ((process.env.REACT_APP_API_URL as string | undefined) || '/api'));

type VisibleMenu = {
  id: number;
  name: string;
  price?: number | null;
  items: { 
    product: { 
      id: number; 
      name: string; 
      image_path?: string;
      price?: number;
      description?: string;
      description_en?: string;
    } 
  }[];
};

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
  padding-bottom: 120px;
`;

const StickyBar = styled.div`
  position: sticky;
  top: 0;
  z-index: 1000;
  background: #f5f7fa;
  margin-left: -20px;
  margin-right: -20px;
  padding: 8px 20px 12px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const MenuPrice = styled.div`
  background: rgba(204, 157, 109, 0.1);
  border: 1px solid rgba(204, 157, 109, 0.3);
  color: #cc9d6d;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 1.4rem;
  font-weight: 700;
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
  margin-top: 20px;
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

const ProductImage = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'hasImage' })<{ hasImage: boolean }>`
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

const PublicCustomMenu: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [menu, setMenu] = useState<VisibleMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<number, any>>({});

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        
        const res: any = await customMenuService.getById(parseInt(id));
        if (res?.success && res?.data?.menu) {
          const m = res.data.menu;
          const mapped: VisibleMenu = {
            id: m.id,
            name: m.name,
            price: typeof m.price === 'number' ? m.price : (m.price ? Number(m.price) : null),
            items: Array.isArray(m.items) ? m.items.map((it: any) => ({ 
              product: { 
                id: it.product_id, 
                name: it.name, 
                image_path: it.image_path,
                price: it.price,
                description: it.description,
                description_en: it.description_en
              } 
            })) : [],
          };
          setMenu(mapped);
        } else {
          setError('Menu non trovato');
        }
      } catch (e) {
        setError('Errore nel caricamento del menu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!menu) return;
      try {
        const ids = menu.items.map(it => it.product.id);
        if (ids.length === 0) {
          setDetails({});
          return;
        }
        const res: any = await productService.getByIds(ids);
        const list: any[] = res?.data?.products || res?.products || [];
        const map: Record<number, any> = {};
        list.forEach((p: any) => { if (p && p.id) map[p.id] = p; });
        setDetails(map);
      } catch (e) {
        setDetails({});
      }
    };
    fetchDetails();
  }, [menu]);

  if (loading) {
    return <LoadingState>Caricamento menu...</LoadingState>;
  }

  if (error) {
    return <EmptyState>{error}</EmptyState>;
  }

  if (!menu) {
    // Se non c'è menu, non c'è loading e non c'è errore, torniamo alla home o al menu
    // Usiamo Navigate invece di navigate() nel render per evitare warning
    return <Navigate to="/menu" replace />;
  }

  return (
    <PageContainer>
      <StickyBar>
        <Header>
          <HeaderLeft>
            <BackButton onClick={() => navigate('/menu')}>← Torna al Menu</BackButton>
            <CategoryTitle>{menu.name}</CategoryTitle>
            {typeof menu.price === 'number' && (
              <MenuPrice>{`€${menu.price.toFixed(2)}`}</MenuPrice>
            )}
          </HeaderLeft>
        </Header>
      </StickyBar>

      <ProductsGrid>
        {menu.items.map((it) => (
          <ProductCard key={it.product.id}>
            <ProductImage hasImage={true}>
              <img
                src={it.product.image_path ? `${API_BASE_URL}${it.product.image_path}` : '/nofoto.jpg'}
                alt={it.product.name}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.src = '/nofoto.jpg';
                }}
              />
            </ProductImage>
            <ProductName>{it.product.name}</ProductName>
            {details[it.product.id]?.ingredients && details[it.product.id].ingredients.length > 0 && (
              <IngredientsSection>
                <SectionRow>
                  <SectionLabel>
                    <span>🥄</span>
                    <span>Ingredienti:</span>
                  </SectionLabel>
                  <ItemsList>
                    {details[it.product.id].ingredients
                      .map((ingredient: any) => ingredient?.name || '')
                      .filter(Boolean)
                      .sort((a: string, b: string) => (a || '').localeCompare((b || ''), 'it', { sensitivity: 'base' }))
                      .join(', ')}
                  </ItemsList>
                </SectionRow>
              </IngredientsSection>
            )}
            {details[it.product.id]?.allergens && details[it.product.id].allergens.length > 0 && (
              <AllergensSection>
                <SectionRow>
                  <SectionLabel>
                    <span>⚠️</span>
                    <span>Allergeni:</span>
                  </SectionLabel>
                  <ItemsList>
                    {details[it.product.id].allergens
                      .map((allergen: any) => allergen?.name || '')
                      .filter(Boolean)
                      .sort((a: string, b: string) => (a || '').localeCompare((b || ''), 'it', { sensitivity: 'base' }))
                      .join(', ')}
                  </ItemsList>
                </SectionRow>
              </AllergensSection>
            )}
          </ProductCard>
        ))}
      </ProductsGrid>

      <SharedFooter />
    </PageContainer>
  );
};

export default PublicCustomMenu;