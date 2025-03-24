import React from 'react';
import IconProps from './types/icon-type';

const SortIcon: React.FC<IconProps> = ({ size = '20', color = 'currentColor', ...attributes }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...attributes}>
      <path
        d="M6.5 8.5L9.5 5.5L12.5 8.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 11.5L9.5 14.5L12.5 11.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SortIcon;
