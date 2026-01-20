import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { customMenuService } from '../services/api';
import CustomMenuEditor, { CustomMenuData } from '../components/CustomMenuEditor';

const PageContainer = styled.div`
  padding: 24px;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0;
  color: #111827;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const EmptyState = styled.div`
  color: #6b7280;
  font-size: 14px;
  padding: 32px;
  text-align: center;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #e5e7eb;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  
  th {
    text-align: left;
    padding: 12px 16px;
    color: #6b7280;
    font-weight: 600;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  td {
    padding: 12px 16px;
    border-bottom: 1px solid #f3f4f6;
    color: #111827;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  
  tr:hover td {
    background: #f9fafb;
  }
`;

const Badge = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${p => p.$active ? '#dcfce7' : '#f3f4f6'};
  color: ${p => p.$active ? '#166534' : '#6b7280'};
`;

const SwitchLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: #10b981;
  }
  
  &:checked + span:before {
    transform: translateX(16px);
  }
`;

const SwitchSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e5e7eb;
  transition: .2s;
  border-radius: 34px;
  
  &:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .2s;
    border-radius: 50%;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
`;

const CustomMenus: React.FC = () => {
  const [menus, setMenus] = useState<CustomMenuData[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<CustomMenuData | null>(null);

  const loadMenus = async () => {
    try {
      setLoadingMenus(true);
      const res: any = await customMenuService.getAll();
      const list = res?.data?.menus || [];
      const mapped: CustomMenuData[] = list.map((m: any) => ({
        id: m.id,
        name: m.name,
        price: typeof m.price === 'number' ? m.price : (m.price ? Number(m.price) : undefined),
        isVisible: m.is_visible ? Boolean(m.is_visible) : false,
        items: Array.isArray(m.items) ? m.items.map((it: any) => ({ 
          product: { 
            id: it.product_id, 
            name: it.name, 
            category_id: it.category_id, 
            category_name: it.category_name, 
            image_path: it.image_path 
          } 
        })) : [],
      }));
      setMenus(mapped);
    } catch (e) {
      console.error('Error loading menus:', e);
    } finally {
      setLoadingMenus(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

  const handleCreate = () => {
    setEditingMenu(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (menu: CustomMenuData) => {
    setEditingMenu(menu);
    setIsEditorOpen(true);
  };

  const handleSave = async (data: CustomMenuData) => {
    const payload = {
      name: data.name.trim(),
      price: data.price,
      is_visible: data.isVisible,
      items: data.items.map(it => it.product.id),
    };

    if (data.id) {
      await customMenuService.update(Number(data.id), payload);
    } else {
      await customMenuService.create(payload);
    }
    
    await loadMenus();
    setIsEditorOpen(false);
  };

  const handleToggleVisibility = async (menu: CustomMenuData) => {
    const newVisibility = !menu.isVisible;
    
    // Optimistic update
    setMenus(prev => prev.map(m => 
      m.id === menu.id ? { ...m, isVisible: newVisibility } : m
    ));

    try {
      const payload = {
        name: menu.name,
        price: menu.price,
        is_visible: newVisibility,
        items: menu.items.map(it => it.product.id),
      };
      await customMenuService.update(Number(menu.id), payload);
    } catch (e) {
      console.error('Error toggling visibility:', e);
      // Revert on error
      setMenus(prev => prev.map(m => 
        m.id === menu.id ? { ...m, isVisible: menu.isVisible } : m
      ));
      alert('Errore durante l\'aggiornamento della visibilità');
    }
  };

  const handleDeleteConfirmed = async () => {
    if (deleteId == null) return;
    try {
      await customMenuService.delete(Number(deleteId));
      await loadMenus();
    } catch (e) {
      console.error('Error deleting menu:', e);
    } finally {
      setDeleteId(null);
    }
  };

  if (isEditorOpen) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 24 }}>
          {editingMenu ? 'Modifica Menu' : 'Nuovo Menu Personalizzato'}
        </h1>
        <CustomMenuEditor 
          initialData={editingMenu}
          onSave={handleSave}
          onCancel={() => setIsEditorOpen(false)}
        />
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <Title>Menu Personalizzati</Title>
        <Button onClick={handleCreate}>+ Nuovo Menu</Button>
      </PageHeader>

      <Card>
        {loadingMenus ? (
          <EmptyState>Caricamento menu...</EmptyState>
        ) : menus.length === 0 ? (
          <EmptyState>
            Nessun menu personalizzato presente.
            <br />
            <Button variant="secondary" onClick={handleCreate} style={{ marginTop: 16 }}>
              Crea il primo menu
            </Button>
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Nome Menu</th>
                <th>Prezzo</th>
                <th>Portate</th>
                <th>Stato</th>
                <th style={{ textAlign: 'right' }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{m.name}</div>
                  </td>
                  <td>
                    {typeof m.price === 'number' ? `€${m.price.toFixed(2)}` : '-'}
                  </td>
                  <td>{m.items.length} portate</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <SwitchLabel onClick={(e) => e.stopPropagation()}>
                        <SwitchInput 
                          type="checkbox" 
                          checked={m.isVisible} 
                          onChange={() => handleToggleVisibility(m)} 
                        />
                        <SwitchSlider />
                      </SwitchLabel>
                      <span style={{ fontSize: 13, color: m.isVisible ? '#059669' : '#6b7280' }}>
                        {m.isVisible ? 'Visibile' : 'Nascosto'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Button size="small" variant="secondary" onClick={() => handleEdit(m)}>
                        Modifica
                      </Button>
                      <Button size="small" variant="danger" onClick={() => setDeleteId(Number(m.id))}>
                        Elimina
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <ConfirmDialog
        isOpen={deleteId != null}
        title="Elimina menu"
        message="Sei sicuro di voler eliminare definitivamente questo menu?"
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteId(null)}
      />
    </PageContainer>
  );
};

export default CustomMenus;