import React from 'react';
import MuiAvatar from '@mui/material/Avatar';
import { styled } from '@mui/material/styles';

export type Size = 'small' | 'medium' | 'large';

const sizeStyles = {
  small: {
    width: '24px',
    height: '24px',
    fontSize: '12px',
  },
  medium: {
    width: '40px',
    height: '40px',
    fontSize: '14px',
  },
  large: {
    width: '56px',
    height: '56px',
    fontSize: '16px',
  },
};

const StyledAvatar = styled(MuiAvatar)<{ size: Size }>(({ size }) => ({
  ...sizeStyles[size],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  whiteSpace: 'nowrap', // Prevent text from wrapping
  writingMode: 'horizontal-tb', // Ensure horizontal text direction
  lineHeight: 'normal', // Ensure normal line height
}));

export const Avatar: React.FC<{ title: string; size?: Size }> = ({ title, size = 'medium' }) => (
  <StyledAvatar alt={title} size={size}>
    {title.slice(0, 2)}
  </StyledAvatar>
);
