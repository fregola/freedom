import React, { useState } from 'react';
import styled from 'styled-components';
import Button from '../common/Button';
import Input from '../common/Input';
import { authService } from '../../services/api';

interface ChangeEmailModalProps {
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

const ChangeEmailModal: React.FC<ChangeEmailModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!email || !EMAIL_RE.test(email)) {
      setError('Email non valida');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.changeEmail({ email });
      if (res.success) {
        setSuccess('Email cambiata con successo');
        setEmail('');
      } else {
        setError(res.message || 'Errore nel cambio email');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Errore nel cambio email');
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
          <ModalTitle>Cambia Email</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        <Form onSubmit={handleSubmit}>
          <Input
            label="Nuova email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
          />
          <Actions>
            <Button variant="secondary" onClick={onClose} size="small">Chiudi</Button>
            <Button type="submit" loading={loading} size="small">Salva</Button>
          </Actions>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ChangeEmailModal;