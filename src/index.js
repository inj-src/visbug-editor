/**
 * visbug-editor - Core editing features extracted from VisBug
 *
 * A framework-agnostic library for inline visual editing.
 * Provides tools for position, text, font, and image editing
 * with undo/redo support.
 *
 * @module visbug-editor
 */

// Import components to register custom elements
import "./components/index.js";

export { VisBugEditor } from "./VisBugEditor.js";
export { HistoryManager } from "./features/history.js";

// Re-export utilities for advanced usage
export * as utilities from "./utilities/index.js";

// Version
export const VERSION = "0.1.0";
