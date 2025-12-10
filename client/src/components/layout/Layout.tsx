import React, { useState } from 'react';
import styled from 'styled-components';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContainer = styled.div`
  display: flex;
  flex: 1;
`;

const ContentArea = styled.main`
  flex: 1;
  padding: 24px;
  background: #f9fafb;
  min-height: calc(100vh - 64px);
  
  @media (max-width: 767px) {
    padding: 16px;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 60;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  
  @media (max-width: 767px) {
    display: block;
  }
`;

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <LayoutContainer>
      <Header />
      <MainContainer>
        <MobileMenuButton onClick={toggleSidebar}>
          ☰
        </MobileMenuButton>
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <ContentArea>
          <Outlet />
        </ContentArea>
      </MainContainer>
    </LayoutContainer>
  );
};

export default Layout;