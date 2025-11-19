import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import Logo from '../common/Logo';
import ChangePasswordModal from '../account/ChangePasswordModal';
import ChangeEmailModal from '../account/ChangeEmailModal';
import CreateUserModal from '../account/CreateUserModal';
import AdminUsersModal from '../account/AdminUsersModal';

const HeaderContainer = styled.header`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LogoText = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const UserName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
`;

const UserRole = styled.span`
  font-size: 12px;
  color: #6b7280;
  text-transform: capitalize;
`;

const AccountButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  color: #374151;
  cursor: pointer;
`;

const MenuContainer = styled.div`
  position: relative;
`;

const Dropdown = styled.div`
  position: absolute;
  top: 44px;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
  min-width: 220px;
  padding: 8px;
  z-index: 50;
`;

const DropdownItem = styled.button`
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: 10px 12px;
  border-radius: 6px;
  color: #1f2937;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #f9fafb;
  }
`;

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showAdminUsers, setShowAdminUsers] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <HeaderContainer>
      <LogoSection>
        <Logo size={32} />
        <LogoText>Menu Manager</LogoText>
      </LogoSection>
      
      <UserSection>
        {user && (
          <UserInfo>
            <UserName>{user.username}</UserName>
            <UserRole>{
              user.role === 'admin'
                ? 'Admin'
                : user.role === 'cook'
                ? 'Cuoco'
                : user.role === 'waiter'
                ? 'Cameriere'
                : user.role
            }</UserRole>
          </UserInfo>
        )}
        <MenuContainer ref={menuRef}>
          <AccountButton onClick={() => setMenuOpen(v => !v)} aria-label="Apri menu account">👤</AccountButton>
          {menuOpen && (
            <Dropdown>
              <DropdownItem onClick={() => { setShowChangeEmail(true); setMenuOpen(false); }}>✉️ Cambia email</DropdownItem>
              <DropdownItem onClick={() => { setShowChangePassword(true); setMenuOpen(false); }}>🔒 Cambia password</DropdownItem>
              {user?.role === 'admin' && (
                <>
                  <DropdownItem onClick={() => { setShowCreateUser(true); setMenuOpen(false); }}>➕ Crea account</DropdownItem>
                  <DropdownItem onClick={() => { setShowAdminUsers(true); setMenuOpen(false); }}>👥 Gestisci utenti</DropdownItem>
                </>
              )}
            </Dropdown>
          )}
        </MenuContainer>
        <Button
          variant="secondary"
          size="small"
          onClick={handleLogout}
        >
          Esci
        </Button>
      </UserSection>
      <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} />
      <ChangeEmailModal isOpen={showChangeEmail} onClose={() => setShowChangeEmail(false)} />
      <CreateUserModal isOpen={showCreateUser} onClose={() => setShowCreateUser(false)} />
      <AdminUsersModal isOpen={showAdminUsers} onClose={() => setShowAdminUsers(false)} />
    </HeaderContainer>
  );
};

export default Header;