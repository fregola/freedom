# Cartella Loghi

Questa cartella contiene i loghi utilizzati nell'applicazione Menu Manager.

## Come sostituire il logo

Per cambiare il logo dell'applicazione:

1. **Sostituisci il file esistente**: Salva il nuovo logo con il nome `logo.svg` in questa cartella, sostituendo il file esistente
2. **Formato consigliato**: Utilizza il formato SVG per la migliore qualità e scalabilità
3. **Dimensioni**: Il logo si adatterà automaticamente alle diverse dimensioni richieste dall'interfaccia

## File presenti

- `logo.svg` - Logo principale dell'applicazione utilizzato in:
  - Header dell'applicazione (32px)
  - Pagina di login (80px)
  - Altri componenti che richiedono il logo aziendale

## Note importanti

- **Non aggiungere loghi multipli**: Sostituisci sempre il file `logo.svg` esistente invece di crearne di nuovi
- **Backup**: Se necessario, fai un backup del logo precedente prima di sostituirlo
- **Riavvio**: Dopo aver sostituito il logo, potrebbe essere necessario riavviare il server di sviluppo per vedere le modifiche

## Formati supportati

Anche se è consigliato SVG, sono supportati anche:
- PNG
- JPG/JPEG
- WebP

Ricorda di aggiornare l'import nel componente `Logo.tsx` se cambi il formato del file.