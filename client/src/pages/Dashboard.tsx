import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import { allergenService, ingredientService, categoryService, productService, businessService } from '../services/api';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const WelcomeSection = styled.div`
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
`;

const WelcomeTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
`;

const WelcomeSubtitle = styled.p`
  font-size: 18px;
  color: #6b7280;
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border-left: 4px solid #3b82f6;
`;

const StatIcon = styled.div`
  font-size: 32px;
  margin-bottom: 12px;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
`;

const QuickActionsSection = styled.div`
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const InlineToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
`;

const ActionCard = styled.button`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-align: left;
  
  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-1px);
  }
`;

const ActionIcon = styled.div`
  font-size: 24px;
  margin-bottom: 8px;
`;

const ActionTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
`;

const ActionDescription = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const LoadingCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border-left: 4px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: #6b7280;
`;

interface Stats {
  allergens: number;
  ingredients: number;
  categories: number;
  products: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [allergensRes, ingredientsRes, categoriesRes, productsRes] = await Promise.all([
          allergenService.getAll(),
          ingredientService.getAll(),
          categoryService.getAll(),
          productService.getAll(),
        ]);

        setStats({
          allergens: allergensRes.data?.allergens?.length || 0,
          ingredients: ingredientsRes.data?.ingredients?.length || 0,
          categories: categoriesRes.data?.categories?.length || 0,
          products: productsRes.data?.products?.length || 0,
        });
      } catch (error) {
        console.error('Errore nel caricamento delle statistiche:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleDownloadQr = async () => {
    try {
      const blob = await businessService.getMenuQr();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'menu-qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Errore durante il download del QR code:', error);
    }
  };

  const quickActions = [
    {
      icon: '⚠️',
      title: 'Gestisci Allergeni',
      description: 'Aggiungi o modifica gli allergeni del menu',
      path: '/allergens',
    },
    {
      icon: '🥕',
      title: 'Gestisci Ingredienti',
      description: 'Organizza gli ingredienti e le loro proprietà',
      path: '/ingredients',
    },
    {
      icon: '📂',
      title: 'Gestisci Categorie',
      description: 'Struttura le categorie del menu',
      path: '/categories',
    },
    {
      icon: '🍽️',
      title: 'Gestisci Prodotti',
      description: 'Crea e gestisci i prodotti del menu',
      path: '/products',
    },
    {
      icon: '🏢',
      title: 'Attività',
      description: 'Gestisci le informazioni della tua attività',
      path: '/business',
    },
  ];

  const handleQuickAction = (path: string) => {
    window.location.href = path;
  };

  return (
    <DashboardContainer>
      <WelcomeSection>
        <WelcomeTitle>Benvenuto, {user?.username}!</WelcomeTitle>
        <WelcomeSubtitle>
          Gestisci il tuo menu del ristorante da questo pannello di controllo
        </WelcomeSubtitle>
      </WelcomeSection>

      <StatsGrid>
        {loading ? (
          <>
            <LoadingCard>Caricamento...</LoadingCard>
            <LoadingCard>Caricamento...</LoadingCard>
            <LoadingCard>Caricamento...</LoadingCard>
            <LoadingCard>Caricamento...</LoadingCard>
          </>
        ) : (
          <>
            <StatCard>
              <StatIcon>⚠️</StatIcon>
              <StatValue>{stats?.allergens || 0}</StatValue>
              <StatLabel>Allergeni Totali</StatLabel>
            </StatCard>
            <StatCard>
              <StatIcon>🥕</StatIcon>
              <StatValue>{stats?.ingredients || 0}</StatValue>
              <StatLabel>Ingredienti Totali</StatLabel>
            </StatCard>
            <StatCard>
              <StatIcon>📂</StatIcon>
              <StatValue>{stats?.categories || 0}</StatValue>
              <StatLabel>Categorie Totali</StatLabel>
            </StatCard>
            <StatCard>
              <StatIcon>🍽️</StatIcon>
              <StatValue>{stats?.products || 0}</StatValue>
              <StatLabel>Prodotti Totali</StatLabel>
            </StatCard>
          </>
        )}
      </StatsGrid>

      <QuickActionsSection>
        <SectionTitle>Azioni Rapide</SectionTitle>
        <ActionsGrid>
          {quickActions.map((action) => (
            <ActionCard
              key={action.path}
              onClick={() => handleQuickAction(action.path)}
            >
              <ActionIcon>{action.icon}</ActionIcon>
              <ActionTitle>{action.title}</ActionTitle>
              <ActionDescription>{action.description}</ActionDescription>
            </ActionCard>
          ))}
          {user?.role === 'admin' && (
            <ActionCard onClick={handleDownloadQr}>
              <ActionIcon>🔗</ActionIcon>
              <ActionTitle>Menu QR</ActionTitle>
              <ActionDescription>Scarica il QR del menu pubblico</ActionDescription>
            </ActionCard>
          )}
        </ActionsGrid>
      </QuickActionsSection>
    </DashboardContainer>
  );
};

export default Dashboard;