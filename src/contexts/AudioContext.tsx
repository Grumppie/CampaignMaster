import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import backgroundMusic from '../assets/background-theme.mp3';

interface AudioContextType {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  toggle: () => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
};

interface AudioProviderProps {
  children: React.ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false); // Start as false since auto-play might be blocked
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1.0);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Listen for user interaction to enable audio
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!hasUserInteracted && audioRef.current) {
        console.log('User interaction detected, attempting to start audio');
        setHasUserInteracted(true);
        audioRef.current.play().then(() => {
          console.log('Audio started on user interaction');
          setIsPlaying(true);
        }).catch((error) => {
          console.log('Failed to start audio on user interaction:', error);
        });
      }
    };

    // Listen for various user interactions
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [hasUserInteracted]);

  useEffect(() => {
    console.log('Creating global audio element');
    
    // Create new audio element
    const audio = new Audio(backgroundMusic);
    audio.loop = true;
    audio.volume = volume;
    audio.preload = 'auto';
    
    // Store reference
    audioRef.current = audio;

    // Add event listeners
    const handleCanPlay = () => {
      console.log('Audio canplay - ready to play');
      // Try to auto-play when ready
      audio.play().then(() => {
        console.log('Auto-play started successfully');
        setIsPlaying(true);
      }).catch((error) => {
        console.log('Auto-play failed (this is normal in modern browsers):', error);
        setIsPlaying(false);
      });
    };
    const handlePlay = () => {
      console.log('Audio play event fired');
      setIsPlaying(true);
    };
    const handlePause = () => {
      console.log('Audio pause event fired');
      setIsPlaying(false);
    };
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      console.log('Cleaning up global audio element');
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      audioRef.current = null;
    };
  }, []);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      console.log('Setting global volume to:', volume);
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggle = () => {
    console.log('Global toggle called, current state:', isPlaying);
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          console.error('Audio play failed:', error);
        });
      }
    }
  };

  const setAudioVolume = (newVolume: number) => {
    console.log('Setting global audio volume to:', newVolume);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const mute = () => {
    console.log('Global mute called');
    setPreviousVolume(volume);
    setVolume(0);
    setIsMuted(true);
  };

  const unmute = () => {
    console.log('Global unmute called, restoring volume to:', previousVolume);
    setVolume(previousVolume);
    setIsMuted(false);
  };

  const value: AudioContextType = {
    isPlaying,
    volume,
    isMuted,
    toggle,
    setVolume: setAudioVolume,
    mute,
    unmute
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};
