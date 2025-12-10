import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Button from '../components/common/Button';
import { qrCodeService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const QrContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const QrCard = styled.div`
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

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

const SuccessMessage = styled.div`
  background-color: #d1fae5;
  color: #065f46;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
`;

const ErrorMessage = styled.div`
  background-color: #fee2e2;
  color: #991b1b;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
`;

const QrList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
`;

const QrItem = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #f9fafb;
`;

const QrItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const QrName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const QrUrl = styled.a`
  font-size: 13px;
  color: #6b7280;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  max-width: 100%;
  
  &:hover {
    text-decoration: underline;
    color: #3b82f6;
  }
`;

const QrImageContainer = styled.div`
  display: flex;
  justify-content: center;
  background: white;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
`;

const QrImage = styled.img`
  width: 150px;
  height: 150px;
`;

const QrActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: auto;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

interface QrCode {
  id: number;
  uuid: string;
  name: string;
  destination_url: string;
  created_at: string;
}

const QrCodeManager: React.FC = () => {
  const { user } = useAuth();
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQr, setEditingQr] = useState<QrCode | null>(null);
  const [formData, setFormData] = useState({ name: '', destination_url: '' });
  const [qrImages, setQrImages] = useState<Record<string, string>>({});

  const apiOrigin = typeof window !== 'undefined' ? window.location.origin : ((process.env.REACT_APP_API_URL as string | undefined) || '');

  useEffect(() => {
    loadQrCodes();
  }, []);

  const loadQrCodes = async () => {
    try {
      setLoading(true);
      const data = await qrCodeService.getAll();
      const codes = data.data?.codes || [];
      setQrCodes(codes);
      
      // Carica immagini per ogni QR
      if (Array.isArray(codes)) {
        codes.forEach((code: QrCode) => loadQrImage(code.uuid));
      }
    } catch (error) {
      console.error('Errore caricamento QR codes:', error);
      setMessage({ type: 'error', text: 'Errore caricamento lista QR' });
    } finally {
      setLoading(false);
    }
  };

  const loadQrImage = async (uuid: string) => {
    try {
      const blob = await qrCodeService.getImage(uuid);
      const url = URL.createObjectURL(blob);
      setQrImages(prev => ({ ...prev, [uuid]: url }));
    } catch (error) {
      console.error(`Errore caricamento immagine QR ${uuid}:`, error);
    }
  };

  const handleOpenModal = (qr?: QrCode) => {
    if (qr) {
      setEditingQr(qr);
      setFormData({ name: qr.name, destination_url: qr.destination_url });
    } else {
      setEditingQr(null);
      setFormData({ name: '', destination_url: '' });
    }
    setIsModalOpen(true);
    setMessage(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQr(null);
    setFormData({ name: '', destination_url: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQr) {
        await qrCodeService.update(editingQr.id, formData);
        setMessage({ type: 'success', text: 'QR Code aggiornato con successo' });
      } else {
        await qrCodeService.create(formData);
        setMessage({ type: 'success', text: 'QR Code creato con successo' });
      }
      handleCloseModal();
      loadQrCodes();
    } catch (error) {
      console.error('Errore salvataggio QR:', error);
      setMessage({ type: 'error', text: 'Errore durante il salvataggio' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo QR Code?')) return;
    try {
      await qrCodeService.delete(id);
      setMessage({ type: 'success', text: 'QR Code eliminato' });
      loadQrCodes();
    } catch (error) {
      console.error('Errore eliminazione QR:', error);
      setMessage({ type: 'error', text: 'Errore durante l\'eliminazione' });
    }
  };

  const handleDownload = (uuid: string, name: string) => {
    const url = qrImages[uuid];
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${name}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <QrContainer>
        <QrCard>
          <Title>Accesso Negato</Title>
          <Subtitle>Solo gli amministratori possono gestire il QR Code.</Subtitle>
        </QrCard>
      </QrContainer>
    );
  }

  return (
    <QrContainer>
      <QrCard>
        <Title>Gestione Menu QR</Title>
        <Subtitle>
          Gestisci i tuoi QR Code dinamici. Puoi creare più QR code per scopi diversi (es. Tavoli Esterni, Instagram, Menu Speciale) e cambiarne la destinazione in qualsiasi momento.
        </Subtitle>

        {message && (
          message.type === 'success' ? (
            <SuccessMessage>{message.text}</SuccessMessage>
          ) : (
            <ErrorMessage>{message.text}</ErrorMessage>
          )
        )}

        <Section>
          <SectionTitle>
            I tuoi QR Code
            <Button onClick={() => handleOpenModal()} size="small" variant="primary">
              + Nuovo QR Code
            </Button>
          </SectionTitle>

          {loading && <p>Caricamento...</p>}

          {!loading && qrCodes.length === 0 && (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
              Non hai ancora creato nessun QR Code. Clicca su "Nuovo QR Code" per iniziare.
            </p>
          )}

          <QrList>
            {qrCodes.map(qr => (
              <QrItem key={qr.id}>
                <QrItemHeader>
                  <div>
                    <QrName>{qr.name}</QrName>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                      Punta a: {apiOrigin}/api/qr-redirect/{qr.uuid.substring(0, 8)}...
                    </div>
                  </div>
                </QrItemHeader>
                
                <QrImageContainer>
                  {qrImages[qr.uuid] ? (
                    <QrImage src={qrImages[qr.uuid]} alt={`QR ${qr.name}`} />
                  ) : (
                    <div style={{ width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>
                  )}
                </QrImageContainer>

                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  <strong>Destinazione:</strong>
                  <QrUrl href={qr.destination_url} target="_blank" rel="noopener noreferrer">
                    {qr.destination_url}
                  </QrUrl>
                </div>

                <QrActions>
                  <Button size="small" variant="secondary" onClick={() => handleOpenModal(qr)} style={{ flex: 1 }}>
                    Modifica
                  </Button>
                  <Button size="small" variant="secondary" onClick={() => handleDownload(qr.uuid, qr.name)} title="Scarica PNG">
                    ⬇️
                  </Button>
                  <Button size="small" variant="danger" onClick={() => handleDelete(qr.id)} title="Elimina">
                    🗑️
                  </Button>
                </QrActions>
              </QrItem>
            ))}
          </QrList>
        </Section>
      </QrCard>

      {isModalOpen && (
        <Modal onClick={handleCloseModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <SectionTitle>
              {editingQr ? 'Modifica QR Code' : 'Nuovo QR Code'}
            </SectionTitle>
            <form onSubmit={handleSubmit}>
              <FormGroup style={{ marginBottom: '16px' }}>
                <Label htmlFor="name">Nome (es. Menu Principale, Tavolo 1)</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Nome identificativo"
                />
              </FormGroup>
              <FormGroup style={{ marginBottom: '24px' }}>
                <Label htmlFor="url">URL di Destinazione</Label>
                <Input
                  id="url"
                  type="text"
                  value={formData.destination_url}
                  onChange={e => setFormData({ ...formData, destination_url: e.target.value })}
                  required
                  placeholder="https://..."
                />
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Dove vuoi che porti questo QR Code?
                </div>
              </FormGroup>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" onClick={handleCloseModal}>
                  Annulla
                </Button>
                <Button type="submit" variant="primary">
                  {editingQr ? 'Salva Modifiche' : 'Crea QR Code'}
                </Button>
              </div>
            </form>
          </ModalContent>
        </Modal>
      )}
    </QrContainer>
  );
};

export default QrCodeManager;
