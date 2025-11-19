import React from 'react';
import styled from 'styled-components';
import logoSvg from '../../assets/logos/logo.svg';

interface LogoProps {
  size?: number;
  className?: string;
}

const LogoImage = styled.img<{ size: number }>`
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  object-fit: contain;
`;

const Logo: React.FC<LogoProps> = ({ size = 40, className }) => {
  return (
    <LogoImage 
      src={logoSvg} 
      alt="Menu Manager Logo" 
      size={size}
      className={className}
    />
  );
};

export default Logo;