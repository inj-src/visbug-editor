/**
 * VisBugEditor - Main editor class for the visbug-core library
 *
 * This class manages the editing environment for a container element,
 * providing tools for positioning, text editing, font manipulation, and image swapping.
 *
 * @example
 * const editor = new VisBugEditor({
 *   container: document.getElementById('editable-area'),
 *   mode: 'shadowDOM',
 *   initialTool: 'position',
 *   onToolChange: (tool) => console.log('Tool changed:', tool),
 * });
 */

import { HistoryManager } from "./features/history.js";
import { Selectable } from "./features/selectable.js";
import { Position } from "./features/position.js";
import { EditText } from "./features/text.js";
import { Font } from "./features/font.js";
import {
  watchImagesForUpload,
  setHistoryManager as setImageSwapHistoryManager,
} from "./features/imageswap.js";

export class VisBugEditor {
  /**
   * Create a new VisBugEditor instance
   *
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - The container element whose children will be editable
   * @param {string} [options.mode] - Where to append editor UI elements: undefined (body) or 'inside' (container)
   * @param {string} [options.initialTool='position'] - Initial tool to activate
   * @param {Function} [options.onToolChange] - Callback when tool changes
   * @param {Function} [options.onSelectionChange] - Callback when selection changes
   * @param {Function} [options.onChange] - Callback when any edit is made
   * @param {Function} [options.onImageUpload] - Async callback for handling image uploads
   * @param {Object} [options.styles] - Custom styles for editor UI
   * @param {boolean} [options.clearHistoryOnSetContent=true] - Whether to clear history when setContent is called
   */
  constructor(options = {}) {
    // Validate required options
    if (!options.container) {
      throw new Error("VisBugEditor requires a container element");
    }

    // Store configuration
    this.container = options.container;
    this.mode = options.mode; // undefined or 'inside'
    this.initialTool = options.initialTool || "position";
    this.options = options;

    // Callbacks
    this.onToolChange = options.onToolChange;
    this.onSelectionChange = options.onSelectionChange;
    this.onChange = options.onChange;
    this.onImageUpload = options.onImageUpload;

    // State
    this.currentTool = null;
    this.activeFeature = null;
    this.selectorEngine = null;
    this.isInitialized = false;

    // Determine where to append UI elements
    // undefined (default) = append to body
    // 'inside' = append to container
    this.uiContainer = this.mode === 'inside' ? this.container : document.body;

    // Initialize history manager
    this.historyManager = new HistoryManager();

    // Setup change listener on history
    this.historyManager.on("change", () => {
      if (this.onChange) {
        this.onChange({
          canUndo: this.historyManager.canUndo(),
          canRedo: this.historyManager.canRedo(),
        });
      }
    });

    // Initialize the editor
    this.init();
  }

  /**
   * Initialize the editor
   * @private
   */
  init() {
    try {
      // Initialize selection engine
      this.selectorEngine = Selectable(this);

      // Setup selection change callback to update active tools
      this.selectorEngine.onSelectedUpdate((elements) => {
        if (this.onSelectionChange) {
          this.onSelectionChange(elements);
        }

        // Update active tool with new selection
        if (this.activeFeature?.onNodesSelected) {
          this.activeFeature.onNodesSelected(elements);
        }
      });

      // Initialize image swap (always active)
      setImageSwapHistoryManager(this.historyManager);
      watchImagesForUpload();

      // Activate initial tool
      if (this.initialTool) {
        this.activateTool(this.initialTool);
      }

      this.isInitialized = true;
      console.log("VisBugEditor initialized successfully");
    } catch (error) {
      console.error("Failed to initialize VisBugEditor:", error);
      throw error;
    }
  }

  /**
   * Get the editing context (container)
   * @private
   * @returns {HTMLElement}
   */
  getEditingContext() {
    return this.container;
  }

  /**
   * Get the UI container (where editor elements are appended)
   * @private
   * @returns {HTMLElement}
   */
  getUIContainer() {
    return this.uiContainer;
  }

  /**
   * Activate a specific editing tool
   *
   * @param {string} toolName - The tool to activate ('position', 'text', 'font')
   */
  activateTool(toolName) {
    // Deactivate current tool
    if (this.activeFeature?.disconnect) {
      this.activeFeature.disconnect();
      this.activeFeature = null;
    }

    // Activate new tool
    switch (toolName) {
      case "position":
        this.activeFeature = Position(this.historyManager);
        // Update with current selection
        const currentSelection = this.getSelectedElements();
        if (currentSelection.length > 0) {
          this.activeFeature.onNodesSelected(currentSelection);
        }
        break;

      case "text":
        // Text editing is triggered on selection
        this.activeFeature = {
          onNodesSelected: (elements) => {
            if (elements.length > 0) {
              EditText(elements, this.historyManager);
            }
          },
          disconnect: () => {},
        };
        break;

      case "font":
        this.activeFeature = Font({
          selection: () => this.getSelectedElements(),
          historyManager: this.historyManager,
        });
        break;

      default:
        console.warn(`Unknown tool: ${toolName}`);
        return;
    }

    // Store current tool
    this.currentTool = toolName;

    // Notify callback
    if (this.onToolChange) {
      this.onToolChange(toolName);
    }

    console.log(`Activated tool: ${toolName}`);
  }

  /**
   * Get the currently active tool
   * @returns {string|null}
   */
  getCurrentTool() {
    return this.currentTool;
  }

  /**
   * Select a specific element
   * @param {HTMLElement} element - Element to select
   */
  selectElement(element) {
    if (this.selectorEngine) {
      this.selectorEngine.select(element);
    }
  }

  /**
   * Select multiple elements
   * @param {HTMLElement[]} elements - Elements to select
   */
  selectElements(elements) {
    if (this.selectorEngine) {
      this.selectorEngine.unselect_all({ silent: true });
      elements.forEach((el) => this.selectorEngine.select(el));
    }
  }

  /**
   * Get currently selected elements
   * @returns {HTMLElement[]}
   */
  getSelectedElements() {
    return this.selectorEngine ? this.selectorEngine.selection() : [];
  }

  /**
   * Clear current selection
   */
  clearSelection() {
    if (this.selectorEngine) {
      this.selectorEngine.unselect_all();
    }
  }

  /**
   * Undo the last change
   * @returns {boolean} True if undo was successful
   */
  undo() {
    return this.historyManager.undo();
  }

  /**
   * Redo the last undone change
   * @returns {boolean} True if redo was successful
   */
  redo() {
    return this.historyManager.redo();
  }

  /**
   * Check if undo is available
   * @returns {boolean}
   */
  canUndo() {
    return this.historyManager.canUndo();
  }

  /**
   * Check if redo is available
   * @returns {boolean}
   */
  canRedo() {
    return this.historyManager.canRedo();
  }

  /**
   * Get the history array
   * @returns {Array}
   */
  getHistory() {
    return this.historyManager.getHistory();
  }

  /**
   * Clear the history
   */
  clearHistory() {
    this.historyManager.clear();
  }

  /**
   * Get clean HTML content (without editor UI elements)
   * @returns {string}
   */
  getContent() {
    const context = this.getEditingContext();
    const clone = context.cloneNode(true);

    // Remove all editor UI elements
    const editorElements = clone.querySelectorAll(
      "visbug-handles, visbug-label, visbug-hover, visbug-overlay, [data-visbug-ignore]"
    );
    editorElements.forEach((el) => el.remove());

    // Remove editor-specific data attributes
    const elementsWithData = clone.querySelectorAll(
      "[data-selected], [data-label-id], [data-visbug]"
    );
    elementsWithData.forEach((el) => {
      el.removeAttribute("data-selected");
      el.removeAttribute("data-label-id");
      el.removeAttribute("data-visbug");
    });

    return clone.innerHTML;
  }

  /**
   * Set content (replaces all user content)
   * @param {string} htmlString - HTML content to set
   */
  setContent(htmlString) {
    const context = this.getEditingContext();

    // Clear selection first
    this.clearSelection();

    // Remove old editor UI elements
    this.removeEditorUI();

    // Set new content
    context.innerHTML = htmlString;

    // Optionally clear history
    if (this.options.clearHistoryOnSetContent !== false) {
      this.historyManager.clear();
    }

    // TODO: Re-initialize editor on new elements when selection engine is ready
    // this.selectorEngine?.refresh()
  }

  /**
   * Remove all editor UI elements
   * @private
   */
  removeEditorUI() {
    const ui = this.getUIContainer();
    const editorElements = ui.querySelectorAll(
      "visbug-handles, visbug-label, visbug-hover, visbug-overlay, [data-visbug-ignore]"
    );
    editorElements.forEach((el) => el.remove());
  }

  /**
   * Add event listener
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   */
  on(eventName, callback) {
    // TODO: Implement event system
    console.log(`Event listener added: ${eventName}`);
  }

  /**
   * Remove event listener
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   */
  off(eventName, callback) {
    // TODO: Implement event system
    console.log(`Event listener removed: ${eventName}`);
  }

  /**
   * Destroy the editor and clean up
   */
  destroy() {
    // Disconnect active feature
    if (this.activeFeature?.disconnect) {
      this.activeFeature.disconnect();
    }

    // Disconnect selector engine
    if (this.selectorEngine?.disconnect) {
      this.selectorEngine.disconnect();
    }

    // Remove editor UI
    this.removeEditorUI();

    // Clear history
    this.historyManager.clear();

    // Reset state
    this.isInitialized = false;
    this.currentTool = null;
    this.activeFeature = null;
    this.selectorEngine = null;

    console.log("VisBugEditor destroyed");
  }
}
