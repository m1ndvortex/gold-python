/**
 * Collapsible Component
 * Expandable/collapsible content component
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface CollapsibleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface CollapsibleTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface CollapsibleContentProps {
  className?: string;
  children: React.ReactNode;
}

const CollapsibleContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {}
});

export const Collapsible: React.FC<CollapsibleProps> = ({ open, onOpenChange, children }) => {
  return (
    <CollapsibleContext.Provider value={{ open, onOpenChange }}>
      <div>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
};

export const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({ asChild, children }) => {
  const { open, onOpenChange } = React.useContext(CollapsibleContext);

  const handleClick = () => {
    onOpenChange(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      'aria-expanded': open,
      'aria-controls': 'collapsible-content'
    });
  }

  return (
    <button
      onClick={handleClick}
      aria-expanded={open}
      aria-controls="collapsible-content"
    >
      {children}
    </button>
  );
};

export const CollapsibleContent: React.FC<CollapsibleContentProps> = ({ 
  className, 
  children 
}) => {
  const { open } = React.useContext(CollapsibleContext);
  const [height, setHeight] = React.useState<number | undefined>(open ? undefined : 0);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(open ? contentHeight : 0);
    }
  }, [open]);

  return (
    <div
      id="collapsible-content"
      className={cn(
        'overflow-hidden transition-all duration-200 ease-in-out',
        className
      )}
      style={{ height }}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};