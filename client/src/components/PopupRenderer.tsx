import React, { useMemo } from 'react';
import styled, { css } from 'styled-components';

// Styled Components
const PopupOverlay = styled.div<{ bgColor: string; isPreview: boolean }>`
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ bgColor }) => bgColor};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: ${({ isPreview }) => (isPreview ? 1 : 9999)};
  
  ${({ isPreview }) => isPreview ? css`
    position: absolute;
  ` : css`
    position: fixed;
    animation: fadeIn 0.3s ease-out;
  `}

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const PopupCard = styled.div<{ 
  bgColor: string; 
  borderRadius: string;
  padding: string;
  width: string;
  isPreview: boolean;
}>`
  background-color: ${({ bgColor }) => bgColor};
  border-radius: ${({ borderRadius }) => borderRadius}px;
  padding: ${({ padding }) => padding}px;
  width: 100%;
  max-width: ${({ width }) => width}px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  max-height: ${({ isPreview }) => isPreview ? '100%' : '90vh'};
  overflow-y: auto;
  
  ${({ isPreview }) => !isPreview && css`
    animation: slideUp 0.3s ease-out;
  `}

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
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
  padding: 0;
  line-height: 1;
  
  &:hover {
    opacity: 1;
  }
`;

// Block Components
const BlockContainer = styled.div<{ marginBottom: number; align: string }>`
  margin-bottom: ${({ marginBottom }) => marginBottom}px;
  text-align: ${({ align }) => align};
  width: 100%;
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
  display: inline-block;
`;

const VideoBlock = styled.video<{ width: string; borderRadius: number }>`
  width: ${({ width }) => width};
  max-width: 100%;
  height: auto;
  border-radius: ${({ borderRadius }) => borderRadius}px;
  display: inline-block;
`;

const ButtonBlock = styled.a<{ bgColor: string; textColor: string; borderRadius: number; width: string }>`
  display: inline-block;
  background-color: ${({ bgColor }) => bgColor};
  color: ${({ textColor }) => textColor};
  padding: 12px 24px;
  border-radius: ${({ borderRadius }) => borderRadius}px;
  text-decoration: none;
  font-weight: 600;
  width: ${({ width }) => width === '100%' ? '100%' : 'auto'};
  text-align: center;
  border: none;
  transition: opacity 0.2s;
  cursor: pointer;
  
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

interface Block {
  id: string;
  type: 'heading' | 'text' | 'image' | 'video' | 'button' | 'spacer' | 'divider';
  props: any;
}

interface PopupRendererProps {
  popup: any;
  onClose: () => void;
  isPreview?: boolean;
}

const PopupRenderer: React.FC<PopupRendererProps> = ({ popup, onClose, isPreview = false }) => {
  const { config, blocks } = useMemo(() => {
    let parsedStyle = {};
    try {
      parsedStyle = typeof popup.style_config === 'string' 
        ? JSON.parse(popup.style_config) 
        : (popup.style_config || {});
    } catch (e) {
      console.error("Error parsing style config", e);
    }

    // Default style values
    const styleConfig = {
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 32,
      width: 400,
      closeButtonColor: '#1f2937',
      ...parsedStyle
    };

    let parsedBlocks: Block[] = [];
    try {
      parsedBlocks = typeof popup.blocks === 'string' 
        ? JSON.parse(popup.blocks) 
        : (popup.blocks || []);
    } catch (e) {
      console.error("Error parsing blocks", e);
    }

    // Migration for legacy content
    if (parsedBlocks.length === 0 && (popup.title || popup.body_text)) {
      if (popup.image_url) parsedBlocks.push({ id: 'img-1', type: 'image', props: { url: popup.image_url, width: '100%', borderRadius: 8, marginBottom: 16 } });
      if (popup.title) parsedBlocks.push({ id: 'head-1', type: 'heading', props: { text: popup.title, fontSize: 24, color: '#1f2937', align: 'center', marginBottom: 12 } });
      if (popup.body_text) parsedBlocks.push({ id: 'txt-1', type: 'text', props: { text: popup.body_text, fontSize: 16, color: '#4b5563', align: 'center', marginBottom: 24 } });
      if (popup.button_text) parsedBlocks.push({ id: 'btn-1', type: 'button', props: { text: popup.button_text, link: popup.button_link, backgroundColor: '#3b82f6', textColor: '#ffffff', borderRadius: 8, width: '100%', align: 'center', marginBottom: 0 } });
    }

    return { config: styleConfig, blocks: parsedBlocks };
  }, [popup]);

  const renderBlock = (block: Block) => {
    const { type, props } = block;

    switch (type) {
      case 'heading':
        return <HeadingBlock {...props}>{props.text}</HeadingBlock>;
      case 'text':
        return <TextBlock {...props}>{props.text}</TextBlock>;
      case 'image':
        return <ImageBlock {...props} src={props.url} alt="Popup Image" />;
      case 'video':
        return (
          <VideoBlock 
            {...props} 
            src={props.url} 
            controls 
            autoPlay={props.autoplay} 
            muted={props.autoplay} // Muted is usually required for autoplay
            loop={props.loop}
          />
        );
      case 'button':
        return <ButtonBlock {...props} href={props.link}>{props.text}</ButtonBlock>;
      case 'spacer':
        return <SpacerBlock {...props} />;
      case 'divider':
        return <DividerBlock {...props} />;
      default:
        return null;
    }
  };

  return (
    <PopupOverlay bgColor={config.overlayColor} isPreview={isPreview} onClick={onClose}>
      <PopupCard 
        bgColor={config.backgroundColor} 
        borderRadius={String(config.borderRadius)}
        padding={String(config.padding)}
        width={String(config.width)}
        isPreview={isPreview}
        onClick={e => e.stopPropagation()}
      >
        <CloseButton color={config.closeButtonColor} onClick={onClose}>&times;</CloseButton>
        
        {blocks.map((block) => (
          <BlockContainer 
            key={block.id} 
            marginBottom={block.props.marginBottom} 
            align={block.props.align || 'center'}
          >
            {renderBlock(block)}
          </BlockContainer>
        ))}
      </PopupCard>
    </PopupOverlay>
  );
};

export default PopupRenderer;
