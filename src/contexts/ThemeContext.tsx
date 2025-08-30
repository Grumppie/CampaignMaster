import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Theme {
  id: string;
  name: string;
  description: string;
  isCustom?: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Classic D&D',
    description: 'Purple and gold theme',
    colors: {
      primary: '#1a0b2e',
      secondary: '#2d1b69',
      accent: '#d4af37',
      background: '#1a0b2e',
      surface: 'rgba(26, 11, 46, 0.9)',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.8)'
    }
  },
  {
    id: 'forest',
    name: 'Forest Realm',
    description: 'Green and brown theme',
    colors: {
      primary: '#0f2e1a',
      secondary: '#1b4d2e',
      accent: '#8bc34a',
      background: '#0f2e1a',
      surface: 'rgba(15, 46, 26, 0.9)',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.8)'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean Depths',
    description: 'Blue and teal theme',
    colors: {
      primary: '#0b1a2e',
      secondary: '#1b2d4d',
      accent: '#00bcd4',
      background: '#0b1a2e',
      surface: 'rgba(11, 26, 46, 0.9)',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.8)'
    }
  },
  {
    id: 'fire',
    name: 'Fire Realm',
    description: 'Red and orange theme',
    colors: {
      primary: '#2e0b0b',
      secondary: '#4d1b1b',
      accent: '#ff5722',
      background: '#2e0b0b',
      surface: 'rgba(46, 11, 11, 0.9)',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.8)'
    }
  },
  {
    id: 'ice',
    name: 'Ice Kingdom',
    description: 'White and blue theme',
    colors: {
      primary: '#0b1a2e',
      secondary: '#1b2d4d',
      accent: '#81c784',
      background: '#0b1a2e',
      surface: 'rgba(11, 26, 46, 0.9)',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.8)'
    }
  }
];

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
  addCustomTheme: (theme: Omit<Theme, 'id'>) => void;
  deleteCustomTheme: (themeId: string) => void;
  updateCustomTheme: (themeId: string, updates: Partial<Theme>) => void;
  editTheme: (themeId: string, updatedTheme: Omit<Theme, 'id'>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [customThemes, setCustomThemes] = useState<Theme[]>(() => {
    const saved = localStorage.getItem('customThemes');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    // Get theme from localStorage or default to 'default'
    const savedTheme = localStorage.getItem('selectedTheme');
    const allThemes = [...themes, ...customThemes];
    return allThemes.find(theme => theme.id === savedTheme) || themes[0];
  });

  // Combine built-in and custom themes
  const allThemes = [...themes, ...customThemes];

  const setTheme = (themeId: string) => {
    const theme = allThemes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('selectedTheme', themeId);
    }
  };

  const addCustomTheme = (theme: Omit<Theme, 'id'>) => {
    const newTheme: Theme = {
      ...theme,
      id: `custom-${Date.now()}`,
      isCustom: true
    };
    const updatedCustomThemes = [...customThemes, newTheme];
    setCustomThemes(updatedCustomThemes);
    localStorage.setItem('customThemes', JSON.stringify(updatedCustomThemes));
  };

  const deleteCustomTheme = (themeId: string) => {
    const updatedCustomThemes = customThemes.filter(theme => theme.id !== themeId);
    setCustomThemes(updatedCustomThemes);
    localStorage.setItem('customThemes', JSON.stringify(updatedCustomThemes));
    
    // If the deleted theme was the current theme, switch to default
    if (currentTheme.id === themeId) {
      setCurrentTheme(themes[0]);
      localStorage.setItem('selectedTheme', themes[0].id);
    }
  };

  const updateCustomTheme = (themeId: string, updates: Partial<Theme>) => {
    const updatedCustomThemes = customThemes.map(theme => 
      theme.id === themeId ? { ...theme, ...updates } : theme
    );
    setCustomThemes(updatedCustomThemes);
    localStorage.setItem('customThemes', JSON.stringify(updatedCustomThemes));
    
    // Update current theme if it's the one being updated
    if (currentTheme.id === themeId) {
      setCurrentTheme({ ...currentTheme, ...updates });
    }
  };

  const editTheme = (themeId: string, updatedTheme: Omit<Theme, 'id'>) => {
    // Check if it's a system theme
    const isSystemTheme = themes.some(theme => theme.id === themeId);
    
    if (isSystemTheme) {
      // For system themes, create a new custom theme based on the edited version
      const newCustomTheme: Theme = {
        ...updatedTheme,
        id: `custom-${Date.now()}`,
        isCustom: true,
        name: `${updatedTheme.name} (Custom)`,
        description: `${updatedTheme.description} - Modified version`
      };
      
      const updatedCustomThemes = [...customThemes, newCustomTheme];
      setCustomThemes(updatedCustomThemes);
      localStorage.setItem('customThemes', JSON.stringify(updatedCustomThemes));
      
      // If the edited theme was the current theme, switch to the new custom version
      if (currentTheme.id === themeId) {
        setCurrentTheme(newCustomTheme);
        localStorage.setItem('selectedTheme', newCustomTheme.id);
      }
    } else {
      // For custom themes, update directly
      const updatedCustomThemes = customThemes.map(theme => 
        theme.id === themeId ? { ...theme, ...updatedTheme } : theme
      );
      setCustomThemes(updatedCustomThemes);
      localStorage.setItem('customThemes', JSON.stringify(updatedCustomThemes));
      
      // If the edited theme was the current theme, update it
      if (currentTheme.id === themeId) {
        setCurrentTheme({ ...currentTheme, ...updatedTheme });
      }
    }
  };

  // Apply theme to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    
    // Set basic theme colors
    root.style.setProperty('--primary-color', currentTheme.colors.primary);
    root.style.setProperty('--secondary-color', currentTheme.colors.secondary);
    root.style.setProperty('--accent-color', currentTheme.colors.accent);
    root.style.setProperty('--background-color', currentTheme.colors.background);
    root.style.setProperty('--surface-color', currentTheme.colors.surface);
    root.style.setProperty('--text-color', currentTheme.colors.text);
    root.style.setProperty('--text-secondary-color', currentTheme.colors.textSecondary);
    
    // Set legacy colors for backward compatibility
    root.style.setProperty('--primary-purple', currentTheme.colors.primary);
    root.style.setProperty('--secondary-gold', currentTheme.colors.accent);
    root.style.setProperty('--accent-blue', currentTheme.colors.secondary);
    root.style.setProperty('--dark-bg', currentTheme.colors.background);
    root.style.setProperty('--light-text', currentTheme.colors.text);
    root.style.setProperty('--card-bg', currentTheme.colors.surface);
    
    // Set dynamic gradient effects
    root.style.setProperty('--gradient-start', currentTheme.colors.primary);
    root.style.setProperty('--gradient-end', currentTheme.colors.secondary);
    root.style.setProperty('--accent-gradient-start', currentTheme.colors.accent);
    root.style.setProperty('--accent-gradient-end', currentTheme.colors.accent);
    root.style.setProperty('--gold-gradient-start', currentTheme.colors.accent);
    root.style.setProperty('--gold-gradient-end', currentTheme.colors.accent);
    
    // Set dynamic shadow colors
    root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
    root.style.setProperty('--accent-shadow-color', `${currentTheme.colors.accent}40`); // 25% opacity
    root.style.setProperty('--accent-glow-color', `${currentTheme.colors.accent}99`); // 60% opacity
    
    // Set dynamic border colors
    root.style.setProperty('--border-color', `${currentTheme.colors.accent}4D`); // 30% opacity
    root.style.setProperty('--border-accent', `${currentTheme.colors.accent}4D`); // 30% opacity
    root.style.setProperty('--border-accent-hover', `${currentTheme.colors.accent}99`); // 60% opacity
    root.style.setProperty('--border-accent-focus', `${currentTheme.colors.accent}CC`); // 80% opacity
    
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      setTheme, 
      themes: allThemes,
      addCustomTheme,
      deleteCustomTheme,
      updateCustomTheme,
      editTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
