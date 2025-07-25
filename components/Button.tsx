import React from 'react';

const Button = ({ children, onClick, disabled, Icon, size, className, variant }: { children: React.ReactNode, onClick: () => void, disabled?: boolean, Icon?: React.ElementType, size?: string, className?: string, variant?: string }) => {
  return (
    <button onClick={onClick} disabled={disabled} className={className}>
      {Icon && <Icon />}
      {children}
    </button>
  );
};

export default Button;
