import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage'; // We'll use your powerful hook

export const useTheme = () => {
    // 1. Use your existing useLocalStorage hook to store the theme preference.
    const { value: theme, setValue: setTheme } = useLocalStorage('theme', 'light');

    // 2. An effect that runs whenever the theme state changes.
    useEffect(() => {
        const root = window.document.documentElement;

        // Add the theme class when the component mounts
        root.classList.remove('light', 'dark'); // Remove previous theme classes
        root.classList.add(theme); // Add the new theme class (either 'light' or 'dark')

        // Optionally, you could also set a `data-theme` attribute for Tailwind's theme handling
        root.setAttribute('data-theme', theme);

    }, [theme]); // Only re-run if the theme changes

    // 3. A helper function to easily toggle the theme.
    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return { theme, toggleTheme };
};