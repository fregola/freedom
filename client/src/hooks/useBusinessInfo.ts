import { useState, useEffect } from 'react';
import { businessService } from '../services/api';

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

export const useBusinessInfo = () => {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinessInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await businessService.get();
      
      setBusinessInfo({
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        city: data.city || '',
        whatsapp: data.whatsapp || '',
        google_business: data.google_business || '',
        vat_number: data.vat_number || '',
      });
    } catch (err) {
      console.error('Errore nel caricamento dei dati business:', err);
      setError('Errore nel caricamento delle informazioni di contatto');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessInfo();
  }, []);

  return {
    businessInfo,
    loading,
    error,
    refetch: fetchBusinessInfo,
  };
};