import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, ZoomIn } from 'lucide-react'

interface MessageImageProps {
  url: string
  alt?: string
}

export default function MessageImage({ url, alt = 'Image' }: MessageImageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleDownload = async () => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `image-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Failed to download image:', error)
    }
  }

  return (
    <>
      {/* Thumbnail in message */}
      <div className="relative group max-w-xs cursor-pointer" onClick={() => setIsFullscreen(true)}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-lg">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={url}
          alt={alt}
          className="rounded-lg max-h-64 w-auto object-cover"
          onLoad={() => setIsLoading(false)}
          loading="lazy"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
          <ZoomIn className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Fullscreen viewer */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsFullscreen(false)}
          >
            {/* Controls */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload()
                }}
                className="p-3 glass-hover rounded-xl transition-all hover:scale-110"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-3 glass-hover rounded-xl transition-all hover:scale-110"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image */}
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={url}
              alt={alt}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
