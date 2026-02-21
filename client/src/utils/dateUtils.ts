export function formatMessageDate(date: Date, t: (key: any) => string): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Сбрасываем время для сравнения только дат
  const messageDate = new Date(date)
  messageDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  yesterday.setHours(0, 0, 0, 0)

  if (messageDate.getTime() === today.getTime()) {
    return t('today')
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return t('yesterday')
  } else {
    // Форматируем дату: "15 января"
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long'
    })
  }
}

export function groupMessagesByDate(messages: any[]): { date: string; messages: any[] }[] {
  const groups: { [key: string]: any[] } = {}

  messages.forEach(msg => {
    const date = new Date(msg.created_at)
    const dateKey = date.toDateString() // Уникальный ключ для каждого дня

    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(msg)
  })

  // Преобразуем в массив и сортируем по дате
  return Object.entries(groups)
    .map(([dateKey, messages]) => ({
      date: dateKey,
      messages: messages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
