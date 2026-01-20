import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import Button from './common/Button';
import Input from './common/Input';
import { productService, categoryService } from '../services/api';

type Product = {
  id: number;
  name: string;
  category_id?: number;
  category_name?: string;
  image_path?: string;
};

type Category = {
  id: number;
  name: string;
};

type MenuItem = {
  product: Product;
};

export type CustomMenuData = {
  id?: number | string;
  name: string;
  price?: number;
  isVisible: boolean;
  items: MenuItem[];
};

interface Props {
  initialData?: CustomMenuData | null;
  onSave: (data: CustomMenuData) => Promise<void>;
  onCancel: () => void;
}

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  height: calc(100vh - 140px);
  min-height: 600px;
  
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Panel = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const PanelHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  color: #111827;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const SearchBar = styled.div`
  margin-bottom: 12px;
`;

const ProductList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ProductItem = styled.div<{ $selected?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid ${p => p.$selected ? '#3b82f6' : '#e5e7eb'};
  background: ${p => p.$selected ? '#eff6ff' : '#fff'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
  }
`;

const MenuItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  margin-bottom: 8px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
`;

const Badge = styled.span`
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #6b7280;
  margin-left: 8px;
`;

const QuickCreateForm = styled.div`
  padding: 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  margin: -12px -16px 12px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #fff;
  margin-bottom: 8px;
`;

const CustomMenuEditor: React.FC<Props> = ({ initialData, onSave, onCancel }) => {
  // Form State
  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState(initialData?.price ? String(initialData.price) : '');
  const [isVisible, setIsVisible] = useState(initialData?.isVisible ?? true);
  const [items, setItems] = useState<MenuItem[]>(initialData?.items || []);

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quick Create/Edit State
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategoryId, setNewProductCategoryId] = useState('');
  const [creatingProduct, setCreatingProduct] = useState(false);

  // UI State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingProducts(true);
    
    // Fetch products
    productService.getAll()
      .then((res: any) => {
        const list: Product[] = res?.data?.products || res?.products || [];
        setProducts(list);
      })
      .catch(console.error)
      .finally(() => setLoadingProducts(false));

    // Fetch categories
    categoryService.getAll()
      .then((res: any) => {
        const list: Category[] = res?.data?.categories || res?.categories || [];
        setCategories(list);
      })
      .catch(console.error);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return []; // Only show products when searching
    const q = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.category_name || '').toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const handleAddItem = (product: Product) => {
    setItems(prev => [...prev, { product }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;
    
    setItems(prev => {
      const newItems = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      return newItems;
    });
  };

  const startEditProduct = (product: Product) => {
    setProductToEdit(product);
    setNewProductName(product.name);
    setNewProductCategoryId(product.category_id ? String(product.category_id) : '');
    setShowQuickCreate(true);
  };

  const handleQuickCreateOrEdit = async () => {
    if (!newProductName.trim()) return;

    setCreatingProduct(true);
    try {
      const fd = new FormData();
      fd.append('name', newProductName.trim());
      if (newProductCategoryId) {
        fd.append('category_id', newProductCategoryId);
      }

      let updatedProduct: Product;

      if (productToEdit) {
        // Edit existing
        const res: any = await productService.update(productToEdit.id, fd);
        updatedProduct = res?.data?.product || res?.product || res;
        
        // Update in products list
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        
        // Update in items list if present
        setItems(prev => prev.map(item => 
          item.product.id === updatedProduct.id ? { ...item, product: updatedProduct } : item
        ));
      } else {
        // Create new
        const res: any = await productService.create(fd);
        updatedProduct = res?.data?.product || res?.product || res;
        
        // Add to products list
        setProducts(prev => [updatedProduct, ...prev]);
        // Add to menu
        handleAddItem(updatedProduct);
      }
      
      // Reset form
      setNewProductName('');
      setNewProductCategoryId('');
      setProductToEdit(null);
      setShowQuickCreate(false);
      
    } catch (e) {
      console.error('Error creating/updating product:', e);
    } finally {
      setCreatingProduct(false);
    }
  };

  const cancelEdit = () => {
    setProductToEdit(null);
    setNewProductName('');
    setNewProductCategoryId('');
    setShowQuickCreate(false);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Inserisci il nome del menu');
      return;
    }
    if (items.length === 0) {
      setError('Aggiungi almeno una portata al menu');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const data: CustomMenuData = {
        id: initialData?.id,
        name,
        price: price ? parseFloat(price) : undefined,
        isVisible,
        items
      };
      await onSave(data);
    } catch (e) {
      console.error(e);
      setError('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container>
      {/* Left Panel: Product Catalog */}
      <Panel>
        <PanelHeader>
          <PanelTitle>
            Prodotti
            <Button 
              size="small" 
              variant={showQuickCreate ? 'secondary' : 'primary'}
              onClick={() => {
                 if (showQuickCreate) cancelEdit();
                 else {
                   setProductToEdit(null);
                   setNewProductName('');
                   setNewProductCategoryId('');
                   setShowQuickCreate(true);
                 }
              }}
            >
              {showQuickCreate ? 'Chiudi' : '+ Crea Nuovo'}
            </Button>
          </PanelTitle>
        </PanelHeader>
        <div style={{ padding: '12px 16px 0' }}>
          {showQuickCreate && (
            <QuickCreateForm>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                {productToEdit ? 'Modifica Prodotto' : 'Nuovo Prodotto Rapido'}
              </div>
              <Input 
                placeholder="Nome prodotto" 
                value={newProductName} 
                onChange={e => setNewProductName(e.target.value)}
                fullWidth
                style={{ marginBottom: 8 }}
                autoFocus
              />
              <Select 
                value={newProductCategoryId} 
                onChange={e => setNewProductCategoryId(e.target.value)}
              >
                <option value="">Seleziona categoria (opzionale)</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button 
                  size="small" 
                  fullWidth 
                  onClick={handleQuickCreateOrEdit}
                  disabled={!newProductName.trim() || creatingProduct}
                >
                  {creatingProduct ? 'Salvataggio...' : (productToEdit ? 'Salva Modifiche' : 'Crea e Aggiungi')}
                </Button>
                {productToEdit && (
                  <Button size="small" variant="secondary" onClick={cancelEdit}>
                    Annulla
                  </Button>
                )}
              </div>
            </QuickCreateForm>
          )}
          
          <SearchBar>
            <Input 
              placeholder="Cerca prodotti esistenti..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              fullWidth
            />
          </SearchBar>
        </div>
        <PanelContent>
          {loadingProducts ? (
            <div style={{ color: '#6b7280', textAlign: 'center' }}>Caricamento prodotti...</div>
          ) : (
            <ProductList>
              {filteredProducts.map(p => (
                <ProductItem key={p.id} onClick={() => handleAddItem(p)}>
                  <div>
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    {p.category_name && <Badge>{p.category_name}</Badge>}
                  </div>
                  <Button size="small" variant="secondary" onClick={(e) => {
                    e?.stopPropagation();
                    handleAddItem(p);
                  }}>Aggiungi</Button>
                </ProductItem>
              ))}
              {searchQuery && filteredProducts.length === 0 && (
                <div style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>
                  Nessun prodotto trovato
                </div>
              )}
              {!searchQuery && (
                <div style={{ color: '#9ca3af', textAlign: 'center', padding: 32, fontSize: 14 }}>
                  Cerca un prodotto per visualizzare i risultati
                </div>
              )}
            </ProductList>
          )}
        </PanelContent>
      </Panel>

      {/* Right Panel: Menu Builder */}
      <Panel>
        <PanelHeader>
          <PanelTitle>
            Composizione Menu
            <div style={{ display: 'flex', gap: 8 }}>
               <Button variant="secondary" size="small" onClick={onCancel}>Annulla</Button>
               <Button size="small" onClick={handleSubmit} disabled={saving}>
                 {saving ? 'Salvataggio...' : 'Salva Menu'}
               </Button>
            </div>
          </PanelTitle>
        </PanelHeader>
        <PanelContent>
          {error && (
            <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 6, marginBottom: 16 }}>
              {error}
            </div>
          )}
          
          <FormRow>
            <Input 
              label="Nome Menu" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              fullWidth
            />
            <Input 
              label="Prezzo (€)" 
              type="number" 
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              placeholder="0.00" 
              fullWidth
            />
          </FormRow>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={isVisible} 
              onChange={e => setIsVisible(e.target.checked)} 
            />
            <span>Visibile nel listino</span>
          </label>

          <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#4b5563' }}>
            Portate ({items.length})
          </h4>
          
          {items.length === 0 ? (
            <div style={{ 
              border: '2px dashed #e5e7eb', 
              borderRadius: 8, 
              padding: 32, 
              textAlign: 'center', 
              color: '#9ca3af' 
            }}>
              Seleziona i prodotti dalla colonna di sinistra o creane di nuovi
            </div>
          ) : (
            <div>
              {items.map((item, idx) => (
                <MenuItemRow key={`${item.product.id}-${idx}`}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button 
                      size="small" 
                      variant="secondary" 
                      disabled={idx === 0}
                      onClick={() => handleMoveItem(idx, 'up')}
                      style={{ padding: '2px 6px', height: 'auto', fontSize: 10 }}
                    >▲</Button>
                    <Button 
                      size="small" 
                      variant="secondary" 
                      disabled={idx === items.length - 1}
                      onClick={() => handleMoveItem(idx, 'down')}
                      style={{ padding: '2px 6px', height: 'auto', fontSize: 10 }}
                    >▼</Button>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{item.product.name}</div>
                    {item.product.category_name && (
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{item.product.category_name}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button 
                      variant="secondary" 
                      size="small" 
                      onClick={() => startEditProduct(item.product)}
                    >
                      Modifica
                    </Button>
                    <Button 
                      variant="danger" 
                      size="small" 
                      onClick={() => handleRemoveItem(idx)}
                    >
                      Rimuovi
                    </Button>
                  </div>
                </MenuItemRow>
              ))}
            </div>
          )}
        </PanelContent>
      </Panel>
    </Container>
  );
};

export default CustomMenuEditor;