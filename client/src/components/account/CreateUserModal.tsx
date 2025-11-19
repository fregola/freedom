import React, { useState } from 'react';
import styled from 'styled-components';
import Button from '../common/Button';
import Input from '../common/Input';
import { userService } from '../../services/api';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalOverlay = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isOpen'].includes(prop),
})<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 10px;
  padding: 18px;
  width: 90%;
  max-width: 440px;
  box-shadow: 0 10px 24px rgba(0,0,0,0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ModalTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #6b7280;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Actions = styled.div`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  margin-top: 6px;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
`;

const SuccessMessage = styled.div`
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
`;

const RoleSelect = styled.select`
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  background-color: white;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
`;

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'cook' | 'waiter'>('waiter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Validazioni client allineate a quelle del server
  const USERNAME_RE = /^[a-zA-Z0-9_]+$/;
  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

  const validateClient = (): boolean => {
    if (!username || !email || !password) {
      setError('Compila tutti i campi');
      return false;
    }
    if (username.length < 3 || username.length > 50 || !USERNAME_RE.test(username)) {
      setError('Username non valido: 3-50 caratteri, solo lettere/numeri/underscore');
      return false;
    }
    if (!EMAIL_RE.test(email)) {
      setError('Email non valida');
      return false;
    }
    if (!PASSWORD_RE.test(password)) {
      setError('Password non valida: ≥6 caratteri, con minuscola, maiuscola e numero');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!validateClient()) return;
    try {
      setLoading(true);
      const res = await userService.create({ username, email, password, role });
      if (res.success) {
        setSuccess('Account creato con successo');
        setUsername('');
        setEmail('');
        setPassword('');
        setRole('waiter');
      } else {
        const serverErrors = (res as any)?.errors;
        if (Array.isArray(serverErrors) && serverErrors.length) {
          setError(serverErrors.map((e: any) => e.msg).join(' · '));
        } else {
          setError(res.message || 'Errore nella creazione account');
        }
      }
    } catch (err: any) {
      const data = err?.response?.data;
      const serverErrors = data?.errors;
      if (Array.isArray(serverErrors) && serverErrors.length) {
        setError(serverErrors.map((e: any) => e.msg).join(' · '));
      } else {
        setError(data?.message || 'Errore nella creazione account');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <ModalOverlay isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Crea Nuovo Account</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        <Form onSubmit={handleSubmit}>
          <Input
            label="Nome utente"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
          />
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            Requisiti: almeno 6 caratteri, includi una minuscola, una maiuscola e un numero.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Ruolo</Label>
            <RoleSelect value={role} onChange={(e) => setRole(e.target.value as any)}>
              <option value="cook">Cuoco</option>
              <option value="waiter">Cameriere</option>
              <option value="admin">Admin</option>
            </RoleSelect>
          </div>
          <Actions>
            <Button variant="secondary" onClick={onClose} size="small">Chiudi</Button>
            <Button type="submit" loading={loading} size="small">Crea</Button>
          </Actions>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreateUserModal;