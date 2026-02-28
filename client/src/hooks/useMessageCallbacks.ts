import { useCallback } from 'react'

export const useMessageCallbacks = (
  setReplyingTo: (msg: any) => void,
  setContextMenu: (menu: any) => void,
  scrollToMessage: (id: string) => void,
  handleReaction: (msgId: string, emoji: string) => void,
  messageRefs: React.MutableRefObject<Map<string, HTMLDivElement>>
) => {
  const onReply = useCallback((msg: any) => {
    setReplyingTo(msg)
  }, [setReplyingTo])

  const onContextMenu = useCallback((e: React.MouseEvent, msg: any) => {
    e.preventDefault()
    const x = e.clientX
    const y = e.clientY
    const menuWidth = 180
    const menuHeight = 200
    const adjustedX = x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : x
    const adjustedY = y + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : y
    setContextMenu({
      message: msg,
      position: { x: adjustedX, y: adjustedY }
    })
  }, [setContextMenu])

  const onScrollToMessage = useCallback((id: string) => {
    scrollToMessage(id)
  }, [scrollToMessage])

  const onReaction = useCallback((msgId: string, emoji: string) => {
    handleReaction(msgId, emoji)
  }, [handleReaction])

  const setMessageRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      messageRefs.current.set(id, el)
    } else {
      messageRefs.current.delete(id)
    }
  }, [messageRefs])

  return {
    onReply,
    onContextMenu,
    onScrollToMessage,
    onReaction,
    setMessageRef
  }
}
