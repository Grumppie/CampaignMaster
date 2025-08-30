import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './CustomThemeCreator.css';

interface CustomThemeCreatorProps {
  onClose: () => void;
  editingTheme?: {
    id: string;
    name: string;
    description: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
    };
  };
}

export const CustomThemeCreator: React.FC<CustomThemeCreatorProps> = ({ onClose, editingTheme }) => {
  const { addCustomTheme, editTheme } = useTheme();
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

  // Initialize form with editing theme data if provided
  useEffect(() => {
    if (editingTheme) {
      setThemeData({
        name: editingTheme.name,
        description: editingTheme.description,
        colors: editingTheme.colors
      });
    }
  }, [editingTheme]);

  const isEditing = !!editingTheme;

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
    
    if (isEditing) {
      editTheme(editingTheme!.id, themeData);
    } else {
      addCustomTheme(themeData);
    }
    onClose();
  };

  const colorFields = [
    { key: 'primary', label: 'Primary Color', description: 'Main theme color for backgrounds and containers' },
    { key: 'secondary', label: 'Secondary Color', description: 'Secondary background color for cards and sections' },
    { key: 'accent', label: 'Accent Color', description: 'Highlight color for buttons, borders, and important elements' },
    { key: 'background', label: 'Background Color', description: 'Main page background color' },
    { key: 'surface', label: 'Surface Color', description: 'Color for modal backgrounds and overlays' },
    { key: 'text', label: 'Text Color', description: 'Main text color for headings and body text' },
    { key: 'textSecondary', label: 'Secondary Text Color', description: 'Color for secondary text and descriptions' }
  ];

  return (
    <div className="custom-theme-creator-overlay">
      <div className="custom-theme-creator-modal">
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Custom Theme' : 'Create Custom Theme'}</h2>
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
            <h3>Live Preview</h3>
            <div 
              className="theme-preview"
              style={{
                backgroundColor: themeData.colors.background,
                color: themeData.colors.text,
                overflowY: 'auto'
              }}
            >
              <div className="preview-title">
                <h4 style={{ color: themeData.colors.accent }}>Theme Preview</h4>
              </div>
              
              <div className="simple-color-preview">
                {colorFields.map(({ key, label }) => (
                  <div key={key} className="color-preview-item">
                    <div 
                      className="color-circle"
                      style={{ backgroundColor: themeData.colors[key as keyof typeof themeData.colors] }}
                    ></div>
                    <span>{label.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
              
              <div className="ui-elements-preview">
                <h5 style={{ color: themeData.colors.accent }}>UI Elements Preview</h5>
                
                {/* Header Preview */}
                <div className="preview-section">
                  <h6 style={{ color: themeData.colors.text }}>Header</h6>
                  <div 
                    className="preview-header"
                    style={{ backgroundColor: themeData.colors.surface }}
                  >
                    <span style={{ color: themeData.colors.accent }}>D&D Campaign Tracker</span>
                    <button 
                      className="preview-btn"
                      style={{ 
                        backgroundColor: themeData.colors.accent,
                        color: themeData.colors.primary
                      }}
                    >
                      Settings
                    </button>
                  </div>
                </div>

                {/* Card Preview */}
                <div className="preview-section">
                  <h6 style={{ color: themeData.colors.text }}>Cards & Containers</h6>
                  <div 
                    className="preview-card"
                    style={{ 
                      backgroundColor: themeData.colors.surface,
                      borderColor: themeData.colors.accent
                    }}
                  >
                    <h3 style={{ color: themeData.colors.accent }}>Sample Card</h3>
                    <p style={{ color: themeData.colors.text }}>This is how cards will look with your theme.</p>
                    <p style={{ color: themeData.colors.textSecondary }}>Secondary text example</p>
                  </div>
                </div>

                {/* Button Preview */}
                <div className="preview-section">
                  <h6 style={{ color: themeData.colors.text }}>Buttons</h6>
                  <div className="preview-buttons">
                    <button 
                      type="button"
                      className="preview-btn primary"
                      onClick={(e) => e.preventDefault()}
                      style={{ 
                        backgroundColor: themeData.colors.accent,
                        color: themeData.colors.primary
                      }}
                    >
                      Primary Button
                    </button>
                    <button 
                      type="button"
                      className="preview-btn secondary"
                      onClick={(e) => e.preventDefault()}
                      style={{ 
                        backgroundColor: 'transparent',
                        color: themeData.colors.text,
                        borderColor: themeData.colors.accent
                      }}
                    >
                      Secondary Button
                    </button>
                  </div>
                </div>

                {/* Form Preview */}
                <div className="preview-section">
                  <h6 style={{ color: themeData.colors.text }}>Form Elements</h6>
                  <div className="preview-form">
                    <input 
                      type="text"
                      placeholder="Sample input field"
                      className="preview-input"
                      style={{ 
                        backgroundColor: themeData.colors.background,
                        color: themeData.colors.text,
                        borderColor: themeData.colors.accent
                      }}
                    />
                    <select 
                      className="preview-select"
                      style={{ 
                        backgroundColor: themeData.colors.background,
                        color: themeData.colors.text,
                        borderColor: themeData.colors.accent
                      }}
                    >
                      <option>Sample dropdown</option>
                    </select>
                  </div>
                </div>

                {/* Navigation Preview */}
                <div className="preview-section">
                  <h6 style={{ color: themeData.colors.text }}>Navigation</h6>
                  <div 
                    className="preview-nav"
                    style={{ backgroundColor: themeData.colors.surface }}
                  >
                    <a 
                      href="#"
                      className="preview-nav-link"
                      style={{ color: themeData.colors.accent }}
                    >
                      Dashboard
                    </a>
                    <a 
                      href="#"
                      className="preview-nav-link"
                      style={{ color: themeData.colors.textSecondary }}
                    >
                      Campaigns
                    </a>
                    <a 
                      href="#"
                      className="preview-nav-link"
                      style={{ color: themeData.colors.textSecondary }}
                    >
                      Settings
                    </a>
                  </div>
                </div>

                {/* Status Elements */}
                <div className="preview-section">
                  <h6 style={{ color: themeData.colors.text }}>Status Elements</h6>
                  <div className="preview-status">
                    <span 
                      className="preview-status-success"
                      style={{ 
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        color: '#2ecc71',
                        borderColor: '#2ecc71'
                      }}
                    >
                      Success Message
                    </span>
                    <span 
                      className="preview-status-error"
                      style={{ 
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        color: '#e74c3c',
                        borderColor: '#e74c3c'
                      }}
                    >
                      Error Message
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? 'Save Changes' : 'Create Theme'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
