import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useCallStore } from '../store/callStore';

interface CallHeaderProps {
  className?: string;
}

/**
 * Компактный динамический остров (внутри хедера)
 * Минимизированный звонок в стиле основного хедера
 */
export const CallHeader: React.FC<CallHeaderProps> = ({ className = '' }) => {
  const { isMinimized, callingUser, maximizeCall } = useCallStore();

  const handleClick = () => {
    maximizeCall();
  };

  return (
    <AnimatePresence mode="wait">
      {isMinimized && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: -50 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            x: 0,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 25,
              duration: 0.5
            }
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.8, 
            x: -50,
            transition: {
              duration: 0.3,
              ease: "easeInOut"
            }
          }}
          className={`cursor-pointer glass rounded-2xl transition-all hover:scale-105 ${className}`}
          onClick={handleClick}
          style={{
            width: '140px',
            height: '80px',
            boxShadow: '0 0 0 2px rgba(105, 240, 174, 0.5)',
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center gap-3 px-4">
            {/* Аватар */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: 1, 
                rotate: 0,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 20,
                  delay: 0.2
                }
              }}
            >
              {callingUser?.avatar_url ? (
                <img
                  src={callingUser.avatar_url}
                  alt={callingUser.username}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div 
                  className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center text-white font-semibold text-base flex-shrink-0"
                >
                  {callingUser?.username[0].toUpperCase()}
                </div>
              )}
            </motion.div>

            {/* Имя */}
            <motion.div 
              className="text-white text-sm font-medium truncate flex-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                transition: {
                  delay: 0.3,
                  duration: 0.3
                }
              }}
            >
              {callingUser?.username}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
