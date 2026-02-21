import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Notification {
  id: string;
  senderName: string;
  senderAvatar?: string;
  messageText: string;
  timestamp: number;
}

interface NotificationIslandProps {
  className?: string;
}

/**
 * Динамический остров для уведомлений (внутри хедера)
 * Показывает уведомления о сообщениях в стиле основного хедера
 */
export const NotificationIsland: React.FC<NotificationIslandProps> = ({ className = '' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const { senderName, senderAvatar, messageText } = event.detail;
      
      const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        senderName,
        senderAvatar,
        messageText,
        timestamp: Date.now(),
      };

      setNotifications(prev => [newNotification, ...prev].slice(0, 3));

      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    };

    window.addEventListener('show-notification-island', handleNotification as EventListener);

    return () => {
      window.removeEventListener('show-notification-island', handleNotification as EventListener);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <AnimatePresence mode="popLayout">
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 25,
              }
            }}
            exit={{ 
              opacity: 0, 
              x: 100, 
              scale: 0.9,
              transition: {
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1] // Custom cubic-bezier for smoother exit
              }
            }}
            className="glass rounded-2xl cursor-pointer relative overflow-hidden"
            style={{
              width: '280px',
              minHeight: '80px',
            }}
            onClick={() => removeNotification(notif.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="p-4 flex items-center gap-3">
              <div className="flex-shrink-0">
                {notif.senderAvatar ? (
                  <img
                    src={notif.senderAvatar}
                    alt={notif.senderName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-white font-semibold text-sm">
                    {notif.senderName[0].toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm mb-1 truncate">
                  {notif.senderName}
                </p>
                <p className="text-white/70 text-sm line-clamp-2">
                  {notif.messageText}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notif.id);
                }}
                className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
