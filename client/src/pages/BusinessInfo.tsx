import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Button from '../components/common/Button';
import { businessService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const BusinessContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const BusinessCard = styled.div`
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 32px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease-in-out;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.2s ease-in-out;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const SuccessMessage = styled.div`
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const LogoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const LogoPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
`;

const LogoImage = styled.img`
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 8px;
  background: white;
  border: 1px solid #e5e7eb;
`;

const LogoPlaceholder = styled.div`
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #6b7280;
  font-size: 12px;
  text-align: center;
`;

const FileInput = styled.input`
  display: none;
`;

const FileInputLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: #e5e7eb;
    border-color: #9ca3af;
  }
`;

interface BusinessData {
  name: string;
  description: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  vat_number: string;
  website: string;
  instagram: string;
  facebook: string;
  google_business: string;
  whatsapp: string;
  logo_path?: string;
}

const BusinessInfo: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<BusinessData>({
    name: '',
    description: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    email: '',
    vat_number: '',
    website: '',
    instagram: '',
    facebook: '',
    google_business: '',
    whatsapp: '',
    logo_path: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const shareMenuUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu` : '/menu';
  const apiOrigin = typeof window !== 'undefined' ? window.location.origin : ((process.env.REACT_APP_API_URL as string | undefined) || '');

  useEffect(() => {
    // Carica i dati esistenti dell'attività
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      const data = await businessService.get();
      setFormData({
        name: data.name || '',
        description: data.description || '',
        address: data.address || '',
        city: data.city || '',
        postal_code: data.postal_code || '',
        phone: data.phone || '',
        email: data.email || '',
        vat_number: data.vat_number || '',
        website: data.website || '',
        instagram: data.instagram || '',
        facebook: data.facebook || '',
        google_business: data.google_business || '',
        whatsapp: data.whatsapp || '',
        logo_path: data.logo_path || '',
      });
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
      setMessage({ type: 'error', text: 'Errore nel caricamento dei dati dell\'attività.' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await businessService.update(formData);
      setMessage({ type: 'success', text: 'Dati dell\'attività salvati con successo!' });
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      setMessage({ type: 'error', text: 'Errore nel salvataggio dei dati. Riprova.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    fetchBusinessData();
    setMessage(null);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validazione del file
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Seleziona un file immagine valido' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setMessage({ type: 'error', text: 'Il file è troppo grande. Massimo 5MB' });
      return;
    }

    setLogoUploading(true);
    setMessage(null);

    try {
      const result = await businessService.uploadLogo(file);
      setFormData(prev => ({ ...prev, logo_path: result.logo_path }));
      setMessage({ type: 'success', text: 'Logo caricato con successo!' });
    } catch (error) {
      console.error('Errore nel caricamento del logo:', error);
      setMessage({ type: 'error', text: 'Errore nel caricamento del logo. Riprova.' });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleGenerateQr = async () => {
    setQrLoading(true);
    setMessage(null);
    try {
      const blob = await businessService.getMenuQr();
      const objectUrl = URL.createObjectURL(blob);
      // Pulisci eventuale URL precedente
      if (qrPreviewUrl) {
        try { URL.revokeObjectURL(qrPreviewUrl); } catch {}
      }
      setQrPreviewUrl(objectUrl);
    } catch (error) {
      console.error('Errore generazione QR:', error);
      setMessage({ type: 'error', text: 'Errore nella generazione del QR code.' });
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <BusinessContainer>
      <BusinessCard>
        <Title>Informazioni Attività</Title>
        <Subtitle>
          Gestisci le informazioni della tua attività commerciale
        </Subtitle>

        {message && (
          message.type === 'success' ? (
            <SuccessMessage>{message.text}</SuccessMessage>
          ) : (
            <ErrorMessage>{message.text}</ErrorMessage>
          )
        )}

        <Form onSubmit={handleSubmit}>
          <Section>
            <SectionTitle>📋 Informazioni Generali</SectionTitle>
            <FormGroup>
              <Label htmlFor="name">Nome Attività *</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="description">Descrizione</Label>
              <TextArea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descrivi la tua attività..."
              />
            </FormGroup>
          </Section>

          <Section>
            <SectionTitle>🖼️ Logo Attività</SectionTitle>
            <LogoSection>
              <LogoPreview>
                {formData.logo_path ? (
                  (() => {
                    const rawPath = formData.logo_path || '';
                    const normalizedPath = rawPath.startsWith('/uploads/')
                      ? rawPath.replace(/^\/uploads\//, '/api/uploads/')
                      : rawPath;
                    const fullUrl = normalizedPath.startsWith('http')
                      ? normalizedPath
                      : `${apiOrigin}${normalizedPath}`;
                    return (
                      <LogoImage 
                        src={fullUrl}
                        alt="Logo attività" 
                      />
                    );
                  })()
                ) : (
                  <LogoPlaceholder>
                    Nessun logo
                  </LogoPlaceholder>
                )}
                <div>
                  <FileInputLabel htmlFor="logo-upload">
                    {logoUploading ? 'Caricamento...' : '📁 Scegli Logo'}
                  </FileInputLabel>
                  <FileInput
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={logoUploading}
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Formati supportati: JPG, PNG, SVG (max 5MB)
                  </div>
                </div>
              </LogoPreview>
            </LogoSection>
          </Section>

          <Section>
            <SectionTitle>📍 Indirizzo</SectionTitle>
            <FormGroup>
              <Label htmlFor="address">Indirizzo</Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </FormGroup>
            <FormRow>
              <FormGroup>
                <Label htmlFor="city">Città</Label>
                <Input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="postal_code">CAP</Label>
                <Input
                  type="text"
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                />
              </FormGroup>
            </FormRow>
          </Section>

          {user?.role === 'admin' && (
            <Section>
              <SectionTitle>🔗 Distribuzione Menu via QR</SectionTitle>
              <Subtitle style={{ marginBottom: 0 }}>URL pubblico del menu: <a href={shareMenuUrl} target="_blank" rel="noreferrer">{shareMenuUrl}</a></Subtitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Button type="button" variant="primary" onClick={handleGenerateQr} disabled={qrLoading}>
                  {qrLoading ? 'Generazione...' : 'Genera QR Code'}
                </Button>
                {qrPreviewUrl && (
                  <a href={qrPreviewUrl} download="menu-qr.png" style={{ textDecoration: 'none' }}>
                    <Button type="button" variant="secondary">Scarica PNG</Button>
                  </a>
                )}
              </div>
              {qrPreviewUrl && (
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                  <img src={qrPreviewUrl} alt="QR Code del menu" style={{ width: 256, height: 256, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                </div>
              )}
            </Section>
          )}

          <Section>
            <SectionTitle>📞 Contatti</SectionTitle>
            <FormRow>
              <FormGroup>
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label htmlFor="vat_number">Partita IVA</Label>
                <Input
                  type="text"
                  id="vat_number"
                  name="vat_number"
                  value={formData.vat_number}
                  onChange={handleInputChange}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="website">Sito Web</Label>
                <Input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </FormGroup>
            </FormRow>
          </Section>

          <Section>
            <SectionTitle>📱 Social Media</SectionTitle>
            <FormGroup>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                type="text"
                id="instagram"
                name="instagram"
                value={formData.instagram}
                onChange={handleInputChange}
                placeholder="@nomeutente o URL completo"
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                type="text"
                id="facebook"
                name="facebook"
                value={formData.facebook}
                onChange={handleInputChange}
                placeholder="Nome pagina o URL completo"
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                type="text"
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                placeholder="+39 123 456 7890 o numero completo"
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="google_business">Google Business</Label>
              <Input
                type="text"
                id="google_business"
                name="google_business"
                value={formData.google_business}
                onChange={handleInputChange}
                placeholder="URL Google Business Profile"
              />
            </FormGroup>
          </Section>

          <ButtonGroup>
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={loading}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Salvataggio...' : 'Salva Informazioni'}
            </Button>
          </ButtonGroup>
        </Form>
      </BusinessCard>
    </BusinessContainer>
  );
};

export default BusinessInfo;