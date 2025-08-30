import React, { useState } from 'react';
import { useAudioContext } from '../contexts/AudioContext';
import { useTheme } from '../contexts/ThemeContext';
import { CustomThemeCreator } from '../components/theme/CustomThemeCreator';
import './Settings.css';

export const Settings: React.FC = () => {
  const { isPlaying, volume, toggle, setVolume } = useAudioContext();
  const { currentTheme, setTheme, themes, deleteCustomTheme } = useTheme();
  const [showThemeCreator, setShowThemeCreator] = useState(false);
  const [editingTheme, setEditingTheme] = useState<any>(null);

  const handleThemeChange = (themeId: string) => {
    setTheme(themeId);
  };

  const handleDeleteTheme = (themeId: string, themeName: string) => {
    if (window.confirm(`Are you sure you want to delete the theme "${themeName}"?`)) {
      deleteCustomTheme(themeId);
    }
  };

  const handleEditTheme = (theme: any) => {
    setEditingTheme(theme);
    setShowThemeCreator(true);
  };

  const handleCloseThemeCreator = () => {
    setShowThemeCreator(false);
    setEditingTheme(null);
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>

        <div className="settings-section">
          <div className="section-header">
            <h2 className="section-title">Theme Settings</h2>
            <button 
              onClick={() => setShowThemeCreator(true)}
              className="create-theme-btn"
            >
              ✨ Create Custom Theme
            </button>
          </div>
          <div className="theme-grid">
            {themes.map((theme) => (
              <div 
                key={theme.id}
                className={`theme-option ${currentTheme.id === theme.id ? 'selected' : ''}`}
              >
                <div 
                  className="settings-theme-preview"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                  }}
                ></div>
                <h3>{theme.name}</h3>
                <p>{theme.description}</p>
                <div className="theme-actions">
                  <button
                    onClick={() => handleThemeChange(theme.id)}
                    className="apply-theme-btn"
                  >
                    {currentTheme.id === theme.id ? '✓ Applied' : 'Apply'}
                  </button>
                  <button
                    onClick={() => handleEditTheme(theme)}
                    className="edit-theme-btn"
                    title="Edit theme"
                  >
                    ✏️
                  </button>
                  {theme.isCustom && (
                    <button
                      onClick={() => handleDeleteTheme(theme.id, theme.name)}
                      className="delete-theme-btn"
                      title="Delete theme"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {showThemeCreator && (
        <CustomThemeCreator 
          editingTheme={editingTheme} 
          onClose={handleCloseThemeCreator} 
        />
      )}
    </div>
  );
};
