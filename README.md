# visbug-core

Core editing features extracted from [VisBug](https://github.com/GoogleChromeLabs/ProjectVisBug) for use in web applications.

## Overview

`visbug-core` is a framework-agnostic library that provides inline visual editing capabilities. It allows users to directly manipulate content within a container element, with support for:

- **Position Tool**: Drag-and-drop positioning and arrow key nudging
- **Text Tool**: Inline text editing
- **Font Tool**: Font size, weight, style, spacing, and alignment controls
- **Image Tool**: Drag & drop image replacement

All operations support undo/redo functionality.

## Installation

```bash
npm install visbug-core
```

## Quick Start

### For Browser Use (Direct Import)

```html
<script type="module">
  import { VisBugEditor } from "./dist/visbug-core.browser.js";

  const editor = new VisBugEditor({
    container: document.getElementById("editable-area"),
    mode: "shadowDOM",
    initialTool: "position",
    onToolChange: (tool) => console.log("Tool changed:", tool),
    onChange: (state) => console.log("Can undo:", state.canUndo),
  });
</script>
```

### For Bundlers (Webpack, Vite, etc.)

```javascript
import { VisBugEditor } from "visbug-core";

const editor = new VisBugEditor({
  container: document.getElementById("editable-area"),
  mode: "shadowDOM", // or 'div'
  initialTool: "position",
  onToolChange: (tool) => console.log("Tool changed:", tool),
  onChange: (state) => console.log("Can undo:", state.canUndo),
});

// Switch tools
editor.activateTool("text");

// Undo/Redo
editor.undo();
editor.redo();

// Get content
const html = editor.getContent();

// Clean up
editor.destroy();
```

## Container Concept

When you pass a container to the editor:

```javascript
const editor = new VisBugEditor({
  container: document.getElementById("my-container"),
});
```

**The children of the container become editable**, not the container itself:

```html
<div id="my-container">
  <!-- ✅ This h1 is editable -->
  <h1>Editable Heading</h1>

  <!-- ✅ This paragraph is editable -->
  <p>You can edit this text</p>

  <!-- ✅ This image is swappable -->
  <img src="image.jpg" />
</div>
```

The container acts as the "editing canvas" boundary.

## API Reference

### Constructor Options

```typescript
new VisBugEditor({
  // Required
  container: HTMLElement,        // Container whose children will be editable

  // Optional
  mode: 'shadowDOM' | 'div',     // Default: 'shadowDOM'
  initialTool: string,            // Default: 'position'

  // Callbacks
  onToolChange: (toolName: string) => void,
  onSelectionChange: (elements: HTMLElement[]) => void,
  onChange: (state: { canUndo: boolean, canRedo: boolean }) => void,
  onImageUpload: (file: File) => Promise<string>,  // Return URL

  // Customization
  styles: {
    selectionColor: string,
    handleColor: string,
  },

  // Behavior
  clearHistoryOnSetContent: boolean,  // Default: true
})
```

### Methods

#### Tool Management

- `activateTool(toolName: string)` - Switch to a specific tool
  - Tools: `'position'`, `'text'`, `'font'`, `'image'`
- `getCurrentTool(): string` - Get current tool name

#### Selection

- `selectElement(element: HTMLElement)` - Select a single element
- `selectElements(elements: HTMLElement[])` - Select multiple elements
- `getSelectedElements(): HTMLElement[]` - Get selected elements
- `clearSelection()` - Clear selection

#### History

- `undo(): boolean` - Undo last change
- `redo(): boolean` - Redo last undone change
- `canUndo(): boolean` - Check if undo is available
- `canRedo(): boolean` - Check if redo is available
- `getHistory(): Array` - Get history array

#### Content Management

- `getContent(): string` - Get clean HTML (without editor UI)
- `setContent(htmlString: string)` - Replace content and optionally clear history

#### Events

- `on(eventName: string, callback: Function)` - Add event listener
- `off(eventName: string, callback: Function)` - Remove event listener

#### Lifecycle

- `destroy()` - Clean up and remove editor

### Events

```javascript
editor.on("tool-changed", (toolName) => {});
editor.on("selection-changed", (elements) => {});
editor.on("element-modified", (change) => {});
editor.on("history-changed", ({ canUndo, canRedo }) => {});
```

## Usage with Next.js

```jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { VisBugEditor } from "visbug-core";

export default function EditableContent() {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const [activeTool, setActiveTool] = useState("position");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = new VisBugEditor({
        container: containerRef.current,
        mode: "shadowDOM",
        initialTool: "position",

        onToolChange: (tool) => setActiveTool(tool),

        onChange: (state) => {
          setCanUndo(state.canUndo);
          setCanRedo(state.canRedo);
        },
      });
    }

    return () => {
      editorRef.current?.destroy();
      editorRef.current = null;
    };
```

## Build Outputs

The package provides multiple build formats:

- **`dist/visbug-core.browser.js`** - ESM build with bundled dependencies for direct browser use
- **`dist/visbug-core.esm.js`** - ESM build with external dependencies (for bundlers)
- **`dist/visbug-core.cjs.js`** - CommonJS build (for Node.js)
- **`dist/visbug-core.umd.js`** - UMD build (for `<script>` tags)

### When to use which build:

- **Browser (no bundler)**: Use `visbug-core.browser.js`
- **Webpack/Vite/Rollup**: Use `visbug-core` (defaults to ESM)
- **Node.js**: Automatically uses CJS build
- **Legacy `<script>` tag**: Use UMD build with global `VisBugCore`

## Browser Support

}, []);

return (
<div className="editor-wrapper">
<div className="toolbar">
<button onClick={() => editorRef.current?.activateTool("position")}>
Position
</button>
<button onClick={() => editorRef.current?.activateTool("text")}>
Text
</button>
<button onClick={() => editorRef.current?.activateTool("font")}>
Font
</button>
<button onClick={() => editorRef.current?.undo()} disabled={!canUndo}>
Undo
</button>
<button onClick={() => editorRef.current?.redo()} disabled={!canRedo}>
Redo
</button>
</div>

      <div ref={containerRef} className="editable-area">
        <h1>Edit Me!</h1>
        <p>This content is editable</p>
      </div>
    </div>

);
}

````

## Shadow DOM vs Div Mode

### Shadow DOM (Recommended)

**Pros:**

- ✅ Style isolation between editor and content
- ✅ DOM encapsulation
- ✅ No style conflicts

**Cons:**

- ❌ Not supported in very old browsers
- ❌ Slight complexity in event handling

### Div Mode (Fallback)

**Pros:**

- ✅ Universal browser support
- ✅ Simpler event handling

**Cons:**

- ❌ Potential style conflicts
- ❌ Editor styles may affect content

The library automatically falls back to div mode if Shadow DOM is not supported.

## Content Persistence

### Saving Content

```javascript
// Get clean HTML (without editor UI)
const html = editor.getContent();

// Save to backend
await fetch("/api/save", {
  method: "POST",
  body: JSON.stringify({ html }),
});
````

### Loading Content

```javascript
// Load from backend
const response = await fetch("/api/content/123");
const { html } = await response.json();

// Set content (clears selection and optionally history)
editor.setContent(html);
```

## Image Upload Handling

For image replacement to persist, provide an upload handler:

```javascript
const editor = new VisBugEditor({
  container: document.getElementById("editable-area"),

  onImageUpload: async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const { url } = await response.json();
    return url; // Editor will use this URL
  },
});
```

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (14+)
- IE11: ⚠️ Requires polyfills for Shadow DOM (or use div mode)

## Development Status

This is an early extraction of core features from VisBug. Current implementation status:

- ✅ Phase 1: Setup & Core Infrastructure (Complete)
- ⏳ Phase 2: Selection System (In Progress)
- ⏳ Phase 3: Core Editing Features (Planned)
- ⏳ Phase 4: Integration & API (Planned)
- ⏳ Phase 5: Documentation & Examples (Planned)
- ⏳ Phase 6: Testing & Polish (Planned)

## License

Apache-2.0

## Credits

Extracted from [VisBug](https://github.com/GoogleChromeLabs/ProjectVisBug) by Adam Argyle.
