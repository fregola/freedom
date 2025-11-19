import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { categoryService } from '../services/api';
import { useAutoTranslate } from '../hooks/useAutoTranslate';
import { useAuth } from '../contexts/AuthContext';

interface Category {
  id: number;
  name: string;
  description: string;
  name_en?: string;
  description_en?: string;
  parent_id: number | null;
  parent_name: string | null;
  is_active: boolean;
  sort_order?: number;
  created_at: string;
  updated_at: string;
}

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 32px;
  gap: 16px;
  
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  flex: 1;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;
  max-width: 400px;
  
  @media (max-width: 767px) {
    max-width: none;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f9fafb;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;
  
  &:hover {
    background: #f9fafb;
  }
`;

const TableHeaderCell = styled.th`
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
`;

const TableCell = styled.td`
  padding: 16px;
  color: #6b7280;
  font-size: 14px;
`;

const CategoryName = styled.div<{ level: number }>`
  padding-left: ${({ level }) => level * 20}px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: ${({ level }) => level > 0 ? '"└─"' : '""'};
    color: #9ca3af;
    font-family: monospace;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const StatusBadge = styled.span.withConfig({
  shouldForwardProp: (prop) => !['isActive'].includes(prop),
})<{ isActive: boolean }>`
  background: ${({ isActive }) => isActive ? '#dcfce7' : '#fef2f2'};
  color: ${({ isActive }) => isActive ? '#166534' : '#dc2626'};
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const Modal = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isOpen'].includes(prop),
})<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  
  &:hover {
    color: #374151;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  background-color: white;
  color: #374151;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Checkbox = styled.input`
  margin: 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const Categories: React.FC = () => {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'cook';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    name_en: '',
    description_en: '',
    parent_id: '',
    is_active: true,
    sort_order: '0'
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [submitting, setSubmitting] = useState(false);

  // Hook per la traduzione automatica del nome
  const { translatedText: translatedName } = useAutoTranslate(
    formData.name, 
    formData.name_en
  );

  // Hook per la traduzione automatica della descrizione
  const { translatedText: translatedDescription } = useAutoTranslate(
    formData.description, 
    formData.description_en
  );

  // Aggiorna automaticamente i campi inglesi se vuoti e c'è una traduzione
  useEffect(() => {
    if (translatedName && !formData.name_en.trim()) {
      setFormData(prev => ({ ...prev, name_en: translatedName }));
    }
  }, [translatedName, formData.name_en]);

  useEffect(() => {
    if (translatedDescription && !formData.description_en.trim()) {
      setFormData(prev => ({ ...prev, description_en: translatedDescription }));
    }
  }, [translatedDescription, formData.description_en]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.getAll();
      setCategories(response.data.categories || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore nel caricamento delle categorie');
    } finally {
      setLoading(false);
    }
  };

  // Organizza le categorie in una struttura gerarchica per la visualizzazione
  const organizeCategories = (categories: Category[]): (Category & { level: number })[] => {
    if (!Array.isArray(categories)) return [];
    
    const categoryMap = new Map<number, Category>();
    const rootCategories: Category[] = [];
    const childCategories: Category[] = [];

    // Separa categorie root e figlie
    categories.forEach(category => {
      categoryMap.set(category.id, category);
      if (category.parent_id === null) {
        rootCategories.push(category);
      } else {
        childCategories.push(category);
      }
    });

    // Ordina le root per sort_order (fallback su nome)
    rootCategories.sort((a, b) => {
      const ao = a.sort_order ?? 0;
      const bo = b.sort_order ?? 0;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
    childCategories.sort((a, b) => a.name.localeCompare(b.name));

    const result: (Category & { level: number })[] = [];

    const addCategoryWithChildren = (category: Category, level: number) => {
      result.push({ ...category, level });
      
      // Aggiungi le categorie figlie
      const children = childCategories.filter(child => child.parent_id === category.id);
      children.forEach(child => addCategoryWithChildren(child, level + 1));
    };

    // Aggiungi tutte le categorie root con i loro figli
    rootCategories.forEach(category => addCategoryWithChildren(category, 0));

    return result;
  };

  const organizedCategories = organizeCategories(categories);
  
  const filteredCategories = organizedCategories.filter(category =>
    (category.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.name_en || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description_en || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.parent_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ 
      name: '', 
      description: '', 
      name_en: '',
      description_en: '',
      parent_id: '', 
      is_active: true,
      sort_order: '0'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      name_en: category.name_en || '',
      description_en: category.description_en || '',
      parent_id: category.parent_id?.toString() || '',
      is_active: category.is_active,
      sort_order: (category.sort_order ?? 0).toString()
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ 
      name: '', 
      description: '', 
      name_en: '',
      description_en: '',
      parent_id: '', 
      is_active: true,
      sort_order: '0'
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Il nome è obbligatorio';
    }

    // Verifica che non si stia creando una dipendenza circolare
    if (editingCategory && parseInt(formData.parent_id) === editingCategory.id) {
      errors.parent_id = 'Una categoria non può essere genitore di se stessa';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      // Debug: log dei dati che stiamo per inviare
      console.log('=== DEBUG FRONTEND CATEGORY SUBMISSION ===');
      console.log('formData:', JSON.stringify(formData, null, 2));
      
      // Prepara i dati nel formato corretto per il backend
      const dataToSend = {
        name: formData.name.trim(),
        description: formData.description,
        description_en: formData.description_en,
        name_en: formData.name_en.trim(),
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
        is_active: formData.is_active,
        sort_order: Number.isNaN(parseInt(formData.sort_order)) ? 0 : parseInt(formData.sort_order)
      };
      
      console.log('dataToSend:', JSON.stringify(dataToSend, null, 2));
      console.log('==========================================');
      
      if (editingCategory) {
        await categoryService.update(editingCategory.id, dataToSend);
      } else {
        await categoryService.create(dataToSend);
      }
      
      await fetchCategories();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore nel salvataggio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    // Verifica se la categoria ha figli
    const hasChildren = categories.some(cat => cat.parent_id === id);
    
    if (hasChildren) {
      setError('Impossibile eliminare una categoria che ha sottocategorie. Elimina prima le sottocategorie.');
      return;
    }
    
    if (!window.confirm('Sei sicuro di voler eliminare questa categoria?')) {
      return;
    }
    
    try {
      await categoryService.delete(id);
      await fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore nell\'eliminazione');
    }
  };

  // Ottieni le categorie disponibili come genitori (escludendo quella corrente e i suoi discendenti)
  const getAvailableParents = (): Category[] => {
    if (!editingCategory) {
      return categories.filter(cat => cat.parent_id === null); // Solo categorie root per nuove categorie
    }
    
    // Per le modifiche, escludi la categoria stessa e i suoi discendenti
    const getDescendants = (categoryId: number): number[] => {
      const descendants: number[] = [];
      const children = categories.filter(cat => cat.parent_id === categoryId);
      children.forEach(child => {
        descendants.push(child.id);
        descendants.push(...getDescendants(child.id));
      });
      return descendants;
    };
    
    const excludeIds = [editingCategory.id, ...getDescendants(editingCategory.id)];
    return categories.filter(cat => !excludeIds.includes(cat.id));
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingState>Caricamento categorie...</LoadingState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <Title>Gestione Categorie</Title>
        <SearchContainer>
          <Input
            placeholder="Cerca categorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
          />
          {canEdit && (
            <Button onClick={openCreateModal}>
              Nuova Categoria
            </Button>
          )}
        </SearchContainer>
      </PageHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Card>
        {filteredCategories.length === 0 ? (
          <EmptyState>
            {searchTerm ? 'Nessuna categoria trovata' : 'Nessuna categoria presente'}
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Nome</TableHeaderCell>
                <TableHeaderCell>Descrizione</TableHeaderCell>
                <TableHeaderCell>Categoria</TableHeaderCell>
                <TableHeaderCell>Stato</TableHeaderCell>
                <TableHeaderCell>Azioni</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <tbody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <CategoryName level={category.level}>
                      <strong>{category.name}</strong>
                      {category.name_en && category.name_en !== category.name && (
                        <span style={{ color: '#6b7280', fontWeight: 'normal', marginLeft: '8px' }}>
                          ({category.name_en})
                        </span>
                      )}
                    </CategoryName>
                  </TableCell>
                  <TableCell>
                    {category.description}
                    {category.description_en && category.description_en !== category.description && (
                      <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                        EN: {category.description_en}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {category.parent_name || (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                        Categoria principale
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge isActive={category.is_active}>
                      {category.is_active ? 'Attiva' : 'Inattiva'}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    {canEdit ? (
                      <ActionButtons>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => openEditModal(category)}
                        >
                          Modifica
                        </Button>
                        <Button
                          size="small"
                          variant="danger"
                          onClick={() => handleDelete(category.id)}
                        >
                          Elimina
                        </Button>
                      </ActionButtons>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: 12 }}>Solo admin</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal isOpen={isModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>
              {editingCategory ? 'Modifica Categoria' : 'Nuova Categoria'}
            </ModalTitle>
            <CloseButton onClick={closeModal}>×</CloseButton>
          </ModalHeader>
          
          <Form onSubmit={handleSubmit}>
            <Input
              label="Nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              required
              fullWidth
            />
            
            <Input
              label="Nome (Inglese)"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              placeholder="Lascia vuoto per traduzione automatica"
              fullWidth
            />
            
            <Input
              label="Descrizione"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              error={formErrors.description}
              fullWidth
            />
            
            <Input
              label="Descrizione (Inglese)"
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              placeholder="Lascia vuoto per traduzione automatica"
              fullWidth
            />
            
            <FormGroup>
              <Label>Categoria Genitore</Label>
              <Select
                value={formData.parent_id}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  parent_id: e.target.value 
                })}
              >
                <option value="">Categoria principale</option>
                {getAvailableParents().map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              {formErrors.parent_id && (
                <span style={{ color: '#dc2626', fontSize: '13px' }}>
                  {formErrors.parent_id}
                </span>
              )}
            </FormGroup>

            <Input
              label="Ordine"
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
              placeholder="Imposta l'ordine delle categorie principali"
              fullWidth
            />
            
            <FormGroup>
              <CheckboxContainer>
                <Checkbox
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    is_active: e.target.checked 
                  })}
                />
                <Label htmlFor="is_active">Categoria attiva</Label>
              </CheckboxContainer>
            </FormGroup>
            
            <FormActions>
              <Button
                type="button"
                variant="secondary"
                onClick={closeModal}
                disabled={submitting}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                loading={submitting}
                disabled={submitting}
              >
                {editingCategory ? 'Aggiorna' : 'Crea'}
              </Button>
            </FormActions>
          </Form>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
};
export default Categories;
