import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/common/Button';
import { popupService } from '../services/api';

const Container = styled.div`
  display: flex;
  height: calc(100vh - 120px);
  gap: 0;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: white;
`;

const Sidebar = styled.div`
  width: 350px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  background: white;
`;

const SidebarTabs = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 16px;
  background: ${({ active }) => (active ? '#fff' : '#f9fafb')};
  border: none;
  border-bottom: 2px solid ${({ active }) => (active ? '#3b82f6' : 'transparent')};
  color: ${({ active }) => (active ? '#3b82f6' : '#6b7280')};
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #3b82f6;
    background: #f0f9ff;
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
`;

const PreviewArea = styled.div`
  flex: 1;
  background-color: #f3f4f6;
  background-image: 
    linear-gradient(45deg, #e5e7eb 25%, transparent 25%), 
    linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #e5e7eb 75%), 
    linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 40px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
`;

const ColorInput = styled.input`
  width: 100%;
  height: 38px;
  padding: 2px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
`;

const BlockList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BlockItem = styled.div<{ active: boolean }>`
  padding: 12px;
  border: 1px solid ${({ active }) => (active ? '#3b82f6' : '#e5e7eb')};
  background-color: ${({ active }) => (active ? '#eff6ff' : 'white')};
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
  }
`;

const BlockControls = styled.div`
  display: flex;
  gap: 4px;
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #6b7280;
  border-radius: 4px;

  &:hover {
    background-color: #e5e7eb;
    color: #1f2937;
  }
`;

const AddBlockGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 24px;
`;

const AddBlockButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  gap: 8px;

  &:hover {
    border-color: #3b82f6;
    background-color: #f0f9ff;
    color: #3b82f6;
  }
`;

// Preview Components
const PopupOverlay = styled.div<{ bgColor: string }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ bgColor }) => bgColor};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const PopupCard = styled.div<{ 
  bgColor: string; 
  borderRadius: string;
  padding: string;
  width: string;
}>`
  background-color: ${({ bgColor }) => bgColor};
  border-radius: ${({ borderRadius }) => borderRadius}px;
  padding: ${({ padding }) => padding}px;
  width: 100%;
  max-width: ${({ width }) => width}px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  transition: all 0.2s ease;
`;

const CloseButton = styled.button<{ color: string }>`
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${({ color }) => color};
  opacity: 0.6;
  z-index: 10;
  
  &:hover {
    opacity: 1;
  }
`;

// Dynamic Block Components
const BlockContainer = styled.div<{ marginBottom: number; align: string; selected?: boolean }>`
  margin-bottom: ${({ marginBottom }) => marginBottom}px;
  text-align: ${({ align }) => align};
  cursor: pointer;
  position: relative;
  
  ${({ selected }) => selected && `
    outline: 2px dashed #3b82f6;
    outline-offset: 4px;
  `}

  &:hover {
    outline: 2px dashed #93c5fd;
    outline-offset: 4px;
  }
`;

const HeadingBlock = styled.h2<{ fontSize: number; color: string }>`
  font-size: ${({ fontSize }) => fontSize}px;
  color: ${({ color }) => color};
  font-weight: 700;
  line-height: 1.2;
  margin: 0;
`;

const TextBlock = styled.p<{ fontSize: number; color: string }>`
  font-size: ${({ fontSize }) => fontSize}px;
  color: ${({ color }) => color};
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
`;

const ImageBlock = styled.img<{ width: string; borderRadius: number }>`
  width: ${({ width }) => width};
  max-width: 100%;
  height: auto;
  border-radius: ${({ borderRadius }) => borderRadius}px;
  object-fit: cover;
`;

const VideoBlock = styled.video<{ width: string; borderRadius: number }>`
  width: ${({ width }) => width};
  max-width: 100%;
  height: auto;
  border-radius: ${({ borderRadius }) => borderRadius}px;
`;

const ButtonBlock = styled.a<{ backgroundColor: string; textColor: string; borderRadius: number; width: string }>`
  display: inline-block;
  background-color: ${({ backgroundColor }) => backgroundColor};
  color: ${({ textColor }) => textColor};
  padding: 12px 24px;
  border-radius: ${({ borderRadius }) => borderRadius}px;
  text-decoration: none;
  font-weight: 600;
  width: ${({ width }) => width === '100%' ? '100%' : 'auto'};
  text-align: center;
  border: none;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
`;

const SpacerBlock = styled.div<{ height: number }>`
  height: ${({ height }) => height}px;
  width: 100%;
`;

const DividerBlock = styled.hr<{ color: string; thickness: number }>`
  border: none;
  border-top: ${({ thickness }) => thickness}px solid ${({ color }) => color};
  margin: 0;
  width: 100%;
`;

const ToggleSwitch = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
`;

const SwitchInput = styled.input`
  appearance: none;
  width: 44px;
  height: 24px;
  background: #d1d5db;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;

  &:checked {
    background: #3b82f6;
  }

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
  }

  &:checked::after {
    transform: translateX(20px);
  }
`;

interface Block {
  id: string;
  type: 'heading' | 'text' | 'image' | 'video' | 'button' | 'spacer' | 'divider';
  props: any;
}

const PopupBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'build' | 'style' | 'settings'>('build');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  
  const [config, setConfig] = useState({
    name: 'Nuovo Popup',
    is_active: false,
    trigger_type: 'onload',
    trigger_delay: 2,
    frequency: 'always',
    blocks: [] as Block[],
    
    // Legacy fields (kept for compatibility or default init)
    title: '',
    body_text: '',
    image_url: '',
    button_text: '',
    button_link: '',
    
    style_config: {
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 32,
      width: 400,
      closeButtonColor: '#1f2937'
    }
  });

  const loadPopup = useCallback(async (popupId: number) => {
    try {
      setLoading(true);
      const data = await popupService.getById(popupId);
      const popup = data.data?.popup || data.popup;
      
      if (!popup) {
        throw new Error('Dati popup non trovati');
      }
      
      let parsedStyle = {};
      try {
        parsedStyle = typeof popup.style_config === 'string' 
          ? JSON.parse(popup.style_config) 
          : popup.style_config;
      } catch (e) {
        console.error("Error parsing style config", e);
      }

      let parsedBlocks: Block[] = [];
      try {
        parsedBlocks = typeof popup.blocks === 'string' 
          ? JSON.parse(popup.blocks) 
          : (popup.blocks || []);
      } catch (e) {
        console.error("Error parsing blocks", e);
      }

      // If no blocks but legacy content exists, migrate it to blocks
      if (parsedBlocks.length === 0 && (popup.title || popup.body_text)) {
        if (popup.image_url) parsedBlocks.push({ id: 'img-1', type: 'image', props: { url: popup.image_url, width: '100%', borderRadius: 8, marginBottom: 16 } });
        if (popup.title) parsedBlocks.push({ id: 'head-1', type: 'heading', props: { text: popup.title, fontSize: 24, color: '#1f2937', align: 'center', marginBottom: 12 } });
        if (popup.body_text) parsedBlocks.push({ id: 'txt-1', type: 'text', props: { text: popup.body_text, fontSize: 16, color: '#4b5563', align: 'center', marginBottom: 24 } });
        if (popup.button_text) parsedBlocks.push({ id: 'btn-1', type: 'button', props: { text: popup.button_text, link: popup.button_link, backgroundColor: '#3b82f6', textColor: '#ffffff', borderRadius: 8, width: '100%', align: 'center', marginBottom: 0 } });
      }

      setConfig(prev => ({
        ...popup,
        blocks: parsedBlocks,
        style_config: {
          ...prev.style_config,
          ...parsedStyle
        }
      }));
    } catch (error) {
      console.error('Error loading popup:', error);
      alert('Errore caricamento popup');
    } finally {
      setLoading(false);
    }
  }, []);

  const addBlock = useCallback((type: Block['type'], defaultProps = {}) => {
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      props: defaultProps
    };
    
    // Default props based on type if not provided
    if (Object.keys(defaultProps).length === 0) {
      switch (type) {
        case 'heading':
          newBlock.props = { text: 'Nuovo Titolo', fontSize: 24, color: '#1f2937', align: 'center', marginBottom: 16 };
          break;
        case 'text':
          newBlock.props = { text: 'Inserisci qui il tuo testo...', fontSize: 16, color: '#4b5563', align: 'center', marginBottom: 16 };
          break;
        case 'image':
          newBlock.props = { url: 'https://via.placeholder.com/400x200', width: '100%', borderRadius: 8, marginBottom: 16 };
          break;
        case 'video':
          newBlock.props = { url: 'https://www.w3schools.com/html/mov_bbb.mp4', width: '100%', borderRadius: 8, marginBottom: 16, autoplay: false, loop: false };
          break;
        case 'button':
          newBlock.props = { text: 'Clicca Qui', link: '#', backgroundColor: '#3b82f6', textColor: '#ffffff', borderRadius: 8, width: '100%', align: 'center', marginBottom: 0 };
          break;
        case 'spacer':
          newBlock.props = { height: 32 };
          break;
        case 'divider':
          newBlock.props = { color: '#e5e7eb', thickness: 1, marginBottom: 16 };
          break;
      }
    }

    setConfig(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }));
    setSelectedBlockId(newBlock.id);
  }, []);

  useEffect(() => {
    if (id) {
      loadPopup(Number(id));
    } else {
      // Init default blocks for new popup
      addBlock('heading', { text: 'Offerta Speciale!', fontSize: 24, color: '#1f2937', align: 'center', marginBottom: 16 });
      addBlock('text', { text: 'Iscriviti per ricevere sconti.', fontSize: 16, color: '#4b5563', align: 'center', marginBottom: 24 });
      addBlock('button', { text: 'Scopri di più', link: '#', backgroundColor: '#3b82f6', textColor: '#ffffff', borderRadius: 8, width: '100%', align: 'center', marginBottom: 0 });
    }
  }, [id, loadPopup, addBlock]);



  const handleSave = async () => {
    try {
      setLoading(true);
      if (id) {
        await popupService.update(Number(id), config);
        alert('Popup aggiornato con successo!');
      } else {
        await popupService.create(config);
        alert('Popup creato con successo!');
        navigate('/popups');
      }
    } catch (error) {
      console.error('Error saving popup:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const updateStyle = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      style_config: {
        ...prev.style_config,
        [key]: value
      }
    }));
  };



  const removeBlock = (id: string) => {
    setConfig(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== id)
    }));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...config.blocks];
    if (direction === 'up' && index > 0) {
      [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
    } else if (direction === 'down' && index < newBlocks.length - 1) {
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    }
    setConfig(prev => ({ ...prev, blocks: newBlocks }));
  };

  const updateBlockProps = (id: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => 
        b.id === id ? { ...b, props: { ...b.props, [key]: value } } : b
      )
    }));
  };

  const handleImageUpload = async (file: File, blockId: string) => {
    try {
      setLoading(true);
      const response = await popupService.uploadImage(file);
      if (response.success) {
        updateBlockProps(blockId, 'url', response.url);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Errore durante il caricamento dell\'immagine');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (file: File, blockId: string) => {
    try {
      setLoading(true);
      const response = await popupService.uploadVideo(file);
      if (response.success) {
        updateBlockProps(blockId, 'url', response.url);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Errore durante il caricamento del video');
    } finally {
      setLoading(false);
    }
  };

  const renderBlockEditor = () => {
    const block = config.blocks.find(b => b.id === selectedBlockId);
    if (!block) return <div style={{ color: '#6b7280', textAlign: 'center', marginTop: 24 }}>Seleziona un blocco per modificarlo</div>;

    return (
      <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 24, paddingTop: 24 }}>
        <SectionTitle>Modifica {block.type === 'heading' ? 'Titolo' : block.type === 'text' ? 'Testo' : block.type === 'button' ? 'Bottone' : block.type === 'video' ? 'Video' : block.type}</SectionTitle>
        
        {(block.type === 'heading' || block.type === 'text' || block.type === 'button') && (
          <FormGroup>
            <Label>Testo</Label>
            {block.type === 'text' ? (
              <TextArea value={block.props.text} onChange={e => updateBlockProps(block.id, 'text', e.target.value)} />
            ) : (
              <Input value={block.props.text} onChange={e => updateBlockProps(block.id, 'text', e.target.value)} />
            )}
          </FormGroup>
        )}

        {block.type === 'image' && (
          <FormGroup>
            <Label>Carica Immagine</Label>
            <Input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, block.id);
              }} 
            />
          </FormGroup>
        )}

        {block.type === 'video' && (
          <>
            <FormGroup>
              <Label>Carica Video (MP4)</Label>
              <Input 
                type="file" 
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleVideoUpload(file, block.id);
                }} 
              />
            </FormGroup>
            <FormGroup>
              <ToggleSwitch>
                <SwitchInput 
                  type="checkbox" 
                  checked={block.props.autoplay} 
                  onChange={e => updateBlockProps(block.id, 'autoplay', e.target.checked)} 
                />
                <span style={{ fontSize: '14px', color: '#374151' }}>Autoplay (Muted)</span>
              </ToggleSwitch>
            </FormGroup>
            <FormGroup>
              <ToggleSwitch>
                <SwitchInput 
                  type="checkbox" 
                  checked={block.props.loop} 
                  onChange={e => updateBlockProps(block.id, 'loop', e.target.checked)} 
                />
                <span style={{ fontSize: '14px', color: '#374151' }}>Loop</span>
              </ToggleSwitch>
            </FormGroup>
          </>
        )}

        {block.type === 'button' && (
          <FormGroup>
            <Label>Link</Label>
            <Input value={block.props.link} onChange={e => updateBlockProps(block.id, 'link', e.target.value)} />
          </FormGroup>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {(block.type === 'heading' || block.type === 'text' || block.type === 'button') && (
            <>
              <FormGroup>
                <Label>Dimensione Font</Label>
                <Input type="number" value={block.props.fontSize} onChange={e => updateBlockProps(block.id, 'fontSize', Number(e.target.value))} />
              </FormGroup>
              <FormGroup>
                <Label>Colore Testo</Label>
                <ColorInput type="color" value={block.props.color || block.props.textColor} onChange={e => updateBlockProps(block.id, block.type === 'button' ? 'textColor' : 'color', e.target.value)} />
              </FormGroup>
            </>
          )}
          
          {(block.type !== 'spacer' && block.type !== 'divider') && (
            <FormGroup>
              <Label>Allineamento</Label>
              <Select value={block.props.align} onChange={e => updateBlockProps(block.id, 'align', e.target.value)}>
                <option value="left">Sinistra</option>
                <option value="center">Centro</option>
                <option value="right">Destra</option>
              </Select>
            </FormGroup>
          )}

          {block.type === 'button' && (
            <FormGroup>
              <Label>Colore Sfondo</Label>
              <ColorInput type="color" value={block.props.backgroundColor} onChange={e => updateBlockProps(block.id, 'backgroundColor', e.target.value)} />
            </FormGroup>
          )}

          <FormGroup>
            <Label>Margine Sotto (px)</Label>
            <Input type="number" value={block.props.marginBottom} onChange={e => updateBlockProps(block.id, 'marginBottom', Number(e.target.value))} />
          </FormGroup>
        </div>
      </div>
    );
  };

  const renderPreviewBlock = (block: Block) => {
    const { type, props } = block;

    switch (type) {
      case 'heading':
        return <HeadingBlock {...props} onClick={() => setSelectedBlockId(block.id)}>{props.text}</HeadingBlock>;
      case 'text':
        return <TextBlock {...props} onClick={() => setSelectedBlockId(block.id)}>{props.text}</TextBlock>;
      case 'image':
        return <ImageBlock {...props} onClick={() => setSelectedBlockId(block.id)} src={props.url} />;
      case 'video':
        return <VideoBlock {...props} onClick={() => setSelectedBlockId(block.id)} src={props.url} controls muted />;
      case 'button':
        return <ButtonBlock {...props} onClick={() => setSelectedBlockId(block.id)}>{props.text}</ButtonBlock>;
      case 'spacer':
        return <SpacerBlock {...props} onClick={() => setSelectedBlockId(block.id)} />;
      case 'divider':
        return <DividerBlock {...props} onClick={() => setSelectedBlockId(block.id)} />;
      default:
        return null;
    }
  };

  if (loading && id) return <p>Caricamento...</p>;

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold' }}>
          {id ? 'Modifica Popup' : 'Crea Nuovo Popup'}
        </h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" onClick={() => navigate('/popups')}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Salvataggio...' : 'Salva Popup'}
          </Button>
        </div>
      </div>

      <Container>
        <Sidebar>
          <SidebarTabs>
            <Tab active={activeTab === 'build'} onClick={() => setActiveTab('build')}>Costruisci</Tab>
            <Tab active={activeTab === 'style'} onClick={() => setActiveTab('style')}>Stile</Tab>
            <Tab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>Impostazioni</Tab>
          </SidebarTabs>
          
          <SidebarContent>
            {activeTab === 'build' && (
              <>
                <SectionTitle>Aggiungi Blocco</SectionTitle>
                <AddBlockGrid>
                  <AddBlockButton onClick={() => addBlock('heading')}>📝 Titolo</AddBlockButton>
                  <AddBlockButton onClick={() => addBlock('text')}>📄 Testo</AddBlockButton>
                  <AddBlockButton onClick={() => addBlock('image')}>🖼️ Immagine</AddBlockButton>
                  <AddBlockButton onClick={() => addBlock('video')}>🎥 Video</AddBlockButton>
                  <AddBlockButton onClick={() => addBlock('button')}>🔘 Bottone</AddBlockButton>
                  <AddBlockButton onClick={() => addBlock('divider')}>➖ Divisore</AddBlockButton>
                  <AddBlockButton onClick={() => addBlock('spacer')}>⬜ Spazio</AddBlockButton>
                </AddBlockGrid>

                <SectionTitle>I tuoi Blocchi</SectionTitle>
                <BlockList>
                  {config.blocks.map((block, index) => (
                    <BlockItem 
                      key={block.id} 
                      active={selectedBlockId === block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      <span style={{ fontWeight: 500, fontSize: 14 }}>
                        {block.type === 'heading' && 'Titolo'}
                        {block.type === 'text' && 'Testo'}
                        {block.type === 'image' && 'Immagine'}
                        {block.type === 'button' && 'Bottone'}
                        {block.type === 'divider' && 'Divisore'}
                        {block.type === 'spacer' && 'Spazio'}
                      </span>
                      <BlockControls>
                        <IconButton onClick={(e) => { e.stopPropagation(); moveBlock(index, 'up'); }} disabled={index === 0}>⬆️</IconButton>
                        <IconButton onClick={(e) => { e.stopPropagation(); moveBlock(index, 'down'); }} disabled={index === config.blocks.length - 1}>⬇️</IconButton>
                        <IconButton onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} style={{ color: '#ef4444' }}>🗑️</IconButton>
                      </BlockControls>
                    </BlockItem>
                  ))}
                </BlockList>

                {renderBlockEditor()}
              </>
            )}

            {activeTab === 'style' && (
              <>
                <SectionTitle>Layout Popup</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <FormGroup>
                    <Label>Larghezza (px)</Label>
                    <Input 
                      type="number" 
                      value={config.style_config.width} 
                      onChange={e => updateStyle('width', Number(e.target.value))} 
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Padding (px)</Label>
                    <Input 
                      type="number" 
                      value={config.style_config.padding} 
                      onChange={e => updateStyle('padding', Number(e.target.value))} 
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Sfondo Popup</Label>
                    <ColorInput 
                      type="color" 
                      value={config.style_config.backgroundColor} 
                      onChange={e => updateStyle('backgroundColor', e.target.value)} 
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Overlay</Label>
                    <ColorInput 
                      type="color" 
                      value={config.style_config.overlayColor.slice(0, 7) || '#000000'} 
                      onChange={e => updateStyle('overlayColor', e.target.value)} 
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Arrotondamento</Label>
                    <Input 
                      type="number" 
                      value={config.style_config.borderRadius} 
                      onChange={e => updateStyle('borderRadius', Number(e.target.value))} 
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Colore X Chiudi</Label>
                    <ColorInput 
                      type="color" 
                      value={config.style_config.closeButtonColor} 
                      onChange={e => updateStyle('closeButtonColor', e.target.value)} 
                    />
                  </FormGroup>
                </div>
              </>
            )}

            {activeTab === 'settings' && (
              <>
                <FormGroup>
                  <Label>Nome Interno</Label>
                  <Input 
                    value={config.name} 
                    onChange={e => setConfig({ ...config, name: e.target.value })} 
                    placeholder="Es. Promo Estate"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>Stato</Label>
                  <ToggleSwitch>
                    <SwitchInput 
                      type="checkbox" 
                      checked={config.is_active}
                      onChange={e => setConfig({ ...config, is_active: e.target.checked })}
                    />
                    <span>Popup Attivo</span>
                  </ToggleSwitch>
                </FormGroup>

                <SectionTitle style={{ marginTop: 24 }}>Trigger</SectionTitle>
                <FormGroup>
                  <Label>Ritardo comparsa (secondi)</Label>
                  <Input 
                    type="number" 
                    min="0"
                    value={config.trigger_delay || 0} 
                    onChange={e => {
                      const delay = Number(e.target.value);
                      setConfig({ 
                        ...config, 
                        trigger_delay: delay,
                        trigger_type: delay > 0 ? 'delay' : 'onload'
                      });
                    }}
                    placeholder="0 = subito"
                  />
                  <div style={{ marginTop: 4, fontSize: 13, color: '#6b7280' }}>
                    0 = appare subito al caricamento della pagina
                  </div>
                </FormGroup>
                
                <FormGroup>
                  <Label>Frequenza</Label>
                  <Select 
                    value={config.frequency} 
                    onChange={e => setConfig({ ...config, frequency: e.target.value })}
                  >
                    <option value="always">Sempre (ogni volta che ricarica)</option>
                    <option value="once_per_session">Una volta per sessione</option>
                  </Select>
                </FormGroup>
              </>
            )}
          </SidebarContent>
        </Sidebar>

        <PreviewArea>
          <PopupOverlay bgColor={config.style_config.overlayColor}>
            <PopupCard 
              bgColor={config.style_config.backgroundColor} 
              borderRadius={String(config.style_config.borderRadius)}
              padding={String(config.style_config.padding)}
              width={String(config.style_config.width)}
            >
              <CloseButton color={config.style_config.closeButtonColor || '#000'}>&times;</CloseButton>
              
              {config.blocks.map((block) => (
                <BlockContainer 
                  key={block.id} 
                  marginBottom={block.props.marginBottom} 
                  align={block.props.align || 'center'}
                  selected={selectedBlockId === block.id}
                  onClick={() => setSelectedBlockId(block.id)}
                >
                  {renderPreviewBlock(block)}
                </BlockContainer>
              ))}
              
              {config.blocks.length === 0 && (
                <div style={{ padding: 20, border: '2px dashed #e5e7eb', borderRadius: 8, color: '#9ca3af' }}>
                  Aggiungi dei blocchi dal menu laterale
                </div>
              )}
            </PopupCard>
          </PopupOverlay>
        </PreviewArea>
      </Container>
    </div>
  );
};

export default PopupBuilder;