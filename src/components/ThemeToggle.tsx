"use client";

export const THEME_KEY = "aetherion:theme";

/**
 * Runs in <head> before first paint so a saved light theme never flashes dark.
 * Dark stays the default when nothing (or something invalid) is stored.
 */
export const themeInitScript = `try{if(localStorage.getItem("${THEME_KEY}")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

/**
 * Both icons are always rendered and CSS picks one from `data-theme`, so the
 * server markup never disagrees with the theme the init script applied.
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Preference just won't persist (private mode, blocked storage).
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-text"
      aria-label="Toggle light and dark theme"
      title="Toggle theme"
    >
      <svg viewBox="0 0 24 24" className="size-4 light:hidden" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
      <svg viewBox="0 0 24 24" className="hidden size-4 light:block" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
