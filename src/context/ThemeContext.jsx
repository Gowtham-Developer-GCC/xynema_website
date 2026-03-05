import React, { createContext, useContext, useEffect, useState } from 'react';

export const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // Check local storage or system preference on initial load
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const html = window.document.documentElement;
        const body = window.document.body;

        if (isDarkMode) {
            html.classList.add('dark');
            body.classList.add('dark');
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            html.classList.remove('dark');
            body.classList.remove('dark');
            html.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(prev => !prev);

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
