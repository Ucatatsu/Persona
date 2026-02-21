import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Image as ImageIcon, File, Loader } from 'lucide-react'
import api from '../services/api'
import { useTranslation } from '../hooks/useTranslation'

interface FileUploadProps {
  onFileUploaded: (url: string, type: 'image' | 'file') => void
  onClose: () => void
}

export default function FileUpload({ onFileUploaded, onClose }: FileUploadProps) {
  const { t } = useTranslation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(t('fileTooLarge'))
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError(t('onlyImages'))
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await api.post('/api/messages/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const fileType = selectedFile.type.startsWith('image/') ? 'image' : 'file'
      onFileUploaded(response.data.url, fileType)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || t('uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass rounded-2xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">{t('uploadFile')}</h3>
            <button
              onClick={onClose}
              className="p-2 glass-hover rounded-xl transition-all hover:scale-110"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Preview or select button */}
          {!selectedFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 glass-hover rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 transition-all hover:border-accent"
            >
              <ImageIcon className="w-12 h-12 text-white/40" />
              <p className="text-white/60">{t('selectFile')}</p>
              <p className="text-xs text-white/40">{t('uploadHint')}</p>
            </button>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              {preview && (
                <div className="relative rounded-xl overflow-hidden">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      setPreview(null)
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-xl hover:bg-black/70 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* File info */}
              <div className="flex items-center gap-3 p-3 glass rounded-xl">
                <File className="w-5 h-5 text-accent" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-white/60">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedFile(null)
                    setPreview(null)
                    setError(null)
                  }}
                  className="flex-1 btn-secondary"
                  disabled={uploading}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleUpload}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      {t('uploading')}
                    </>
                  ) : (
                    t('upload')
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
