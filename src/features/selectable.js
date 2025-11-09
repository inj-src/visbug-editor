/**
 * Selectable - Simplified selection system for visbug-editor
 *
 * This is a simplified version of the original VisBug selectable.js
 * with only core selection functionality and no toolbar dependencies.
 */

import $ from "blingblingjs";
import hotkeys from "hotkeys-js";
import { DOMChange, StyleChange, AttributeChange, TextChange } from "./history.js";

import {
  metaKey,
  htmlStringToDom,
  createClassname,
  isOffBounds,
  getStyle,
  getStyles,
  deepElementFromPoint,
  isFixed,
  onRemove,
} from "../utilities/index.js";

/**
 * Create a selectable system for the editor
 * @param {Object} editor - The VisBugEditor instance
 * @returns {Object} - Selection API
 */
export function Selectable(editor) {
  const container = editor.container;
  const historyManager = editor.historyManager;
  const uiContainer = editor.getUIContainer(); // Where to append UI elements

  let selected = [];
  let selectedCallbacks = [];
  let labels = [];
  let handles = [];
  let observers = []; // Track MutationObservers for cleanup

  const hover_state = {
    target: null,
    element: null,
    label: null,
  };

  /**
   * Check if an element matches any selector in the ignore list
   * @param {HTMLElement} element - The element to check
   * @returns {boolean} - True if element should be ignored
   */
  const isIgnored = (element) => {
    if (!element || !editor.ignoreSelectors || editor.ignoreSelectors.length === 0) {
      return false;
    }

    return editor.ignoreSelectors.some((selector) => {
      try {
        return element.matches(selector);
      } catch (e) {
        // Invalid selector, skip it
        console.warn(`Invalid CSS selector in ignore list: ${selector}`);
        return false;
      }
    });
  };

  /**
   * Start listening for selection events
   */
  const listen = () => {
    container.addEventListener("click", on_click, true);
    container.addEventListener("dblclick", on_dblclick, true);
    container.addEventListener("selectstart", on_selection);
    container.addEventListener("mousemove", on_hover);

    document.addEventListener("copy", on_copy);
    document.addEventListener("cut", on_cut);
    document.addEventListener("paste", on_paste);

    watchCommandKey();

    // Keyboard shortcuts
    hotkeys("esc", on_esc);
    hotkeys(`${metaKey}+d`, on_duplicate);
    hotkeys("backspace,del,delete", on_delete);
    hotkeys("alt+del,alt+backspace", on_clearstyles);
    hotkeys("tab,shift+tab,enter,shift+enter", on_keyboard_traversal);
  };

  /**
   * Stop listening for selection events
   */
  const unlisten = () => {
    container.removeEventListener("click", on_click, true);
    container.removeEventListener("dblclick", on_dblclick, true);
    container.removeEventListener("selectstart", on_selection);
    container.removeEventListener("mousemove", on_hover);

    document.removeEventListener("copy", on_copy);
    document.removeEventListener("cut", on_cut);
    document.removeEventListener("paste", on_paste);

    hotkeys.unbind(
      `esc,${metaKey}+d,backspace,del,delete,alt+del,alt+backspace,tab,shift+tab,enter,shift+enter`
    );
  };

  /**
   * Handle click events - primary selection mechanism
   */
  const on_click = (e) => {
    const $target = deepElementFromPoint(e.clientX, e.clientY);

    if (
      (isOffBounds($target) || isIgnored($target)) &&
      !selected.filter((el) => el == $target).length
    )
      return;

    e.preventDefault();
    if (!e.altKey) e.stopPropagation();

    if (!e.shiftKey) {
      unselect_all({ silent: true });
    }

    if (e.shiftKey && $target.hasAttribute("data-selected"))
      unselect($target.getAttribute("data-label-id"));
    else select($target);
  };

  /**
   * Handle double-click - could trigger text editing
   */
  const on_dblclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOffBounds(e.target)) return;

    // Notify editor of double-click for text editing
    if (editor.onDoubleClick) {
      editor.onDoubleClick(e.target);
    }
  };

  /**
   * Handle hover state
   */
  const on_hover = (e) => {
    const $target = deepElementFromPoint(e.clientX, e.clientY);

    if (isOffBounds($target) || isIgnored($target)) {
      if (hover_state.element) clearHover();
      return;
    }

    if ($target.hasAttribute("data-selected") || $target.nodeName === "visbug-hover")
      return clearHover();

    if (hover_state.target && hover_state.target === $target) return;

    clearHover();

    hover_state.target = $target;
    hover_state.element = createHoverIndicator($target);
    hover_state.label = createLabelIndicator($target, combineNodeNameAndClass($target));
  };
  /**
   * Select an element
   */
  const select = ($el) => {
    if (isOffBounds($el) || isIgnored($el) || $el.hasAttribute("data-pseudo-select")) return;

    // Don't clear existing selection if element is already selected
    if ($el.hasAttribute("data-selected")) return;

    // Clear hover overlay when selecting element
    if (hover_state.target === $el) {
      clearHover();
    }

    $el.setAttribute("data-selected", true);
    $el.setAttribute("data-selected-hide", true);

    selected.unshift($el);

    const id = $el.getAttribute("data-label-id") || "label_" + Number(new Date());

    if (!$el.hasAttribute("data-label-id")) $el.setAttribute("data-label-id", id);

    const handle = createHandle($el, id);
    const label = createLabelIndicator($el, combineNodeNameAndClass($el), id);

    handles.push(handle);
    labels.push(label);

    // Create observer to watch for element changes
    const observer = createObserver($el, { label, handle });
    observer.observe($el, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    // Also observe parent for position changes
    const parentObserver = new MutationObserver(() => {
      if (label && document.body.contains(label)) {
        setLabel($el, label);
      }
      if (handle && document.body.contains(handle)) {
        setHandle($el, handle);
      }
    });

    if ($el.parentElement) {
      parentObserver.observe($el.parentElement, {
        childList: true,
        subtree: false,
      });
    }

    // Track observers for cleanup
    observers.push({ element: $el, observer, parentObserver, label, handle });

    // Setup removal cleanup
    onRemove($el, () => {
      // Element was removed from DOM, cleanup UI
      label && label.remove();
      handle && handle.remove();
      observer.disconnect();
      parentObserver.disconnect();

      // Remove from tracking arrays
      selected = selected.filter((el) => el !== $el);
      labels = labels.filter((l) => l !== label);
      handles = handles.filter((h) => h !== handle);
      observers = observers.filter((o) => o.element !== $el);

      tellWatchers();
    });

    tellWatchers();
    return $el;
  };

  /**
   * Unselect a specific element by ID
   */
  const unselect = (id) => {
    // Find and disconnect observers for this element
    const observerEntry = observers.find((o) => o.element.getAttribute("data-label-id") === id);
    if (observerEntry) {
      observerEntry.observer.disconnect();
      observerEntry.parentObserver.disconnect();
      observers = observers.filter((o) => o !== observerEntry);
    }

    [...labels, ...handles]
      .filter((node) => node.getAttribute("data-label-id") === id)
      .forEach((node) => node.remove());

    selected
      .filter((node) => node.getAttribute("data-label-id") === id)
      .forEach((node) =>
        $(node).attr({
          "data-selected": null,
          "data-selected-hide": null,
          "data-label-id": null,
          "data-pseudo-select": null,
        })
      );

    selected = selected.filter((node) => node.getAttribute("data-label-id") !== id);

    tellWatchers();
  };

  /**
   * Unselect all elements
   */
  const unselect_all = ({ silent = false } = {}) => {
    // Disconnect all observers
    observers.forEach((o) => {
      o.observer.disconnect();
      o.parentObserver.disconnect();
    });
    observers = [];

    selected.forEach(
      ($el) =>
        $el.removeAttribute("data-selected") &&
        $el.removeAttribute("data-selected-hide") &&
        $el.removeAttribute("data-label-id") &&
        $el.removeAttribute("data-pseudo-select")
    );

    labels.forEach((label) => label.remove());
    handles.forEach((handle) => handle.remove());

    selected = [];
    handles = [];
    labels = [];

    if (!silent) tellWatchers();
  };

  /**
   * Clear hover state
   */
  const clearHover = () => {
    if (hover_state.element) {
      hover_state.element.remove();
      hover_state.element = null;
    }
    if (hover_state.label) {
      hover_state.label.remove();
      hover_state.label = null;
    }
    hover_state.target = null;
  };

  /**
   * Create hover indicator element
   */
  const createHoverIndicator = ($el) => {
    const hover = document.createElement("visbug-hover");
    const rect = $el.getBoundingClientRect();

    hover.position = {
      el: $el,
      boundingRect: rect,
      isFixed: isFixed($el),
      uiContainer: uiContainer, // Pass container for offset calculation
    };

    uiContainer.appendChild(hover);
    return hover;
  };

  /**
   * Combine node name and class for label text
   */
  const combineNodeNameAndClass = (node) =>
    `${node.nodeName.toLowerCase()}${createClassname(node)}`;

  /**
   * Create label indicator element
   */
  const createLabelIndicator = ($el, label_text, id) => {
    const label = document.createElement("visbug-label");
    const rect = $el.getBoundingClientRect();

    label.text = label_text;
    label.position = {
      boundingRect: rect,
      isFixed: isFixed($el),
      uiContainer: uiContainer, // Pass container for offset calculation
    };

    if (id) label.setAttribute("data-label-id", id);

    uiContainer.appendChild(label);
    return label;
  };

  /**
   * Create handle element for selected item
   */
  const createHandle = ($el, id) => {
    const handle = document.createElement("visbug-handles");
    const rect = $el.getBoundingClientRect();

    handle.position = {
      el: $el,
      node_label_id: id,
      isFixed: isFixed($el),
      uiContainer: uiContainer, // Pass container for offset calculation
    };

    handle.setAttribute("data-label-id", id);

    // Attach historyManager for resize tracking
    handle.historyManager = historyManager;

    uiContainer.appendChild(handle);
    return handle;
  };

  /**
   * Update label position
   */
  const setLabel = (el, label) => {
    label.text = combineNodeNameAndClass(el);
    label.update = {
      boundingRect: el.getBoundingClientRect(),
      isFixed: isFixed(el),
      uiContainer: uiContainer, // Pass container for offset calculation
    };
  };

  /**
   * Update handle position
   */
  const setHandle = (el, handle) => {
    handle.position = {
      el,
      node_label_id: el.getAttribute("data-label-id"),
      isFixed: isFixed(el),
      uiContainer: uiContainer, // Pass container for offset calculation
    };
  };

  /**
   * Create observer to watch for element changes (position, size, etc.)
   */
  const createObserver = (node, { label, handle }) =>
    new MutationObserver((list) => {
      // Update label and handle positions when element changes
      if (label && document.body.contains(label)) {
        setLabel(node, label);
      }
      if (handle && document.body.contains(handle)) {
        setHandle(node, handle);
      }
    });

  /**
   * Notify callbacks about selection changes
   */
  const tellWatchers = () => {
    const selectedElements = selected;
    selectedCallbacks.forEach((cb) => cb(selectedElements));

    if (editor.onSelectionChange) {
      editor.onSelectionChange(selectedElements);
    }
  };

  /**
   * Register callback for selection changes
   */
  const onSelectedUpdate = (cb) => {
    if (typeof cb === "function") {
      selectedCallbacks.push(cb);
      return () => {
        selectedCallbacks = selectedCallbacks.filter((callback) => callback !== cb);
      };
    }
  };

  /**
   * Watch for command key (ctrl/cmd) state
   */
  const watchCommandKey = () => {
    const root = document.body;

    document.addEventListener("keydown", (e) => {
      if (e[metaKey + "Key"] && !root.hasAttribute("data-" + metaKey))
        root.setAttribute("data-" + metaKey, true);
    });

    document.addEventListener("keyup", (e) => {
      if (!e[metaKey + "Key"] && root.hasAttribute("data-" + metaKey))
        root.removeAttribute("data-" + metaKey);
    });
  };

  // ========================================================================
  // Keyboard event handlers
  // ========================================================================

  const on_selection = (e) => e.preventDefault();

  const on_esc = (e) => {
    e.preventDefault();
    unselect_all();
    clearHover();
  };

  const on_duplicate = (e) => {
    e.preventDefault();

    if (!historyManager || !selected.length) return;

    const changes = [];
    selected.forEach(($el) => {
      const $clone = $el.cloneNode(true);
      $clone.removeAttribute("data-selected");
      $clone.removeAttribute("data-label-id");

      $el.parentNode.insertBefore($clone, $el.nextSibling);

      changes.push(
        new DOMChange({
          element: $clone,
          oldParent: null,
          oldNextSibling: null,
          newParent: $el.parentNode,
          newNextSibling: $el.nextSibling,
        })
      );
    });

    if (changes.length) {
      historyManager.push(changes);
    }
  };

  const on_delete = (e) => {
    e.preventDefault();

    if (!historyManager || !selected.length) return;

    const changes = selected.map(($el) => {
      const parent = $el.parentNode;
      const sibling = $el.nextSibling;

      return new DOMChange({
        element: $el,
        oldParent: parent,
        oldNextSibling: sibling,
        newParent: null,
        newNextSibling: null,
      });
    });

    selected.forEach(($el) => $el.remove());
    unselect_all();

    if (changes.length) {
      historyManager.push(changes);
    }
  };

  const on_clearstyles = (e) => {
    e.preventDefault();

    if (!historyManager || !selected.length) return;

    const changes = selected.map(($el) => {
      const oldStyle = $el.getAttribute("style") || "";

      return new AttributeChange({
        element: $el,
        attribute: "style",
        oldValue: oldStyle,
        newValue: "",
      });
    });

    selected.forEach(($el) => $el.removeAttribute("style"));

    if (changes.length) {
      historyManager.push(changes);
    }
  };

  const on_keyboard_traversal = (e) => {
    if (!selected.length) return;

    e.preventDefault();
    e.stopPropagation();

    const $current = selected[0];
    let $next;

    if (e.key === "Tab" && !e.shiftKey) {
      $next = $current.nextElementSibling;
    } else if (e.key === "Tab" && e.shiftKey) {
      $next = $current.previousElementSibling;
    } else if (e.key === "Enter" && !e.shiftKey) {
      $next = $current.firstElementChild;
    } else if (e.key === "Enter" && e.shiftKey) {
      $next = $current.parentElement;
    }

    if ($next && !isOffBounds($next)) {
      unselect_all({ silent: true });
      select($next);
    }
  };

  // ========================================================================
  // Copy/Paste handlers (simplified)
  // ========================================================================

  let copied_element = null;

  const on_copy = (e) => {
    if (!selected.length) return;

    e.preventDefault();
    copied_element = selected[0].cloneNode(true);

    // Also copy to clipboard as HTML
    e.clipboardData.setData("text/html", selected[0].outerHTML);
    e.clipboardData.setData("text/plain", selected[0].textContent);
  };

  const on_cut = (e) => {
    if (!selected.length) return;

    on_copy(e);
    on_delete(e);
  };

  const on_paste = (e) => {
    if (!selected.length || !copied_element) return;

    e.preventDefault();

    const $target = selected[0];
    const $clone = copied_element.cloneNode(true);

    $target.parentNode.insertBefore($clone, $target.nextSibling);

    if (historyManager) {
      historyManager.push(
        new DOMChange({
          element: $clone,
          oldParent: null,
          oldNextSibling: null,
          newParent: $target.parentNode,
          newNextSibling: $target.nextSibling,
        })
      );
    }
  };

  // ========================================================================
  // Public API
  // ========================================================================

  // Start listening immediately
  listen();

  return {
    listen,
    disconnect: unlisten,
    unselect_all,
    select,
    unselect,
    onSelectedUpdate,
    selection: () => selected,
    labels: () => labels,
    handles: () => handles,
  };
}
