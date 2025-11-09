/**
 * Type definitions for visbug-editor
 *
 * A framework-agnostic library for inline visual editing.
 * Provides tools for position, text, font, and image editing
 * with undo/redo support.
 */

export const VERSION: string;

// ============================================================================
// Main Editor Class
// ============================================================================

/**
 * Configuration options for VisBugEditor
 */
export interface VisBugEditorOptions {
  /**
   * The container element whose children will be editable
   */
  container: HTMLElement;

  /**
   * Where to append editor UI elements (labels, handles, overlays):
   * - undefined (default): Append to document.body
   * - 'inside': Append to the container element
   */
  mode?: 'inside';

  /**
   * Initial tool to activate
   * @default 'position'
   */
  initialTool?: 'position' | 'text' | 'font';

  /**
   * Callback when tool changes
   */
  onToolChange?: (tool: string) => void;

  /**
   * Callback when selection changes
   */
  onSelectionChange?: (elements: HTMLElement[]) => void;

  /**
   * Callback when any edit is made
   */
  onChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;

  /**
   * Async callback for handling image uploads
   * Should return the URL of the uploaded image
   */
  onImageUpload?: (file: File) => Promise<string>;

  /**
   * Custom styles for editor UI
   */
  styles?: Record<string, string>;

  /**
   * Whether to clear history when setContent is called
   * @default true
   */
  clearHistoryOnSetContent?: boolean;
}

/**
 * Main editor class for the visbug-editor library
 *
 * @example
 * ```typescript
 * const editor = new VisBugEditor({
 *   container: document.getElementById('editable-area'),
 *   mode: 'shadowDOM',
 *   initialTool: 'position',
 *   onToolChange: (tool) => console.log('Tool changed:', tool),
 * });
 * ```
 */
export class VisBugEditor {
  /**
   * The container element
   */
  readonly container: HTMLElement;

  /**
   * Container mode
   */
  readonly mode: 'inside' | undefined;

  /**
   * Initial tool name
   */
  readonly initialTool: string;

  /**
   * Configuration options
   */
  readonly options: VisBugEditorOptions;

  /**
   * Currently active tool
   */
  readonly currentTool: string | null;

  /**
   * History manager instance
   */
  readonly historyManager: HistoryManager;

  /**
   * Whether the editor is initialized
   */
  readonly isInitialized: boolean;

  /**
   * Create a new VisBugEditor instance
   */
  constructor(options: VisBugEditorOptions);

  /**
   * Activate a specific editing tool
   */
  activateTool(toolName: "position" | "text" | "font"): void;

  /**
   * Get the currently active tool
   */
  getCurrentTool(): string | null;

  /**
   * Select a specific element
   */
  selectElement(element: HTMLElement): void;

  /**
   * Select multiple elements
   */
  selectElements(elements: HTMLElement[]): void;

  /**
   * Get currently selected elements
   */
  getSelectedElements(): HTMLElement[];

  /**
   * Clear current selection
   */
  clearSelection(): void;

  /**
   * Undo the last change
   * @returns True if undo was successful
   */
  undo(): boolean;

  /**
   * Redo the last undone change
   * @returns True if redo was successful
   */
  redo(): boolean;

  /**
   * Check if undo is available
   */
  canUndo(): boolean;

  /**
   * Check if redo is available
   */
  canRedo(): boolean;

  /**
   * Get the history array
   */
  getHistory(): Change[];

  /**
   * Clear the history
   */
  clearHistory(): void;

  /**
   * Get clean HTML content (without editor UI elements)
   */
  getContent(): string;

  /**
   * Set content (replaces all user content)
   */
  setContent(htmlString: string): void;

  /**
   * Add event listener
   */
  on(eventName: string, callback: Function): void;

  /**
   * Remove event listener
   */
  off(eventName: string, callback: Function): void;

  /**
   * Destroy the editor and clean up
   */
  destroy(): void;
}

// ============================================================================
// History System
// ============================================================================

/**
 * Options for HistoryManager
 */
export interface HistoryManagerOptions {
  /**
   * Maximum number of changes to keep in history
   * @default 50
   */
  maxSize?: number;

  /**
   * Time in milliseconds to merge similar changes
   * @default 1000
   */
  mergeTimeout?: number;
}

/**
 * Manages undo/redo history for editor changes
 */
export class HistoryManager {
  /**
   * Maximum size of the undo stack
   */
  readonly maxSize: number;

  /**
   * Timeout for merging similar changes
   */
  readonly mergeTimeout: number;

  /**
   * Create a new HistoryManager instance
   */
  constructor(options?: HistoryManagerOptions);

  /**
   * Add event listener
   */
  on(event: "change", callback: (state: any) => void): void;

  /**
   * Remove event listener
   */
  off(event: "change", callback: (state: any) => void): void;

  /**
   * Record a change
   */
  push(change: Change | Change[]): void;

  /**
   * Begin batch mode for multiple related changes
   */
  beginBatch(): void;

  /**
   * End batch mode and record all changes as one
   */
  endBatch(): void;

  /**
   * Undo the last change
   * @returns True if undo was successful
   */
  undo(): boolean;

  /**
   * Redo the last undone change
   * @returns True if redo was successful
   */
  redo(): boolean;

  /**
   * Check if undo is available
   */
  canUndo(): boolean;

  /**
   * Check if redo is available
   */
  canRedo(): boolean;

  /**
   * Get the current history state
   */
  getHistory(): Change[];

  /**
   * Clear all history
   */
  clear(): void;
}

/**
 * Base class for all changes
 */
export abstract class Change {
  /**
   * The type of change
   */
  readonly type: string;

  /**
   * Undo this change
   */
  abstract undo(): void;

  /**
   * Redo this change
   */
  abstract redo(): void;

  /**
   * Check if this change can be merged with another
   */
  canMerge(other: Change): boolean;

  /**
   * Merge this change with another
   */
  merge(other: Change): Change;
}

/**
 * A style change on an element
 */
export class StyleChange extends Change {
  readonly element: HTMLElement;
  readonly property: string;
  readonly oldValue: string;
  readonly newValue: string;

  constructor(element: HTMLElement, property: string, oldValue: string, newValue: string);
}

/**
 * A text content change
 */
export class TextChange extends Change {
  readonly element: HTMLElement;
  readonly oldValue: string;
  readonly newValue: string;

  constructor(element: HTMLElement, oldValue: string, newValue: string);
}

/**
 * An attribute change
 */
export class AttributeChange extends Change {
  readonly element: HTMLElement;
  readonly attribute: string;
  readonly oldValue: string | null;
  readonly newValue: string | null;

  constructor(
    element: HTMLElement,
    attribute: string,
    oldValue: string | null,
    newValue: string | null
  );
}

/**
 * A batch of multiple changes
 */
export class BatchChange extends Change {
  readonly changes: Change[];

  constructor(changes: Change[]);
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Utility functions exported by visbug-editor
 */
export namespace utilities {
  /**
   * Color utilities
   */
  export namespace colors {
    export function hex2hsl(hex: string): [number, number, number];
    export function hex2rgb(hex: string): [number, number, number];
    export function rgb2hex(r: number, g: number, b: number): string;
    export function hsl2hex(h: number, s: number, l: number): string;
  }

  /**
   * Common utilities
   */
  export namespace common {
    export function getStyle(el: HTMLElement, prop: string): string;
    export function setStyle(el: HTMLElement, prop: string, value: string): void;
    export function getComputedStyles(el: HTMLElement): CSSStyleDeclaration;
  }

  /**
   * Number utilities
   */
  export namespace numbers {
    export function clamp(value: number, min: number, max: number): number;
    export function roundToNearest(value: number, nearest: number): number;
  }

  /**
   * String utilities
   */
  export namespace strings {
    export function camelToKebab(str: string): string;
    export function kebabToCamel(str: string): string;
  }

  /**
   * Design property utilities
   */
  export namespace designProperties {
    export function getSelectorEngine(el: HTMLElement): string;
    export function combineNodeNameAndClass(el: HTMLElement): string;
  }
}

// ============================================================================
// Custom Elements (automatically registered)
// ============================================================================

/**
 * Custom element for selection handles
 */
declare global {
  interface HTMLElementTagNameMap {
    "visbug-handles": HTMLElement;
    "visbug-handle": HTMLElement;
    "visbug-label": HTMLElement;
    "visbug-hover": HTMLElement;
    "visbug-overlay": HTMLElement;
  }
}

export {};
