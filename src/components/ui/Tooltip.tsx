import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 200,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const getTooltipPosition = () => {
    switch (placement) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowPosition = () => {
    switch (placement) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900 border-t-4 border-l-transparent border-r-transparent border-l-4 border-r-4';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900 border-b-4 border-l-transparent border-r-transparent border-l-4 border-r-4';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900 border-l-4 border-t-transparent border-b-transparent border-t-4 border-b-4';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900 border-r-4 border-t-transparent border-b-transparent border-t-4 border-b-4';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900 border-t-4 border-l-transparent border-r-transparent border-l-4 border-r-4';
    }
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 ${getTooltipPosition()}`}
          >
            <div className="bg-gray-900 text-white text-sm px-2 py-1 rounded shadow-lg max-w-xs">
              {content}
              <div className={`absolute w-0 h-0 ${getArrowPosition()}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;