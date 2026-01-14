import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { productService, categoryService, allergenService, ingredientService } from '../services/api';
import Button from './common/Button';
import Input from './common/Input';

type Product = {
  id: number;
  name: string;
  category_id?: number;
  category_name?: string;
};

type Category = { id: number; name: string };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  editProductId?: number;
}

const ModalOverlay = styled.div.withConfig({ shouldForwardProp: (p) => !['isOpen'].includes(p) })<{ isOpen: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: #fff;
  width: 96vw;
  max-width: 820px;
  height: 90vh;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 32px rgba(0,0,0,0.12);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
`;

const Body = styled.div.withConfig({ shouldForwardProp: (p) => p !== '$single' })<{ $single?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $single }) => ($single ? '1fr' : '1.1fr 1fr')};
  gap: 0;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  @media (max-width: 900px) { 
    grid-template-columns: 1fr; 
    overflow: auto;
  }
`;

const Column = styled.div`
  padding: 12px 16px;
  overflow: auto;
  min-height: 0;
`;

const SubTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #111827;
`;

const FieldLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin: 8px 0 6px;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 12px 0;
`;

const Section = styled.div`
  padding: 8px 0;
`;

const CheckboxGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
`;

const RowBetween = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const SmallActions = styled.div`
  display: flex;
  gap: 8px;
`;

const FooterBar = styled.div`
  position: sticky;
  bottom: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.6) 0%, #ffffff 40%);
  border-top: 1px solid #e5e7eb;
  padding: 12px 0 0;
  margin-top: 8px;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Item = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
`;

const Muted = styled.span`
  color: #6b7280;
  font-size: 13px;
`;


const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #fff;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const SelectProductModal: React.FC<Props> = ({ isOpen, onClose, onSelect, editProductId }) => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'select'|'create'>('select');
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<string>('');
  const [allergens, setAllergens] = useState<{id:number; name:string}[]>([]);
  const [ingredients, setIngredients] = useState<{id:number; name:string}[]>([]);
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<number[]>([]);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<number[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [allergenQuery, setAllergenQuery] = useState('');
  const [initializedEdit, setInitializedEdit] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editProductId) {
      setActiveTab('create');
    }
    if (editProductId) return;
    setLoading(true);
    productService.getAll()
      .then((res: any) => {
        const list: Product[] = res?.data?.products || res?.products || [];
        setProducts(list);
      })
      .finally(() => setLoading(false));
  }, [isOpen, editProductId]);

  useEffect(() => {
    if (!isOpen) return;
    categoryService.getAll()
      .then((res: any) => {
        const list: Category[] = res?.data?.categories || res?.categories || [];
        setCategories(list);
      })
      .catch(() => setCategories([]));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([allergenService.getAll(), ingredientService.getAll()])
      .then(([a, i]: any[]) => {
        const allergensList = (a?.data?.allergens || a?.allergens || a || []).map((x: any) => ({ id: x.id, name: x.name }));
        const ingredientsList = (i?.data?.ingredients || i?.ingredients || i || []).map((x: any) => ({ id: x.id, name: x.name }));
        setAllergens(allergensList);
        setIngredients(ingredientsList);
      })
      .catch(() => { setAllergens([]); setIngredients([]); });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!editProductId) {
      setInitializedEdit(false);
      return;
    }
    if (initializedEdit) return;
    productService.getById(editProductId)
      .then((res: any) => {
        const p = res?.data?.product || res?.product || res;
        setNewName(p?.name || '');
        setNewCategoryId(p?.category_id ? String(p.category_id) : '');
        const aIds = Array.isArray(p?.allergens) ? p.allergens.map((x: any) => x.id) : [];
        const iIds = Array.isArray(p?.ingredients) ? p.ingredients.map((x: any) => x.id) : [];
        setSelectedAllergenIds(aIds);
        setSelectedIngredientIds(iIds);
        setInitializedEdit(true);
      })
      .catch(() => {
        setInitializedEdit(true);
      });
  }, [isOpen, editProductId, initializedEdit]);

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || (p.category_name || '').toLowerCase().includes(q));
  }, [products, query]);

  const submitCreate = async () => {
    if (!newName.trim()) {
      setError('Inserisci il nome del prodotto');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('name', newName.trim());
      if (newCategoryId) fd.append('category_id', newCategoryId);
      selectedAllergenIds.forEach((id) => fd.append('allergen_ids[]', String(id)));
      selectedIngredientIds.forEach((id) => fd.append('ingredient_ids[]', String(id)));
      if (imageFile) fd.append('image', imageFile);
      let res: any;
      if (editProductId) {
        res = await productService.update(editProductId, fd);
      } else {
        res = await productService.create(fd);
      }
      const created: Product = res?.data?.product || res?.product || res;
      if (created && created.id) {
        onSelect(created);
        onClose();
      } else {
        setError('Operazione non riuscita');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay isOpen={isOpen}>
      <Modal>
        <Header>
          <Title>{editProductId ? 'Modifica portata' : 'Aggiungi portata'}</Title>
          <div style={{ display: 'flex', gap: 8 }}>
            {!editProductId && (
              <>
                <Button variant={activeTab === 'select' ? 'primary' : 'secondary'} onClick={() => setActiveTab('select')}>Seleziona</Button>
                <Button variant={activeTab === 'create' ? 'primary' : 'secondary'} onClick={() => setActiveTab('create')}>Crea nuovo</Button>
              </>
            )}
            <Button variant="secondary" onClick={onClose}>Chiudi</Button>
          </div>
        </Header>
        <Body $single={activeTab === 'create'}>
          {activeTab === 'select' && (
            <Column>
              <>
                <SubTitle>Prodotti esistenti</SubTitle>
                <Input placeholder="Cerca per nome o categoria" value={query} onChange={(e) => setQuery(e.target.value)} fullWidth />
                <div style={{ height: 8 }} />
                {loading ? (
                  <Muted>Caricamento...</Muted>
                ) : (
                  <List>
                    {filtered.map((p) => (
                      <Item key={p.id} onClick={() => onSelect(p)}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          {p.category_name && <Muted>{p.category_name}</Muted>}
                        </div>
                        <div />
                      </Item>
                    ))}
                    {filtered.length === 0 && <Muted>Nessun prodotto trovato</Muted>}
                  </List>
                )}
              </>
            </Column>
          )}
          <Column>
            {activeTab === 'create' && (
              <>
                <SubTitle>{editProductId ? 'Dettagli portata' : 'Nuovo prodotto'}</SubTitle>
                <Input label="Nome" value={newName} onChange={(e) => setNewName(e.target.value)} fullWidth required />

                <Section>
                  <FieldLabel>Categoria</FieldLabel>
                  <Select value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)}>
                    <option value="">Nessuna</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </Section>

                <Section>
                  <FieldLabel>Foto</FieldLabel>
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </Section>

                <Divider />

                <Section>
                  <RowBetween>
                    <SubTitle>Ingredienti</SubTitle>
                    <SmallActions>
                      <button style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }} onClick={() => setSelectedIngredientIds(ingredients.map(i => i.id))}>Seleziona tutto</button>
                      <button style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }} onClick={() => setSelectedIngredientIds([])}>Deseleziona</button>
                    </SmallActions>
                  </RowBetween>
                  <Input placeholder={`Cerca ingredienti (${selectedIngredientIds.length} selezionati)`} value={ingredientQuery} onChange={(e) => setIngredientQuery(e.target.value)} fullWidth />
                  <CheckboxGrid>
                    {ingredients
                      .filter(i => i.name.toLowerCase().includes(ingredientQuery.toLowerCase()))
                      .sort((a, b) => a.name.localeCompare(b.name, 'it', { sensitivity: 'base' }))
                      .map(i => (
                      <label key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="checkbox"
                          checked={selectedIngredientIds.includes(i.id)}
                          onChange={(e) => {
                            setSelectedIngredientIds(prev => e.target.checked ? [...prev, i.id] : prev.filter(x => x !== i.id));
                          }}
                        />
                        <span>{i.name}</span>
                      </label>
                    ))}
                  </CheckboxGrid>
                </Section>

                <Divider />

                <Section>
                  <RowBetween>
                    <SubTitle>Allergeni</SubTitle>
                    <SmallActions>
                      <button style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }} onClick={() => setSelectedAllergenIds(allergens.map(a => a.id))}>Seleziona tutto</button>
                      <button style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }} onClick={() => setSelectedAllergenIds([])}>Deseleziona</button>
                    </SmallActions>
                  </RowBetween>
                  <Input placeholder={`Cerca allergeni (${selectedAllergenIds.length} selezionati)`} value={allergenQuery} onChange={(e) => setAllergenQuery(e.target.value)} fullWidth />
                  <CheckboxGrid>
                    {allergens
                      .filter(a => a.name.toLowerCase().includes(allergenQuery.toLowerCase()))
                      .sort((a, b) => a.name.localeCompare(b.name, 'it', { sensitivity: 'base' }))
                      .map(a => (
                      <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="checkbox"
                          checked={selectedAllergenIds.includes(a.id)}
                          onChange={(e) => {
                            setSelectedAllergenIds(prev => e.target.checked ? [...prev, a.id] : prev.filter(x => x !== a.id));
                          }}
                        />
                        <span>{a.name}</span>
                      </label>
                    ))}
                  </CheckboxGrid>
                </Section>
                {error && <div style={{ color: '#dc2626', marginBottom: 8 }}>{error}</div>}
                <FooterBar>
                  <Actions>
                    {!editProductId && (
                      <Button size="small" variant="secondary" onClick={() => { setNewName(''); setNewCategoryId(''); setSelectedAllergenIds([]); setSelectedIngredientIds([]); setImageFile(null); setError(null); }}>Reset</Button>
                    )}
                    <Button size="small" onClick={submitCreate} disabled={saving}>{saving ? 'Salvataggio…' : (editProductId ? 'Salva modifiche' : 'Crea e aggiungi')}</Button>
                  </Actions>
                </FooterBar>
              </>
            )}
          </Column>
        </Body>
      </Modal>
    </ModalOverlay>
  );
};

export default SelectProductModal;
