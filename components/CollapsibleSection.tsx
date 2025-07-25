import React, { useState } from 'react';

const CollapsibleSection = ({ title, Icon, children, defaultOpen, isOpen, setIsOpen }: { title: string, Icon?: React.ElementType, children: React.ReactNode, defaultOpen?: boolean, isOpen?: boolean, setIsOpen?: (isOpen: boolean) => void }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen || false);

  const toggleOpen = () => {
    if (setIsOpen) {
      setIsOpen(!isOpen);
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const currentIsOpen = isOpen !== undefined ? isOpen : internalIsOpen;

  return (
    <div>
      <h3 onClick={toggleOpen} style={{ cursor: 'pointer' }}>
        {Icon && <Icon />}
        {title}
      </h3>
      {currentIsOpen && <div>{children}</div>}
    </div>
  );
};

export default CollapsibleSection;
