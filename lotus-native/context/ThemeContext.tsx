import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, darkColors } from '../lib/theme';

type ColorSet = {
  bg: string; bg2: string; bg3: string; line: string; surface: string;
  text: string; text2: string; text3: string;
  accent: string; accentBg: string; accentDk: string;
  green: string; greenBg: string; blue: string; blueBg: string;
  red: string; redBg: string;
};

interface ThemeContextValue {
  dark: boolean;
  colors: ColorSet;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  dark: false,
  colors,
  toggleDark: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const scheme = useColorScheme();
  const [dark, setDark] = useState(scheme === 'dark');

  useEffect(() => {
    AsyncStorage.getItem('settings:theme').then(val => {
      if (val === 'dark') setDark(true);
      else if (val === 'light') setDark(false);
      else setDark(scheme === 'dark');
    });
  }, []);

  const toggleDark = async () => {
    const next = !dark;
    setDark(next);
    await AsyncStorage.setItem('settings:theme', next ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ dark, colors: dark ? darkColors : colors, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
