import React from 'react';
import styled from 'styled-components';

interface BusinessInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  whatsapp: string;
  google_business: string;
  vat_number?: string;
}

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessInfo: BusinessInfo | null;
}

const ModalOverlay = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isOpen'].includes(prop),
})<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding: 0;

  @media (min-width: 768px) {
    align-items: center;
    padding: 20px;
  }
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  animation: slideUp 0.3s ease-out;

  @media (min-width: 768px) {
    border-radius: 20px;
    max-height: 90vh;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid #f0f0f0;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #e74c3c;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(231, 76, 60, 0.1);
  }
`;

const ModalBody = styled.div`
  padding: 8px 24px 24px 24px;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 14px;
  margin: 0 0 24px 0;
`;

const ContactList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const ContactItem = styled.a`
  display: flex;
  align-items: center;
  padding: 16px 0;
  text-decoration: none;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
  border-radius: 8px;
  margin-bottom: 2px;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const StaticItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 0;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 2px;

  &:last-child {
    border-bottom: none;
  }
`;

const ContactIcon = styled.div`
  width: 24px;
  height: 24px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
`;

const ContactText = styled.div`
  flex: 1;
  font-size: 16px;
  font-weight: 500;
`;

const ContactArrow = styled.div`
  color: #ccc;
  font-size: 18px;
`;

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, businessInfo }) => {
  if (!businessInfo) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatPhoneForCall = (phone: string) => {
    return `tel:${phone.replace(/\s/g, '')}`;
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    // Rimuovi spazi e caratteri speciali, mantieni solo numeri e +
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    return `https://wa.me/${cleanPhone}`;
  };

  const formatGoogleMapsUrl = (address: string, city: string) => {
    const fullAddress = `${address}, ${city}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  };

  return (
    <ModalOverlay isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Contatti</ModalTitle>
          <CloseButton onClick={onClose}>
            ✕
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          <Subtitle>Rimani in contatto con noi</Subtitle>
          <ContactList>
            {businessInfo.phone && (
              <ContactItem href={formatPhoneForCall(businessInfo.phone)}>
                <ContactIcon>📞</ContactIcon>
                <ContactText>{businessInfo.phone}</ContactText>
                <ContactArrow>›</ContactArrow>
              </ContactItem>
            )}
            
            {businessInfo.whatsapp && (
              <ContactItem 
                href={formatPhoneForWhatsApp(businessInfo.whatsapp)} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ContactIcon>💬</ContactIcon>
                <ContactText>Messaggio WhatsApp</ContactText>
                <ContactArrow>›</ContactArrow>
              </ContactItem>
            )}
            
            {businessInfo.email && (
              <ContactItem href={`mailto:${businessInfo.email}`}>
                <ContactIcon>✉️</ContactIcon>
                <ContactText>{businessInfo.email}</ContactText>
                <ContactArrow>›</ContactArrow>
              </ContactItem>
            )}
            {businessInfo.vat_number && (
              <StaticItem>
                <ContactIcon>🧾</ContactIcon>
                <ContactText>{`Partita IVA: ${businessInfo.vat_number}`}</ContactText>
              </StaticItem>
            )}
            
            {businessInfo.address && businessInfo.city && (
              <ContactItem 
                href={formatGoogleMapsUrl(businessInfo.address, businessInfo.city)}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ContactIcon>📍</ContactIcon>
                <ContactText>
                  <div>Visualizza su Google Maps</div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                    {businessInfo.address}, {businessInfo.city}
                  </div>
                </ContactText>
                <ContactArrow>›</ContactArrow>
              </ContactItem>
            )}
          </ContactList>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ContactModal;