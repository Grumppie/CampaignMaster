import React, { useState, useEffect, useRef } from 'react';
import { useAudioContext } from '../../contexts/AudioContext';
import './AudioControls.css';

export const AudioControls: React.FC = () => {
  const { isPlaying, volume, isMuted, toggle, setVolume, mute, unmute } = useAudioContext();
  const [showVolume, setShowVolume] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeRef.current && !volumeRef.current.contains(event.target as Node)) {
        setShowVolume(false);
      }
    };

    if (showVolume) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolume]);

  const handleToggle = () => {
    if (isMuted) {
      // If muted, unmute
      unmute();
    } else if (isPlaying) {
      // If playing, mute
      mute();
    } else {
      // If not playing, start playing
      toggle();
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  const handleVolumeButtonClick = () => {
    setShowVolume(!showVolume);
  };

  // Determine the icon to show
  const getAudioIcon = () => {
    if (isMuted) {
      return '🔇'; // Muted
    } else if (isPlaying) {
      return '🔊'; // Playing
    } else {
      return '⏸️'; // Paused/stopped
    }
  };

  // Determine the title text
  const getAudioTitle = () => {
    if (isMuted) {
      return 'Unmute';
    } else if (isPlaying) {
      return 'Mute';
    } else {
      return 'Play Music';
    }
  };

  return (
    <div className="audio-controls">
      <button 
        className={`audio-toggle-btn ${isPlaying ? 'playing' : 'paused'} ${isMuted ? 'muted' : ''}`}
        onClick={handleToggle}
        title={getAudioTitle()}
      >
        {getAudioIcon()}
      </button>
      
      <div className="volume-controls" ref={volumeRef}>
        <button 
          className="volume-slider-btn"
          onClick={handleVolumeButtonClick}
          title="Volume Control"
        >
          ⚙️
        </button>
        
        {showVolume && (
          <div className="volume-slider-container">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="volume-slider"
              title="Volume"
            />
            <span className="volume-value">{Math.round(volume * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
