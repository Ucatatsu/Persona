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

  private attemptReconnect() {
    // Не переподключаемся автоматически - только вручную
    console.log('WebSocket closed. Not auto-reconnecting.')
    return
    
    /* Закомментировано автопереподключение
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      if (this.token) {
        this.connect(this.token)
      }
    }, this.reconnectDelay * this.reconnectAttempts)
    */
  }

  private messageHandlers: { [key: string]: ((data: any) => void)[] } = {}

  private handleMessage(data: any) {
    const handlers = this.messageHandlers[data.type] || []
    handlers.forEach(handler => handler(data))
  }

  disconnect() {
    console.log('Manually disconnecting WebSocket')
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnecting = false
  }

  sendMessage(receiverId: string, text: string, replyToId?: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected')
      return
    }

    this.ws.send(JSON.stringify({
      type: 'send_message',
      receiver_id: receiverId,
      text,
      reply_to_id: replyToId,
    }))
  }

  sendTypingStart(receiverId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    this.ws.send(JSON.stringify({
      type: 'typing_start',
      receiver_id: receiverId,
    }))
  }

  sendTypingStop(receiverId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    this.ws.send(JSON.stringify({
      type: 'typing_stop',
      receiver_id: receiverId,
    }))
  }

  markMessagesAsRead(senderId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    this.ws.send(JSON.stringify({
      type: 'mark_read',
      sender_id: senderId,
    }))
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
