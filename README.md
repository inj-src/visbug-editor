# visbug-editor

Core editing features extracted from [VisBug](https://github.com/GoogleChromeLabs/ProjectVisBug) for use in web applications.

[![npm version](https://img.shields.io/npm/v/visbug-editor.svg)](https://www.npmjs.com/package/visbug-editor)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Overview

`visbug-editor` is a framework-agnostic library that provides inline visual editing capabilities. It allows users to directly manipulate content within a container element, with support for:

- **Position Tool**: Drag-and-drop positioning and arrow key nudging
- **Text Tool**: Inline text editing with contenteditable
- **Font Tool**: Typography controls (size, weight, style, spacing)
- **Image Tool**: Drag and drop image replacement

All operations include full undo/redo support with smart change batching.

## Features

**Visual Editing Tools**
- Position Tool - Drag elements to reposition, use arrow keys for precise movement
- Text Tool - Inline text editing
- Font Tool - Typography controls (size, spacing, weight, style)
- Image Swap - Drag-and-drop image replacement

**Built-in Components**
- Selection overlay with resize handles (8 grips: corners + edges)
- Hover indicators with element labels
- Visual feedback for all interactions
- Dynamic overlay updates when elements change

**History Management**
- Full undo/redo support
- Smart change batching and merging
- Event-based change notifications

**Framework Agnostic**
- Works with vanilla JS, React, Vue, Angular, etc.
- Shadow DOM or regular DOM mode
- TypeScript definitions included

## Installation

```bash
npm install visbug-editor
```

Or with yarn:

```bash
yarn add visbug-editor
```

## Quick Start

### Basic Usage

```javascript
import { VisBugEditor } from 'visbug-editor';

const editor = new VisBugEditor({
  container: document.getElementById('editable-area'),
  initialTool: 'position',
  onToolChange: (tool) => console.log('Tool changed:', tool),
  onSelectionChange: (elements) => console.log('Selected:', elements),
  onChange: ({ canUndo, canRedo }) => {
    console.log('Can undo:', canUndo, 'Can redo:', canRedo);
  }
});

// Switch tools
editor.activateTool('text');
editor.activateTool('font');

// Undo/Redo
editor.undo();
editor.redo();

// Get/Set content
const html = editor.getContent();
editor.setContent('<h1>New content</h1>');

// Clean up
editor.destroy();
```

### TypeScript

Full TypeScript support with complete type definitions:

```typescript
import { VisBugEditor, VisBugEditorOptions } from 'visbug-editor';

const options: VisBugEditorOptions = {
  container: document.getElementById('app')!,
  mode: 'shadowDOM',
  initialTool: 'position',
  onToolChange: (tool: string) => {
    console.log('Tool:', tool);
  }
};

const editor = new VisBugEditor(options);
```

## Container Concept

When you pass a container to the editor, **the children of the container become editable**, not the container itself:

```html
<div id="my-container">
  <!-- This h1 is editable -->
  <h1>Editable Heading</h1>

  <!-- This paragraph is editable -->
  <p>You can edit this text</p>

  <!-- This image is swappable -->
  <img src="image.jpg" />
</div>
```

```javascript
const editor = new VisBugEditor({
  container: document.getElementById('my-container')
});
```

The container acts as the "editing canvas" boundary.

## API Reference

### Constructor Options

```typescript
interface VisBugEditorOptions {
  // Required
  container: HTMLElement;              // Container whose children will be editable

  // Optional
  mode?: 'shadowDOM' | 'div';          // Default: 'shadowDOM'
  initialTool?: 'position' | 'text' | 'font'; // Default: 'position'

  // Callbacks
  onToolChange?: (tool: string) => void;
  onSelectionChange?: (elements: HTMLElement[]) => void;
  onChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  onImageUpload?: (file: File) => Promise<string>;

  // Customization
  styles?: Record<string, string>;

  // Behavior
  clearHistoryOnSetContent?: boolean;  // Default: true
}
```

### Methods

**Tool Management**
- `activateTool(toolName)` - Switch to a different tool ('position', 'text', 'font')
- `getCurrentTool()` - Get the currently active tool

**Selection**
- `selectElement(element)` - Select a single element
- `selectElements(elements)` - Select multiple elements
- `getSelectedElements()` - Get currently selected elements
- `clearSelection()` - Clear current selection

**History**
- `undo()` - Undo the last change
- `redo()` - Redo the last undone change
- `canUndo()` - Check if undo is available
- `canRedo()` - Check if redo is available
- `getHistory()` - Get the history array
- `clearHistory()` - Clear the history

**Content**
- `getContent()` - Get clean HTML without editor UI
- `setContent(html)` - Set content and optionally clear history

**Lifecycle**
- `destroy()` - Clean up and destroy the editor

## Tools

### Position Tool (Default)

Drag elements to reposition them. Uses keyboard shortcuts for precise control:

- **Arrow Keys** - Move 1px
- **Shift + Arrow** - Move 10px
- **Alt + Arrow** - Move 0.5px

Automatically records changes to history for undo/redo.

### Text Tool

Click on any element to edit its text content inline using contenteditable. Press Enter or click outside to finish editing.

### Font Tool

Typography controls with keyboard shortcuts:

**Font Size**
- `Cmd/Ctrl + Up` - Increase font size
- `Cmd/Ctrl + Down` - Decrease font size

**Letter Spacing (Kerning)**
- `Cmd/Ctrl + Shift + Up` - Increase letter spacing
- `Cmd/Ctrl + Shift + Down` - Decrease letter spacing

**Line Height (Leading)**
- `Alt + Up` - Increase line height
- `Alt + Down` - Decrease line height

**Font Weight**
- `Cmd/Ctrl + B` - Toggle bold

**Font Style**
- `Cmd/Ctrl + I` - Toggle italic

### Image Swap (Always Active)

Drag and drop images onto any `<img>` tag or element with a background image to replace it. Supports:
- Direct image URL replacement
- Custom upload handler via `onImageUpload` callback

## Examples

### React Integration

```jsx
import { useEffect, useRef, useState } from 'react';
import { VisBugEditor } from 'visbug-editor';

function Editor() {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = new VisBugEditor({
        container: containerRef.current,
        onChange: ({ canUndo, canRedo }) => {
          setCanUndo(canUndo);
          setCanRedo(canRedo);
        }
      });
    }

    return () => {
      editorRef.current?.destroy();
    };
  }, []);

  return (
    <div>
      <button onClick={() => editorRef.current?.undo()} disabled={!canUndo}>
        Undo
      </button>
      <button onClick={() => editorRef.current?.redo()} disabled={!canRedo}>
        Redo
      </button>
      <div ref={containerRef}>
        <h1>Editable Content</h1>
      </div>
    </div>
  );
}
```

### Vue Integration

```vue
<template>
  <div>
    <button @click="undo" :disabled="!canUndo">Undo</button>
    <button @click="redo" :disabled="!canRedo">Redo</button>
    <div ref="container">
      <h1>Editable Content</h1>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { VisBugEditor } from 'visbug-editor';

const container = ref(null);
const canUndo = ref(false);
const canRedo = ref(false);
let editor = null;

onMounted(() => {
  editor = new VisBugEditor({
    container: container.value,
    onChange: ({ canUndo: cu, canRedo: cr }) => {
      canUndo.value = cu;
      canRedo.value = cr;
    }
  });
});

onUnmounted(() => {
  editor?.destroy();
});

const undo = () => editor?.undo();
const redo = () => editor?.redo();
</script>
```

### Next.js Integration

```jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { VisBugEditor } from "visbug-editor";

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
```

### Custom Image Upload

```javascript
const editor = new VisBugEditor({
  container: document.getElementById('app'),
  onImageUpload: async (file) => {
    // Upload to your server
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const { url } = await response.json();
    return url; // Return the uploaded image URL
  }
});
```

## Shadow DOM vs Div Mode

### Shadow DOM (Recommended)

**Pros:**
- Style isolation between editor and content
- DOM encapsulation
- No style conflicts

**Cons:**
- Not supported in very old browsers
- Slight complexity in event handling

### Div Mode (Fallback)

**Pros:**
- Universal browser support
- Simpler event handling

**Cons:**
- Potential style conflicts
- Editor styles may affect content

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
```

### Loading Content

```javascript
// Load from backend
const response = await fetch("/api/content/123");
const { html } = await response.json();

// Set content (clears selection and optionally history)
editor.setContent(html);
```

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13.1+

Requires support for:
- ES6 Modules
- Custom Elements
- Shadow DOM (optional, falls back to regular DOM)
- MutationObserver

## Bundle Size

- ESM: ~144 KB (uncompressed)
- Browser: ~153 KB (uncompressed)
- CJS: ~144 KB (uncompressed)
- UMD: ~144 KB (uncompressed)

All builds include source maps for debugging.

## License

Apache-2.0

## Credits

Extracted from [VisBug](https://github.com/GoogleChromeLabs/ProjectVisBug) by Adam Argyle.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- [GitHub Repository](https://github.com/GoogleChromeLabs/ProjectVisBug)
- [Issue Tracker](https://github.com/GoogleChromeLabs/ProjectVisBug/issues)
- [Original VisBug](https://github.com/GoogleChromeLabs/ProjectVisBug)
