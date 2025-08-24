import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage'; // We'll use your powerful hook

export const useTheme = () => {
    // 1. Use your existing useLocalStorage hook to store the theme preference.
    // It defaults to 'light'.
    const { value: theme, setValue: setTheme } = useLocalStorage('theme', 'light');

    // 2. An effect that runs whenever the theme state changes.
    useEffect(() => {
        const root = window.document.documentElement;

        // Remove the old theme class and add the new one.
        root.classList.remove('light', 'dark');
        root.classList.add(theme);

    }, [theme]); // Only re-run if the theme changes

    // 3. A helper function to easily toggle the theme.
    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return { theme, toggleTheme };
};