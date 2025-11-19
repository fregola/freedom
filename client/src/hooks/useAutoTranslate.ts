import { useState, useEffect } from 'react';

interface UseAutoTranslateReturn {
  translatedText: string;
  isTranslating: boolean;
  error: string | null;
}

/**
 * Hook personalizzato per la traduzione automatica
 * @param italianText - Testo in italiano da tradurre
 * @param currentEnglishText - Testo inglese attuale
 * @param delay - Ritardo in millisecondi prima della traduzione (default: 500ms)
 * @returns Oggetto con traduzione, stato e errore
 */
export const useAutoTranslate = (
  italianText: string, 
  currentEnglishText: string, 
  delay: number = 500
): UseAutoTranslateReturn => {
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Se non c'è testo italiano o c'è già del testo inglese inserito manualmente, non tradurre
    if (!italianText || italianText.trim() === '' || currentEnglishText.trim() !== '') {
      setTranslatedText('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsTranslating(true);
      setError(null);

      try {
        const response = await fetch('http://localhost:5001/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: italianText }),
        });

        if (!response.ok) {
          throw new Error('Errore nella traduzione');
        }

        const data = await response.json();
        setTranslatedText(data.translation || '');
      } catch (err: any) {
        console.error('Errore nella traduzione automatica:', err);
        setError(err.message || 'Errore sconosciuto');
        setTranslatedText('');
      } finally {
        setIsTranslating(false);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [italianText, currentEnglishText, delay]);

  return { translatedText, isTranslating, error };
};

export default useAutoTranslate;