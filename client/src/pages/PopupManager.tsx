import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { popupService } from '../services/api';

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const StatusBadge = styled.span<{ active: boolean }>`
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${({ active }) => (active ? '#d1fae5' : '#f3f4f6')};
  color: ${({ active }) => (active ? '#065f46' : '#6b7280')};
`;

const CardInfo = styled.div`
  color: #6b7280;
  font-size: 14px;
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: auto;
`;

interface Popup {
  id: number;
  name: string;
  is_active: boolean;
  trigger_type: string;
  created_at: string;
}

const PopupManager: React.FC = () => {
  const navigate = useNavigate();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPopups();
  }, []);

  const loadPopups = async () => {
    try {
      const data = await popupService.getAll();
      setPopups(data.data?.popups || []);
    } catch (error) {
      console.error('Error loading popups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo popup?')) return;
    try {
      await popupService.delete(id);
      loadPopups();
    } catch (error) {
      console.error('Error deleting popup:', error);
    }
  };

  return (
    <Container>
      <Header>
        <Title>Gestione Popups</Title>
        <Button onClick={() => navigate('/popups/new')} variant="primary">
          + Nuovo Popup
        </Button>
      </Header>

      {loading ? (
        <p>Caricamento...</p>
      ) : popups.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>
          Nessun popup creato. Clicca su "+ Nuovo Popup" per iniziare.
        </p>
      ) : (
        <Grid>
          {popups.map((popup) => (
            <Card key={popup.id}>
              <CardHeader>
                <CardTitle>{popup.name}</CardTitle>
                <StatusBadge active={popup.is_active}>
                  {popup.is_active ? 'Attivo' : 'Inattivo'}
                </StatusBadge>
              </CardHeader>
              <CardInfo>
                Trigger: {popup.trigger_type === 'onload' ? 'Caricamento Pagina' : 'Ritardo'}
              </CardInfo>
              <CardActions>
                <Button 
                  size="small" 
                  variant="secondary" 
                  onClick={() => navigate(`/popups/${popup.id}`)}
                  style={{ flex: 1 }}
                >
                  Modifica
                </Button>
                <Button 
                  size="small" 
                  variant="danger" 
                  onClick={() => handleDelete(popup.id)}
                >
                  Elimina
                </Button>
              </CardActions>
            </Card>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default PopupManager;
