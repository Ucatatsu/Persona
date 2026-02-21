import { create } from 'zustand';

interface CallState {
  isCallActive: boolean;
  isMinimized: boolean;
  callType: 'audio' | 'video' | null;
  callingUser: {
    id: string;
    username: string;
    avatar_url?: string;
  } | null;
  isMuted: boolean;
  isVideoOff: boolean;
  callDuration: number;
  startCall: (userId: string, username: string, avatar_url: string | undefined, type: 'audio' | 'video') => void;
  endCall: () => void;
  minimizeCall: () => void;
  maximizeCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  setCallDuration: (duration: number) => void;
}

export const useCallStore = create<CallState>((set) => ({
  isCallActive: false,
  isMinimized: false,
  callType: null,
  callingUser: null,
  isMuted: false,
  isVideoOff: false,
  callDuration: 0,
  
  startCall: (userId, username, avatar_url, type) => set({
    isCallActive: true,
    isMinimized: false,
    callType: type,
    callingUser: { id: userId, username, avatar_url },
    isMuted: false,
    isVideoOff: false,
    callDuration: 0,
  }),
  
  endCall: () => set({
    isCallActive: false,
    isMinimized: false,
    callType: null,
    callingUser: null,
    isMuted: false,
    isVideoOff: false,
    callDuration: 0,
  }),
  
  minimizeCall: () => set({ isMinimized: true }),
  maximizeCall: () => set({ isMinimized: false }),
  
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleVideo: () => set((state) => ({ isVideoOff: !state.isVideoOff })),
  
  setCallDuration: (duration) => set({ callDuration: duration }),
}));
