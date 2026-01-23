import LanguageSelector from './languageSelector'
import TranslatableText from './translatableText'
import styles from '../styles/Header.module.css';
import Link from 'next/link';
import React from 'react';

function getPreferredTheme() {
    if (typeof window === 'undefined') return 'dark';
    try {
        const stored = localStorage.getItem('theme');
        if (stored === 'light' || stored === 'dark') return stored;
    } catch (e) {
        // ignore
    }
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
}

export default function Header() {
    const [theme, setTheme] = React.useState('dark');

    React.useEffect(() => {
        const current = document.documentElement.dataset.theme;
        if (current === 'light' || current === 'dark') {
            setTheme(current);
            return;
        }
        const preferred = getPreferredTheme();
        document.documentElement.dataset.theme = preferred;
        setTheme(preferred);
    }, []);

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = nextTheme;
        setTheme(nextTheme);
        try {
            localStorage.setItem('theme', nextTheme);
        } catch (e) {
            // ignore
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.inner}>
                <div className={styles.left}>
                    <TranslatableText identifier="header.selector.language" className={styles.languageLabel}></TranslatableText>
                    <LanguageSelector className={styles.languageSelect} />
                </div>

                <nav className={styles.nav} aria-label="Primary">
                    <Link className={styles.navButton} href="/items">
                        <TranslatableText identifier="index.pages.items.title" />
                    </Link>
                    <Link className={styles.navButton} href="/builder">
                        <TranslatableText identifier="index.pages.builder.title" />
                    </Link>
                </nav>

                <div className={styles.right}>
                    <button
                        type="button"
                        className={styles.themeToggle}
                        onClick={toggleTheme}
                        aria-label="Toggle light/dark theme"
                        aria-pressed={theme === 'light'}
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {theme === 'dark' ? 'Light' : 'Dark'}
                    </button>
                    <span className={styles.translateCta}>
                        <b>Want to help translate?</b> Visit the{' '}
                        <a className={styles.link} rel="noopener noreferrer" href="https://crowdin.com/project/ohthemisery" target="_blank">Crowdin Project</a>!
                    </span>
                </div>
            </div>
        </header>
    )
}