import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { businessService } from '../../services/api';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SidebarOverlay = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isOpen'].includes(prop),
})<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 40;
  display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
  
  @media (min-width: 768px) {
    display: none;
  }
`;

const SidebarContainer = styled.aside.withConfig({
  shouldForwardProp: (prop) => !['isOpen'].includes(prop),
})<{ isOpen: boolean }>`
  position: fixed;
  top: 64px;
  left: 0;
  bottom: 0;
  width: 256px;
  background: white;
  border-right: 1px solid #e5e7eb;
  z-index: 50;
  transform: translateX(${({ isOpen }) => (isOpen ? '0' : '-100%')});
  transition: transform 0.3s ease-in-out;
  
  @media (min-width: 768px) {
    transform: translateX(0);
    position: relative;
    top: 0;
  }
`;

const SidebarContent = styled.div`
  padding: 24px 0;
  height: 100%;
  overflow-y: auto;
`;

const NavSection = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 24px;
  margin-bottom: 12px;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li`
  margin: 0;
`;

const NavLink = styled.button.withConfig({
  shouldForwardProp: (prop) => !['isActive'].includes(prop),
})<{ isActive: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  border: none;
  background: ${({ isActive }) => (isActive ? '#f3f4f6' : 'transparent')};
  color: ${({ isActive }) => (isActive ? '#1f2937' : '#6b7280')};
  font-size: 14px;
  font-weight: ${({ isActive }) => (isActive ? '600' : '500')};
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border-left: 3px solid ${({ isActive }) => (isActive ? '#3b82f6' : 'transparent')};
  
  &:hover {
    background: #f9fafb;
    color: #1f2937;
  }
`;

const Icon = styled.span`
  font-size: 18px;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

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

  const navigationItems = [
    {
      section: 'Dashboard',
      items: [
        { path: '/dashboard', label: 'Panoramica', icon: '📊' },
      ],
    },
    {
      section: 'Gestione Menu',
      items: [
        { path: '/allergens', label: 'Allergeni', icon: '⚠️' },
        { path: '/ingredients', label: 'Ingredienti', icon: '🥕' },
        { path: '/categories', label: 'Categorie', icon: '📂' },
        { path: '/products', label: 'Prodotti', icon: '🍽️' },
        { path: '/custom-menus', label: 'Menu personalizzati', icon: '🧾' },
      ],
    },
    {
      section: 'Impostazioni',
      items: [
        { path: '/business', label: 'Attività', icon: '🏢' },
      ],
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      <SidebarOverlay isOpen={isOpen} onClick={onClose} />
      <SidebarContainer isOpen={isOpen}>
        <SidebarContent>
          {navigationItems.map((section) => (
            <NavSection key={section.section}>
              <SectionTitle>{section.section}</SectionTitle>
              <NavList>
                {section.items.map((item) => (
                  <NavItem key={item.path}>
                    <NavLink
                      isActive={location.pathname === item.path}
                      onClick={() => handleNavigation(item.path)}
                    >
                      <Icon>{item.icon}</Icon>
                      {item.label}
                    </NavLink>
                  </NavItem>
                ))}
                {user?.role === 'admin' && section.section === 'Gestione Menu' && (
                  <NavItem key="#qr-download">
                    <NavLink isActive={false} onClick={handleDownloadQr}>
                      <Icon>🔗</Icon>
                      Menu QR
                    </NavLink>
                  </NavItem>
                )}
              </NavList>
            </NavSection>
          ))}
        </SidebarContent>
      </SidebarContainer>
    </>
  );
};

export default Sidebar;