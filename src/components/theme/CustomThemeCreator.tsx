import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './CustomThemeCreator.css';

interface CustomThemeCreatorProps {
  onClose: () => void;
}

export const CustomThemeCreator: React.FC<CustomThemeCreatorProps> = ({ onClose }) => {
  const { addCustomTheme } = useTheme();
  const [themeData, setThemeData] = useState({
    name: '',
    description: '',
    colors: {
      primary: '#1a0b2e',
      secondary: '#2d1b69',
      accent: '#d4af37',
      background: '#1a0b2e',
      surface: 'rgba(26, 11, 46, 0.9)',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.8)'
    }
  });

  // Auto-generate secondary colors based on primary and accent
  const generateSecondaryColors = (primary: string, accent: string) => {
    // Create a darker version of primary for secondary
    const secondary = primary;
    // Create a semi-transparent version of primary for surface
    const surface = primary.replace(')', ', 0.9)').replace('rgb', 'rgba');
    // Create a lighter version of text for secondary text
    const textSecondary = 'rgba(255, 255, 255, 0.8)';
    
    return { secondary, surface, textSecondary };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('color-')) {
      const colorKey = name.replace('color-', '') as keyof typeof themeData.colors;
      setThemeData(prev => {
        const newColors = {
          ...prev.colors,
          [colorKey]: value
        };
        
        // Auto-generate secondary colors when primary or accent changes
        if (colorKey === 'primary' || colorKey === 'accent') {
          const secondaryColors = generateSecondaryColors(newColors.primary, newColors.accent);
          return {
            ...prev,
            colors: {
              ...newColors,
              ...secondaryColors
            }
          };
        }
        
        return {
          ...prev,
          colors: newColors
        };
      });
    } else {
      setThemeData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeData.name.trim()) {
      alert('Please enter a theme name');
      return;
    }
    
    addCustomTheme(themeData);
    onClose();
  };

  const colorFields = [
    { key: 'primary', label: 'Primary Color', description: 'Main theme color' },
    { key: 'accent', label: 'Accent Color', description: 'Highlight color for buttons and important elements' },
    { key: 'text', label: 'Text Color', description: 'Main text color' }
  ];

  return (
    <div className="custom-theme-creator-overlay">
      <div className="custom-theme-creator-modal">
        <div className="modal-header">
          <h2>Create Custom Theme</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <form onSubmit={handleSubmit} className="theme-form">
          <div className="form-section">
            <h3>Theme Information</h3>
            <div className="form-group">
              <label htmlFor="name">Theme Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={themeData.name}
                onChange={handleInputChange}
                placeholder="Enter theme name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <input
                type="text"
                id="description"
                name="description"
                value={themeData.description}
                onChange={handleInputChange}
                placeholder="Describe your theme"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Color Palette</h3>
            <div className="color-grid">
              {colorFields.map(({ key, label, description }) => (
                <div key={key} className="color-field">
                  <label htmlFor={`color-${key}`}>
                    {label}
                    <span className="color-description">{description}</span>
                  </label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      id={`color-${key}`}
                      name={`color-${key}`}
                      value={themeData.colors[key as keyof typeof themeData.colors]}
                      onChange={handleInputChange}
                    />
                    <input
                      type="text"
                      value={themeData.colors[key as keyof typeof themeData.colors]}
                      onChange={handleInputChange}
                      name={`color-${key}`}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3>Preview</h3>
            <div 
              className="theme-preview"
              style={{
                backgroundColor: themeData.colors.background,
                color: themeData.colors.text
              }}
            >
              <div className="preview-title">
                <h4 style={{ color: themeData.colors.accent }}>Theme Preview</h4>
              </div>
              
              <div className="simple-color-preview">
                <div className="color-preview-item">
                  <div 
                    className="color-circle"
                    style={{ backgroundColor: themeData.colors.primary }}
                  ></div>
                  <span>Primary</span>
                </div>
                
                <div className="color-preview-item">
                  <div 
                    className="color-circle"
                    style={{ backgroundColor: themeData.colors.accent }}
                  ></div>
                  <span>Accent</span>
                </div>
                
                <div className="color-preview-item">
                  <div 
                    className="color-circle"
                    style={{ backgroundColor: themeData.colors.text }}
                  ></div>
                  <span>Text</span>
                </div>
              </div>
              
              <div className="text-preview">
                <p style={{ color: themeData.colors.text }}>
                  Sample text with your selected colors
                </p>
                <p style={{ color: themeData.colors.textSecondary }}>
                  Secondary text example
                </p>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Theme
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
