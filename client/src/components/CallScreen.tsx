import React, { useEffect } from 'react';
import { Video, Mic, MicOff, VideoOff, X, Minimize2 } from 'lucide-react';
import { useCallStore } from '../store/callStore';

/**
 * Полноэкранный экран звонка
 * Хедер - обычный статичный, при minimize сворачивается с анимацией разделения
 */
export const CallScreen: React.FC = () => {
  const { 
    isCallActive, 
    isMinimized, 
    callType, 
    callingUser, 
    isMuted,
    isVideoOff,
    callDuration,
    endCall, 
    minimizeCall,
    toggleMute,
    toggleVideo,
    setCallDuration
  } = useCallStore();

  // Таймер звонка
  useEffect(() => {
    if (!isCallActive) return;

    const interval = setInterval(() => {
      setCallDuration(callDuration + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCallActive, callDuration, setCallDuration]);

  if (!isCallActive) return null;

  // Если звонок свёрнут - ничего не показываем (хедер в Chat.tsx)
  if (isMinimized) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* ОСНОВНОЙ КОНТЕНТ звонка */}
      <div className="flex flex-col items-center justify-center h-full pt-24 pb-12">
        <div className="flex flex-col items-center justify-center h-full pt-24 pb-12">
          {/* Аватар */}
          <div className="mb-8">
            {callingUser?.avatar_url ? (
              <img
                src={callingUser.avatar_url}
                alt={callingUser.username}
                className="w-32 h-32 rounded-full object-cover border-4 border-white/20"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-5xl font-bold border-4 border-white/20">
                {callingUser?.username[0].toUpperCase()}
              </div>
            )}
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">{callingUser?.username}</h2>
          <p className="text-lg text-gray-300 mb-8">{callType === 'video' ? 'Video Call' : 'Voice Call'}</p>

          {/* Видео превью */}
          {callType === 'video' && !isVideoOff && (
            <div className="relative w-full max-w-4xl aspect-video bg-gray-800 rounded-2xl overflow-hidden mb-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <Video className="w-16 h-16 text-white/30" />
              </div>
              <div className="absolute top-4 right-4 w-48 aspect-video bg-gray-700 rounded-xl overflow-hidden border-2 border-white/20">
                <div className="flex items-center justify-center h-full">
                  <div className="text-white/50 text-sm">Your video</div>
                </div>
              </div>
            </div>
          )}

          {/* Кнопки управления */}
          <div className="flex items-center gap-6">
            <button
              onClick={toggleMute}
              className={`p-6 rounded-full transition-all ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'}`}
            >
              {isMuted ? <MicOff className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
            </button>

            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`p-6 rounded-full transition-all ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'}`}
              >
                {isVideoOff ? <VideoOff className="w-7 h-7 text-white" /> : <Video className="w-7 h-7 text-white" />}
              </button>
            )}

            <button onClick={minimizeCall} className="p-6 rounded-full bg-white/10 hover:bg-white/20 transition-all">
              <Minimize2 className="w-7 h-7 text-white" />
            </button>

            <button onClick={endCall} className="p-6 rounded-full bg-red-500 hover:bg-red-600 transition-all">
              <X className="w-7 h-7 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
