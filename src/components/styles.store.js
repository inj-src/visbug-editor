/**
 * Styles Store for visbug-core selection components
 *
 * This module creates CSSStyleSheet objects from imported CSS
 * for use with Shadow DOM adoptedStyleSheets.
 */

import handles_css from "../styles/handles.element.css";
import handle_css from "../styles/handle.element.css";
import hover_css from "../styles/hover.element.css";
import label_css from "../styles/label.element.css";
import overlay_css from "../styles/overlay.element.css";
import offscreenLabel_css from "../styles/offscreenLabel.element.css";

/**
 * Create a CSSStyleSheet from CSS string
 * @param {string} styles - CSS string
 * @returns {CSSStyleSheet}
 */
const constructStylesheet = (styles) => {
  const stylesheet = new CSSStyleSheet();
  stylesheet.replaceSync(styles);
  return stylesheet;
};

// Export stylesheets for components
export const HandlesStyles = constructStylesheet(handles_css);
export const HandleStyles = constructStylesheet(handle_css);
export const HoverStyles = constructStylesheet(hover_css);
export const LabelStyles = constructStylesheet(label_css);
export const OverlayStyles = constructStylesheet(overlay_css);
export const OffscreenLabelStyles = constructStylesheet(offscreenLabel_css);

// Theme support (simplified - no theme switching for now)
// These can be expanded later if theme support is needed
export const LightTheme = new CSSStyleSheet();
export const DarkTheme = new CSSStyleSheet();
