/**
 * Simplified scheme utilities for visbug-core
 * Theme management for Shadow DOM components
 */

export const schemeRule = (shadow, style, light, dark) => {
  // Simplified version without importing theme styles
  // This can be extended when we add the selection components
  return (attr) => {
    if (attr === "light" && light) {
      shadow.adoptedStyleSheets = [style, light];
    } else if (attr === "dark" && dark) {
      shadow.adoptedStyleSheets = [style, dark];
    } else {
      shadow.adoptedStyleSheets = [style];
    }
  };
};

/**
 * Get the current color scheme preference
 * @returns {string} 'light' or 'dark'
 */
export const getColorScheme = () => {
  if (typeof window === "undefined") return "light";

  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

/**
 * Watch for color scheme changes
 * @param {Function} callback - Called when scheme changes
 * @returns {Function} Cleanup function to stop watching
 */
export const watchColorScheme = (callback) => {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handler = (e) => {
    callback(e.matches ? "dark" : "light");
  };

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }
  // Fallback for older browsers
  else if (mediaQuery.addListener) {
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }

  return () => {};
};
