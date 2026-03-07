class WebSocketService {
  private ws: WebSocket | null = null
  private isConnecting = false

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  connect(token: string) {
    // Если уже подключены или подключаемся, не создаём новое подключение
    if (this.isConnected() || this.isConnecting) {
      console.log('Already connected or connecting')
      return this
    }

    this.isConnecting = true
    
    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080'}/api/ws?token=${token}`
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected')
      this.isConnecting = false
      this.reconnectAttempts = 0 // Reset reconnect attempts on successful connection
    }

    this.ws.onclose = () => {
      console.log('❌ WebSocket disconnected')
      this.isConnecting = false
      this.attemptReconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.isConnecting = false
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleMessage(data)
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    }

    return this
  }

  private reconnectTimeout: number | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 2000

  private attemptReconnect() {
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached. Please refresh the page.')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * this.reconnectAttempts
    console.log(`Reconnecting in ${delay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    this.reconnectTimeout = setTimeout(() => {
      const token = localStorage.getItem('token')
      if (token) {
        this.connect(token)
      }
    }, delay) as unknown as number
  }

  private messageHandlers: { [key: string]: ((data: any) => void)[] } = {}

  private handleMessage(data: any) {
    const handlers = this.messageHandlers[data.type] || []
    handlers.forEach(handler => handler(data))
  }

  disconnect() {
    console.log('Manually disconnecting WebSocket')
    
    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    // Reset reconnect attempts
    this.reconnectAttempts = 0
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnecting = false
  }

  sendMessage(receiverId: string, text: string, replyToId?: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected. Cannot send message.')
      return false
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'send_message',
        receiver_id: receiverId,
        text,
        reply_to_id: replyToId,
      }))
      return true
    } catch (error) {
      console.error('Failed to send message:', error)
      return false
    }
  }

  sendTypingStart(receiverId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'typing_start',
        receiver_id: receiverId,
      }))
    } catch (error) {
      console.error('Failed to send typing start:', error)
    }
  }

  sendTypingStop(receiverId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'typing_stop',
        receiver_id: receiverId,
      }))
    } catch (error) {
      console.error('Failed to send typing stop:', error)
    }
  }

  markMessagesAsRead(senderId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'mark_read',
        sender_id: senderId,
      }))
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.messageHandlers[event]) {
      this.messageHandlers[event] = []
    }
    this.messageHandlers[event].push(callback)
  }

  off(event: string, callback?: (data: any) => void) {
    if (!callback) {
      delete this.messageHandlers[event]
      return
    }

    const handlers = this.messageHandlers[event] || []
    this.messageHandlers[event] = handlers.filter(h => h !== callback)
  }

  onNewMessage(callback: (message: any) => void) {
    this.on('new_message', callback)
  }

  onOnlineUsers(callback: (data: any) => void) {
    this.on('online_users', callback)
  }

  onTypingStart(callback: (data: any) => void) {
    this.on('typing_start', callback)
  }

  onTypingStop(callback: (data: any) => void) {
    this.on('typing_stop', callback)
  }

  onMessagesRead(callback: (data: any) => void) {
    this.on('messages_read', callback)
  }

  getSocket() {
    return this.ws
  }
}

export const wsService = new WebSocketService()
