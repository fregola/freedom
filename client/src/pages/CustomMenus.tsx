import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { productService, customMenuService } from '../services/api';
import SelectProductModal from '../components/SelectProductModal';

type Product = {
  id: number;
  name: string;
  category_id?: number;
  category_name?: string;
  image_path?: string;
};

type MenuItem = {
  product: Product;
};

type CustomMenu = {
  id: number | string;
  name: string;
  price?: number;
  isVisible?: boolean;
  items: MenuItem[];
};

const PageContainer = styled.div`
  padding: 24px;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const Title = styled.h1`
  font-size: 20px;
  margin: 0;
  color: #111827;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  @media (min-width: 1024px) {
    grid-template-columns: 1.2fr 1fr;
  }
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  margin: 0 0 12px 0;
  color: #111827;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ItemRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
`;


const EmptyState = styled.div`
  color: #6b7280;
  font-size: 14px;
  padding: 12px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  th, td { border-bottom: 1px solid #f3f4f6; padding: 8px; text-align: left; }
  th { color: #6b7280; font-weight: 600; }
`;

const CustomMenus: React.FC = () => {
  const [menus, setMenus] = useState<CustomMenu[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const canSave = useMemo(() => name.trim().length > 0 && items.length > 0, [name, items]);

  useEffect(() => {
    if (!isCreating) return;
    if (allProducts.length > 0 || loadingProducts) return;
    setLoadingProducts(true);
    productService.getAll()
      .then((res: any) => {
        const list: Product[] = res?.data?.products || res?.products || [];
        setAllProducts(list);
      })
      .catch(() => setAllProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [isCreating, allProducts.length, loadingProducts]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingMenus(true);
        const res: any = await customMenuService.getAll();
        const list = res?.data?.menus || [];
        const mapped: CustomMenu[] = list.map((m: any) => ({
          id: m.id,
          name: m.name,
          price: typeof m.price === 'number' ? m.price : (m.price ? Number(m.price) : undefined),
          isVisible: m.is_visible ? Boolean(m.is_visible) : false,
          items: Array.isArray(m.items) ? m.items.map((it: any) => ({ product: { id: it.product_id, name: it.name, category_id: it.category_id, category_name: it.category_name, image_path: it.image_path } })) : [],
        }));
        setMenus(mapped);
      } catch (e) {
        // no-op
      } finally {
        setLoadingMenus(false);
      }
    };
    load();
  }, []);

  const openCreate = () => {
    setIsCreating(true);
    setEditingId(null);
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setIsVisible(false);
    setItems([]);
    setError(null);
  };

  const handleAddItem = (product: Product) => {
    setItems((prev) => [...prev, { product }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
    setProductModalOpen(true);
  };

  const handleSave = async () => {
    if (!canSave) {
      setError('Compila nome e aggiungi almeno una portata');
      return;
    }
    try {
      setError(null);
      const payload = {
        name: name.trim(),
        price: price ? parseFloat(price) : null,
        is_visible: isVisible,
        items: items.map(it => it.product.id),
      };
      if (editingId) {
        await customMenuService.update(Number(editingId), payload);
      } else {
        await customMenuService.create(payload);
      }
      // ricarica elenco
      const res: any = await customMenuService.getAll();
      const list = res?.data?.menus || [];
      const mapped: CustomMenu[] = list.map((m: any) => ({
        id: m.id,
        name: m.name,
        price: typeof m.price === 'number' ? m.price : (m.price ? Number(m.price) : undefined),
        isVisible: m.is_visible ? Boolean(m.is_visible) : false,
        items: Array.isArray(m.items) ? m.items.map((it: any) => ({ product: { id: it.product_id, name: it.name, category_id: it.category_id, category_name: it.category_name, image_path: it.image_path } })) : [],
      }));
      setMenus(mapped);
      resetForm();
      setIsCreating(false);
      setEditingId(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Errore nel salvataggio del menu');
    }
  };

  const startEdit = (menu: CustomMenu) => {
    setIsCreating(true);
    setEditingId(Number(menu.id));
    setName(menu.name);
    setPrice(typeof menu.price === 'number' ? String(menu.price) : '');
    setIsVisible(Boolean(menu.isVisible));
    setItems(menu.items.map(it => ({ product: it.product })));
    setError(null);
  };

  const handleDelete = async (id: number | string) => {
    const ok = window.confirm('Eliminare definitivamente questo menu?');
    if (!ok) return;
    try {
      await customMenuService.delete(Number(id));
      const res: any = await customMenuService.getAll();
      const list = res?.data?.menus || [];
      const mapped: CustomMenu[] = list.map((m: any) => ({
        id: m.id,
        name: m.name,
        price: typeof m.price === 'number' ? m.price : (m.price ? Number(m.price) : undefined),
        isVisible: m.is_visible ? Boolean(m.is_visible) : false,
        items: Array.isArray(m.items) ? m.items.map((it: any) => ({ product: { id: it.product_id, name: it.name, category_id: it.category_id, category_name: it.category_name, image_path: it.image_path } })) : [],
      }));
      setMenus(mapped);
    } catch (e) {
      // opzionale: mostrare errore
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <Title>Menu personalizzati</Title>
        <Button onClick={openCreate}>Nuovo menu</Button>
      </PageHeader>

      {isCreating && (
        <Grid>
          <Card>
            <SectionTitle>{editingId ? 'Modifica menu' : 'Dati menu'}</SectionTitle>
            <Row>
              <Input
                label="Nome menu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
              />
              <Input
                label="Prezzo menu (€)"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                fullWidth
              />
            </Row>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 12px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}>
                <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
                <span>Visibile</span>
              </label>
            </div>

            <SectionTitle>Portate</SectionTitle>
            <ItemsList>
              {items.length === 0 && (
                <EmptyState>Nessuna portata aggiunta</EmptyState>
              )}
              {items.map((it, idx) => (
                <ItemRow key={`${it.product.id}-${idx}`}>
                  <div>
                    <strong>{it.product.name}</strong>
                  </div>
                  <Button variant="secondary" onClick={() => handleEditItem(idx)}>Modifica</Button>
                  <Button variant="secondary" onClick={() => handleRemoveItem(idx)}>Rimuovi</Button>
                </ItemRow>
              ))}
            </ItemsList>
            <Actions>
              <Button onClick={() => setProductModalOpen(true)}>Aggiungi portata</Button>
            </Actions>
            {error && (
              <div style={{ color: '#dc2626', marginTop: 8 }}>{error}</div>
            )}
            <Actions>
              <Button variant="secondary" onClick={() => { resetForm(); setIsCreating(false); setEditingId(null); }}>Annulla</Button>
              <Button onClick={handleSave} disabled={!canSave}>{editingId ? 'Aggiorna' : 'Salva'}</Button>
            </Actions>
          </Card>

          <Card>
            <SectionTitle>Anteprima</SectionTitle>
            <div style={{ fontSize: 14, color: '#374151' }}>
              <div><strong>Nome:</strong> {name || '-'}</div>
              <div><strong>Prezzo menu:</strong> {price ? `€${Number(price).toFixed(2)}` : '-'}</div>
              <div><strong>Visibile:</strong> {isVisible ? 'Sì' : 'No'}</div>
              <div style={{ marginTop: 8 }}><strong>Portate:</strong></div>
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                {items.map((it, i) => (
                  <li key={i}>{it.product.name}</li>
                ))}
              </ul>
            </div>
          </Card>
        </Grid>
      )}

      <Card>
        <SectionTitle>Elenco menu</SectionTitle>
        {loadingMenus ? (
          <EmptyState>Caricamento…</EmptyState>
        ) : menus.length === 0 ? (
          <EmptyState>Nessun menu creato</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Visibile</th>
                <th>Prezzo</th>
                <th>Portate</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.isVisible ? 'Sì' : 'No'}</td>
                  <td>{typeof m.price === 'number' ? `€${m.price.toFixed(2)}` : '-'}</td>
                  <td>{m.items.length}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button size="small" variant="secondary" onClick={() => startEdit(m)}>Modifica</Button>
                      <Button size="small" variant="danger" onClick={() => handleDelete(m.id)}>Elimina</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <SelectProductModal
        isOpen={productModalOpen}
        onClose={() => { setProductModalOpen(false); setEditingItemIndex(null); }}
        onSelect={(p: Product) => {
          if (editingItemIndex !== null) {
            setItems(prev => prev.map((it, i) => i === editingItemIndex ? { product: { ...it.product, ...p } } : it));
          } else {
            handleAddItem(p);
          }
          setProductModalOpen(false);
          setEditingItemIndex(null);
        }}
        editProductId={editingItemIndex !== null ? items[editingItemIndex]?.product?.id : undefined}
      />
    </PageContainer>
  );
};

export default CustomMenus;