import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { ingredientService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useAutoTranslate } from '../hooks/useAutoTranslate';

interface Ingredient {
  id: number;
  name: string;
  name_en?: string;
  icon?: string;
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
  width: 100%;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
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
  &:nth-child(2) { width: 80px; }
  &:nth-child(3) { width: 220px; }
`;

const TableCell = styled.td`
  padding: 16px;
  color: #6b7280;
  font-size: 14px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-start;
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

// Componenti per la gestione delle icone
const DefaultIcon = styled.span`
  font-size: 16px;
`;

const IconDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const IconText = styled.span`
  font-size: 14px;
  color: #6b7280;
`;

const EnglishName = styled.div`
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
  margin-top: 2px;
`;

const Ingredients: React.FC = () => {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'cook';
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    icon: ''
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [submitting, setSubmitting] = useState(false);

  // Hook per la traduzione automatica del nome
  const { translatedText: translatedName } = useAutoTranslate(
    formData.name, 
    formData.name_en
  );

  // Aggiorna automaticamente il campo inglese se vuoto e c'è una traduzione
  useEffect(() => {
    if (translatedName && !formData.name_en.trim()) {
      setFormData(prev => ({ ...prev, name_en: translatedName }));
    }
  }, [translatedName, formData.name_en]);

  // Funzione per renderizzare le icone
  const renderIcon = (icon?: string) => {
    if (!icon) {
      return <DefaultIcon>🥄</DefaultIcon>; // Icona di default per ingredienti
    }
    
    // Se è un URL di immagine
    if (icon.startsWith('http') || icon.startsWith('/')) {
      return <img src={icon} alt="Icon" style={{ width: '16px', height: '16px' }} />;
    }
    
    // Se è un emoji o testo
    return <DefaultIcon>{icon}</DefaultIcon>;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const ingredientsResponse = await ingredientService.getAll();
      setIngredients(ingredientsResponse.data.ingredients || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const filteredIngredients = Array.isArray(ingredients) ? ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const openCreateModal = () => {
    setEditingIngredient(null);
    setFormData({ name: '', name_en: '', icon: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      name_en: ingredient.name_en || '',
      icon: ingredient.icon || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIngredient(null);
    setFormData({ name: '', name_en: '', icon: '' });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: any = {};
    if (!formData.name.trim()) {
      errors.name = 'Il nome è obbligatorio';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      const submitData = {
        name: formData.name,
        ...(formData.name_en.trim() && { name_en: formData.name_en.trim() }),
        ...(formData.icon.trim() && { icon: formData.icon.trim() })
      };
      
      if (editingIngredient) {
        await ingredientService.update(editingIngredient.id, submitData);
      } else {
        await ingredientService.create(submitData);
      }
      
      await fetchData();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore nel salvataggio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo ingrediente?')) {
      return;
    }
    
    try {
      await ingredientService.delete(id);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore nell\'eliminazione');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingState>Caricamento ingredienti...</LoadingState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <Title>Gestione Ingredienti</Title>
        <SearchContainer>
          <Input
            placeholder="Cerca ingredienti..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
          />
          {canEdit && (
            <Button onClick={openCreateModal}>
              Nuovo Ingrediente
            </Button>
          )}
        </SearchContainer>
      </PageHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Card>
        {filteredIngredients.length === 0 ? (
          <EmptyState>
            {searchTerm ? 'Nessun ingrediente trovato' : 'Nessun ingrediente presente'}
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Nome</TableHeaderCell>
                <TableHeaderCell>Icona</TableHeaderCell>
                <TableHeaderCell>Azioni</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <tbody>
              {filteredIngredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell>
                    <strong>{ingredient.name}</strong>
                    {ingredient.name_en && (
                      <EnglishName>{ingredient.name_en}</EnglishName>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconDisplay>
                      {renderIcon(ingredient.icon)}
                    </IconDisplay>
                  </TableCell>
                  <TableCell>
                    {canEdit && (
                      <ActionButtons>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => openEditModal(ingredient)}
                        >
                          Modifica
                        </Button>
                        <Button
                          size="small"
                          variant="danger"
                          onClick={() => handleDelete(ingredient.id)}
                        >
                          Elimina
                        </Button>
                      </ActionButtons>
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
              {editingIngredient ? 'Modifica Ingrediente' : 'Nuovo Ingrediente'}
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
              placeholder="Traduzione automatica disponibile"
              fullWidth
            />
            
            <Input
              label="Icona"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="Lascia vuoto per usare l'icona di default (🥄)"
              fullWidth
            />
            
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
                {editingIngredient ? 'Aggiorna' : 'Crea'}
              </Button>
            </FormActions>
          </Form>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
};

export default Ingredients;
