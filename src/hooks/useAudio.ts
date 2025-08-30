import { useState, useEffect, useRef } from 'react';

export const useAudio = (src: string) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    console.log('Creating audio element with src:', src);
    
    // Create new audio element
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    audio.preload = 'auto';
    
    // Store reference
    audioRef.current = audio;

    // Add event listeners for debugging and state management
    const handleLoadStart = () => console.log('Audio loadstart');
    const handleCanPlay = () => {
      console.log('Audio canplay - ready to play');
      // Auto-play when ready
      audio.play().then(() => {
        console.log('Auto-play started successfully');
        setIsPlaying(true);
      }).catch((error) => {
        console.log('Auto-play failed:', error);
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
    const handleEnded = () => {
      console.log('Audio ended');
      setIsPlaying(false);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      console.log('Cleaning up audio element');
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      audioRef.current = null;
    };
  }, [src]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      console.log('Setting volume to:', volume);
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const play = async () => {
    if (audioRef.current) {
      try {
        console.log('Attempting to play audio');
        await audioRef.current.play();
        console.log('Audio started playing successfully');
      } catch (error) {
        console.error('Audio play failed:', error);
        setIsPlaying(false);
      }
    } else {
      console.error('No audio element available');
    }
  };

  const pause = () => {
    if (audioRef.current) {
      console.log('Pausing audio');
      audioRef.current.pause();
    }
  };

  const toggle = () => {
    console.log('Toggle called, current state:', isPlaying);
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const setAudioVolume = (newVolume: number) => {
    console.log('Setting audio volume to:', newVolume);
    setVolume(newVolume);
    // Immediately apply volume change to audio element
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return {
    isPlaying,
    volume,
    play,
    pause,
    toggle,
    setVolume: setAudioVolume
  };
};
