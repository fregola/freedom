import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { productService, categoryService, allergenService, ingredientService, businessService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = (typeof window !== 'undefined' ? `${window.location.origin}/api` : ((process.env.REACT_APP_API_URL as string | undefined) || '/api'));
interface Product {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  price?: number;
  price_unit?: string;
  category_id?: number;
  category_name?: string;
  image_path?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  allergens?: Allergen[];
  ingredients?: Ingredient[];
}

interface Category {
  id: number;
  name: string;
  parent_id?: number | null;
  parent_name?: string;
  display_name?: string;
}

interface Allergen {
  id: number;
  name: string;
  icon?: string;
}

interface Ingredient {
  id: number;
  name: string;
  name_en?: string;
  icon?: string;
}

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
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

const FiltersRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
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

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
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
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
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

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const InlineFields = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
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

const Select = styled.select`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;


const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  margin-right: 8px;
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 12px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
`;

const PriceDisplay = styled.span`
  font-weight: 600;
  color: #059669;
`;

const AvailabilityBadge = styled.span.withConfig({
  shouldForwardProp: (prop) => !['available'].includes(prop),
})<{ available: boolean }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ available }) => available ? '#d1fae5' : '#fee2e2'};
  color: ${({ available }) => available ? '#065f46' : '#991b1b'};
`;

const EnglishName = styled.div`
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
  margin-top: 2px;
`;



const FileInput = styled.input.attrs({ type: 'file' })`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ImagePreview = styled.div`
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PreviewImage = styled.img`
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #d1d5db;
`;

const RemoveImageButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: #dc2626;
  }
`;

const ProductImage = styled.img`
  width: 60px;
  height: 45px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
`;

const Products: React.FC = () => {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'cook';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [ingredientFilter, setIngredientFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    description: '',
    description_en: '',
    price: '',
    price_unit: '',
    category_id: '',
    is_available: true,
    allergen_ids: [] as number[],
    ingredient_ids: [] as number[]
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImagePath, setCurrentImagePath] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState<string | null>(null);
  const [showMissingFieldsWarning, setShowMissingFieldsWarning] = useState(false);
  const [missingFieldsMessage, setMissingFieldsMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, allergensRes, ingredientsRes] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
        allergenService.getAll(),
        ingredientService.getAll()
      ]);
      
      setProducts(productsRes.data?.products || []);
      
      const allCategories = categoriesRes.data?.categories || [];
      setCategories(allCategories);
      
      setAllergens(allergensRes.data?.allergens || []);
      setIngredients(ingredientsRes.data?.ingredients || []);
    } catch (err) {
      setError('Errore nel caricamento dei dati');
      console.error('Errore nel caricamento:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchTermLower = searchTerm.toLowerCase();

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTermLower) ||
      product.category_name?.toLowerCase().includes(searchTermLower);

    if (!matchesSearch) {
      return false;
    }

    let matchesCategory = true;
    if (categoryFilter !== 'all') {
      const categoryIdNumber = parseInt(categoryFilter, 10);
      const childrenIds = categories
        .filter(c => c.parent_id === categoryIdNumber)
        .map(c => c.id);
      const allowedIds = [categoryIdNumber, ...childrenIds];
      matchesCategory = allowedIds.includes(product.category_id || 0);
    }

    if (!matchesCategory) {
      return false;
    }

    if (subcategoryFilter !== 'all') {
      const subIdNumber = parseInt(subcategoryFilter, 10);
      if ((product.category_id || 0) !== subIdNumber) {
        return false;
      }
    }

    return true;
  });

  const topLevelCategories = categories.filter(c => !c.parent_id);
  const availableSubcategories =
    categoryFilter === 'all'
      ? []
      : categories.filter(c => c.parent_id === parseInt(categoryFilter, 10));

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        name_en: product.name_en || '',
        description: product.description || '',
        description_en: product.description_en || '',
        price: product.price?.toString() || '',
        price_unit: product.price_unit || '',
        category_id: product.category_id?.toString() || '',
        is_available: product.is_available,
        allergen_ids: product.allergens?.map(a => a.id) || [],
        ingredient_ids: product.ingredients?.map(i => i.id) || []
      });
      setCurrentImagePath(product.image_path || null);
      setImagePreview(null);
      setSelectedImage(null);
      setIngredientFilter('');
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        name_en: '',
        description: '',
        description_en: '',
        price: '',
        price_unit: '',
        category_id: '',
        is_available: true,
        allergen_ids: [],
        ingredient_ids: []
      });
      setCurrentImagePath(null);
      setImagePreview(null);
      setSelectedImage(null);
      setIngredientFilter('');
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormError(null);
    setSelectedImage(null);
    setImagePreview(null);
    setCurrentImagePath(null);
  };

  const executeSubmit = async () => {
    try {
      setSubmitting(true);
      setFormError(null);

      // Creo FormData per gestire il file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      
      if (formData.name_en.trim()) {
        formDataToSend.append('name_en', formData.name_en.trim());
      }
      
      if (formData.description && formData.description.trim()) {
        formDataToSend.append('description', formData.description.trim());
      }

      if (formData.description_en && formData.description_en.trim()) {
        formDataToSend.append('description_en', formData.description_en.trim());
      }
      
      if (formData.price) {
        formDataToSend.append('price', formData.price);
      }
      // Invia sempre price_unit: stringa vuota indica rimozione
      formDataToSend.append('price_unit', formData.price_unit || '');
      
      if (formData.category_id) {
        formDataToSend.append('category_id', formData.category_id);
      }
      
      formDataToSend.append('is_available', formData.is_available.toString());
      
      // Aggiungo gli allergeni
      formData.allergen_ids.forEach(id => {
        formDataToSend.append('allergen_ids[]', id.toString());
      });
      
      // Aggiungo gli ingredienti
      formData.ingredient_ids.forEach(id => {
        formDataToSend.append('ingredient_ids[]', id.toString());
      });
      
      // Aggiungo l'immagine se selezionata
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      if (editingProduct) {
        await productService.update(editingProduct.id, formDataToSend);
      } else {
        await productService.create(formDataToSend);
      }

      await fetchData();
      closeModal();
      setShowMissingFieldsWarning(false);
    } catch (err: any) {
      console.error('Errore nel salvataggio:', err);
      setFormError(err.response?.data?.message || 'Errore nel salvataggio del prodotto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setFormError('Il nome è obbligatorio');
      return;
    }

    // Check for missing price or category only for new products (or always? "quando inserisco un nuovo prodotto")
    // User said "when I insert a new product", but it might be useful for edits too.
    // However, to be safe and strictly follow "quando inserisco", I can check if !editingProduct.
    // But usually these checks are good for edits too if the user clears the field.
    // Let's apply it generally but focus on the "empty" state.

    const isPriceMissing = !formData.price || formData.price.trim() === '' || parseFloat(formData.price) === 0;
    const isCategoryMissing = !formData.category_id || formData.category_id === '';

    if (isPriceMissing || isCategoryMissing) {
      const missingParts = [];
      if (isPriceMissing) missingParts.push('prezzo');
      if (isCategoryMissing) missingParts.push('categoria');
      
      const message = `Sei sicuro di voler creare il prodotto senza ${missingParts.join(' e ')}?`;
      setMissingFieldsMessage(message);
      setShowMissingFieldsWarning(true);
      return;
    }

    await executeSubmit();
  };

  const handleDeleteConfirmed = async () => {
    if (deleteId == null) return;
    try {
      await productService.delete(deleteId);
      await fetchData();
      setDeleteId(null);
      setDeleteName(null);
    } catch (err: any) {
      console.error('Errore nell\'eliminazione:', err);
      setError(err.response?.data?.message || 'Errore nell\'eliminazione del prodotto');
      setDeleteId(null);
      setDeleteName(null);
    }
  };

  const handleDownloadQr = async () => {
    try {
      const blob = await businessService.getMenuQr();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'menu-qr.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error('Errore download QR:', e);
      alert('Errore nel generare il QR code');
    }
  };

  const handleAllergenChange = (allergenId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      allergen_ids: checked
        ? [...prev.allergen_ids, allergenId]
        : prev.allergen_ids.filter(id => id !== allergenId)
    }));
  };

  const handleIngredientChange = (ingredientId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      ingredient_ids: checked
        ? [...prev.ingredient_ids, ingredientId]
        : prev.ingredient_ids.filter(id => id !== ingredientId)
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verifica che sia un'immagine
      if (!file.type.startsWith('image/')) {
        setFormError('Seleziona un file immagine valido');
        return;
      }
      
      // Verifica dimensione (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormError('L\'immagine deve essere inferiore a 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Crea preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setCurrentImagePath(null);
    
    // Reset del file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingState>Caricamento prodotti...</LoadingState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <Title>Gestione Prodotti</Title>
        <SearchContainer>
          <Input
            type="text"
            placeholder="Cerca per nome o categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {canEdit && (
            <Button onClick={() => openModal()}>
              Aggiungi Prodotto
            </Button>
          )}
        </SearchContainer>
      </PageHeader>

      <FiltersRow>
        <FormGroup>
          <Label>Categoria</Label>
          <Select
            value={categoryFilter}
            onChange={(e) => {
              const value = e.target.value;
              setCategoryFilter(value);
              setSubcategoryFilter('all');
            }}
          >
            <option value="all">Tutte le categorie</option>
            {topLevelCategories.map(category => (
              <option key={category.id} value={category.id.toString()}>
                {category.name}
              </option>
            ))}
          </Select>
        </FormGroup>
        <FormGroup>
          <Label>Sottocategoria</Label>
          <Select
            value={subcategoryFilter}
            onChange={(e) => setSubcategoryFilter(e.target.value)}
            disabled={categoryFilter === 'all' || availableSubcategories.length === 0}
          >
            <option value="all">Tutte le sottocategorie</option>
            {availableSubcategories.map(sub => (
              <option key={sub.id} value={sub.id.toString()}>
                {sub.name}
              </option>
            ))}
          </Select>
        </FormGroup>
      </FiltersRow>

      {user?.role === 'admin' && (
        <div style={{ marginBottom: 16 }}>
          <Button variant="secondary" onClick={handleDownloadQr}>QR code</Button>
        </div>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Card>
        {filteredProducts.length === 0 ? (
          <EmptyState>
            {searchTerm ? 'Nessun prodotto trovato per la ricerca.' : 'Nessun prodotto presente. Aggiungi il primo prodotto!'}
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Immagine</TableHeaderCell>
                <TableHeaderCell>Nome</TableHeaderCell>
                <TableHeaderCell>Categoria</TableHeaderCell>
                <TableHeaderCell>Prezzo</TableHeaderCell>
                <TableHeaderCell>Disponibilità</TableHeaderCell>
                <TableHeaderCell>Azioni</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <tbody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image_path ? (
                      <ProductImage 
                        src={`${API_BASE_URL}${product.image_path}`}
                        alt={product.name}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div style={{ 
                        width: '60px', 
                        height: '45px', 
                        backgroundColor: '#f3f4f6', 
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#9ca3af'
                      }}>
                        No img
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <strong>{product.name}</strong>
                      {product.name_en && (
                        <EnglishName>{product.name_en}</EnglishName>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.category_name || '-'}
                  </TableCell>
                  <TableCell>
                    {product.price ? (
                      <PriceDisplay>
                        €{product.price.toFixed(2)}{product.price_unit ? ` / ${product.price_unit}` : ''}
                      </PriceDisplay>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <AvailabilityBadge available={product.is_available}>
                      {product.is_available ? 'Disponibile' : 'Non disponibile'}
                    </AvailabilityBadge>
                  </TableCell>
                  <TableCell>
                    {canEdit && (
                      <ActionButtons>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => openModal(product)}
                        >
                          Modifica
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => {
                            setDeleteId(product.id);
                            setDeleteName(product.name);
                          }}
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
              {editingProduct ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
            </ModalTitle>
            <CloseButton onClick={closeModal}>&times;</CloseButton>
          </ModalHeader>

          {formError && <ErrorMessage>{formError}</ErrorMessage>}

          <Form onSubmit={handleSubmit}>
            <FormRow>
              <FormGroup>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome del prodotto"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="name_en">Nome (Inglese)</Label>
                <Input
                  id="name_en"
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="Nome in inglese (opzionale)"
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label htmlFor="description">Descrizione</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrizione del prodotto (opzionale)"
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="description_en">Descrizione (Inglese)</Label>
                <textarea
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  placeholder="Descrizione in inglese (opzionale)"
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label htmlFor="category_id">Categoria</Label>
                <Select
                  id="category_id"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                    <option value="">Seleziona categoria</option>
                    {categories
                      .slice()
                      .sort((a, b) => {
                        const nameA = a.parent_name ? `${a.parent_name} -- ${a.name}` : a.name;
                        const nameB = b.parent_name ? `${b.parent_name} -- ${b.name}` : b.name;
                        return nameA.localeCompare(nameB, 'it', { sensitivity: 'base' });
                      })
                      .map(category => (
                      <option key={category.id} value={category.id}>
                      {category.parent_name ? `${category.parent_name} -- ${category.name}` : category.name}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="price">Prezzo (€)</Label>
                <InlineFields>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    style={{
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                  <Select
                    id="price_unit"
                    value={formData.price_unit}
                    onChange={(e) => setFormData({ ...formData, price_unit: e.target.value })}
                    style={{ width: '140px' }}
                  >
                    <option value="">Nessuna unità</option>
                    <option value="g">g (grammo)</option>
                    <option value="hg">hg (etto)</option>
                    <option value="l">l (litro)</option>
                  </Select>
                </InlineFields>
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label htmlFor="image">Immagine prodotto</Label>
              <FileInput
                id="image"
                accept="image/*"
                onChange={handleImageSelect}
              />
              
              {(imagePreview || currentImagePath) && (
                <ImagePreview>
                  <PreviewImage 
                    src={imagePreview || `${API_BASE_URL}${currentImagePath}`}
                    alt="Anteprima immagine" 
                  />
                  <RemoveImageButton 
                    type="button" 
                    onClick={handleRemoveImage}
                  >
                    Rimuovi
                  </RemoveImageButton>
                </ImagePreview>
              )}
            </FormGroup>

            <FormGroup>
              <Label>Ingredienti</Label>
              <div style={{ marginBottom: '8px' }}>
                <Input
                  type="text"
                  placeholder="Cerca ingrediente..."
                  value={ingredientFilter}
                  onChange={(e) => setIngredientFilter(e.target.value)}
                />
              </div>
              <CheckboxGroup>
                {ingredients
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name, 'it', { sensitivity: 'base' }))
                  .filter(ingredient => {
                    if (!ingredientFilter.trim()) return true;
                    const search = ingredientFilter.toLowerCase();
                    const nameIt = ingredient.name.toLowerCase();
                    const nameEn = (ingredient.name_en || '').toLowerCase();
                    return nameIt.includes(search) || nameEn.includes(search);
                  })
                  .map(ingredient => (
                  <CheckboxLabel key={ingredient.id}>
                    <Checkbox
                      checked={formData.ingredient_ids.includes(ingredient.id)}
                      onChange={(e) => handleIngredientChange(ingredient.id, e.target.checked)}
                    />
                    {ingredient.icon} {ingredient.name}
                  </CheckboxLabel>
                ))}
              </CheckboxGroup>
            </FormGroup>

            <FormGroup>
              <Label>Allergeni</Label>
              <CheckboxGroup>
                {allergens
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name, 'it', { sensitivity: 'base' }))
                  .map(allergen => (
                  <CheckboxLabel key={allergen.id}>
                    <Checkbox
                      checked={formData.allergen_ids.includes(allergen.id)}
                      onChange={(e) => handleAllergenChange(allergen.id, e.target.checked)}
                    />
                    {allergen.icon} {allergen.name}
                  </CheckboxLabel>
                ))}
              </CheckboxGroup>
            </FormGroup>

            <FormGroup>
              <CheckboxLabel>
                <Checkbox
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                />
                Prodotto disponibile
              </CheckboxLabel>
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
                disabled={submitting}
              >
                {submitting ? 'Salvataggio...' : (editingProduct ? 'Aggiorna' : 'Crea')}
              </Button>
            </FormActions>
          </Form>
        </ModalContent>
      </Modal>
      <ConfirmDialog
        isOpen={deleteId != null}
        title="Elimina prodotto"
        message={
          deleteName
            ? `Sei sicuro di voler eliminare il prodotto "${deleteName}"?`
            : 'Sei sicuro di voler eliminare questo prodotto?'
        }
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => {
          setDeleteId(null);
          setDeleteName(null);
        }}
      />
      <ConfirmDialog
        isOpen={showMissingFieldsWarning}
        title="Conferma creazione"
        message={missingFieldsMessage}
        confirmLabel="Crea comunque"
        cancelLabel="Annulla"
        onConfirm={executeSubmit}
        onCancel={() => setShowMissingFieldsWarning(false)}
      />
    </PageContainer>
  );
};

export default Products;
