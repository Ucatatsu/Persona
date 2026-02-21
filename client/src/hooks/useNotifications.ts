import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isEnabled, setIsEnabled] = useState(false)
  const { user } = useAuthStore()

  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window) {
      setPermission(Notification.permission)
      
      // Load saved preference
      const saved = localStorage.getItem('notifications-enabled')
      setIsEnabled(saved === 'true' && Notification.permission === 'granted')
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        setIsEnabled(true)
        localStorage.setItem('notifications-enabled', 'true')
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  const toggleNotifications = async () => {
    if (!isEnabled && permission !== 'granted') {
      const granted = await requestPermission()
      return granted
    }
    
    const newState = !isEnabled
    setIsEnabled(newState)
    localStorage.setItem('notifications-enabled', String(newState))
    return newState
  }

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!isEnabled || permission !== 'granted') return

    try {
      const notification = new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        ...options,
      })

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000)

      return notification
    } catch (error) {
      console.error('Failed to show notification:', error)
    }
  }

  const showMessageNotification = (
    senderName: string,
    messageText: string,
    onClick?: () => void
  ) => {
    const notification = showNotification(senderName, {
      body: messageText,
      tag: `message-${Date.now()}`,
      requireInteraction: false,
    })

    if (notification && onClick) {
      notification.onclick = () => {
        window.focus()
        onClick()
        notification.close()
      }
    }
  }

  return {
    permission,
    isEnabled,
    requestPermission,
    toggleNotifications,
    showNotification,
    showMessageNotification,
  }
}
