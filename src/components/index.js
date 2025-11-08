/**
 * Selection Components Index
 *
 * These are Web Components that provide visual feedback for the selection system.
 * Import these to register the custom elements.
 */

// Import components - they self-register via customElements.define()
import "./handle.element.js";
import "./handles.element.js";
import "./label.element.js";
import "./hover.element.js";
import "./overlay.element.js";
import "./offscreenLabel.element.js";

// Also export the classes for advanced usage
export { Handle } from "./handle.element.js";
export { Handles } from "./handles.element.js";
export { Label } from "./label.element.js";
export { Hover } from "./hover.element.js";
export { Overlay } from "./overlay.element.js";
export { OffscreenLabel } from "./offscreenLabel.element.js";
