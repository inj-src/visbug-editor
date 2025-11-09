# visbug-editor

Framework-agnostic visual editing library extracted from [VisBug](https://github.com/GoogleChromeLabs/ProjectVisBug).

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

- **Tools**: Position (drag/arrow keys), Text (contenteditable), Font (typography), Image (drag-drop replacement)
- **Components**: Selection overlay with resize handles, hover indicators, visual feedback
- **History**: Full undo/redo with smart change batching
- **Flexible**: Works with vanilla JS, React, Vue, Angular; Shadow DOM or regular DOM
- **TypeScript**: Complete type definitions included

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

The container's **children** become editable, not the container itself:

```javascript
const editor = new VisBugEditor({
  container: document.getElementById('my-container')
  // Children of my-container are now editable
});
```

The container acts as the "editing canvas" boundary.

## API Reference

### Constructor Options

```typescript
interface VisBugEditorOptions {
  container: HTMLElement;              // Required: editing canvas
  mode?: 'inside';                     // Where to append UI elements
  initialTool?: 'position' | 'text' | 'font';
  onToolChange?: (tool: string) => void;
  onSelectionChange?: (elements: HTMLElement[]) => void;
  onChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  onImageUpload?: (file: File) => Promise<string>;
  styles?: Record<string, string>;
  clearHistoryOnSetContent?: boolean;
}
```

### Mode Option

The `mode` option controls where editor UI elements (labels, handles, overlays) are appended:

**Undefined (default)** - Append to `document.body`
- UI overlays can extend beyond container boundaries
- Standard behavior for full-page editing
- Use when container might have `overflow: hidden` or positioning constraints

```javascript
const editor = new VisBugEditor({
  container: document.getElementById('app')
  // mode undefined - UI appends to document.body
});
```

**'inside'** - Append to the container element
- UI stays within container bounds
- Useful for isolated editing areas or embedded editors
- Good for multiple editors on the same page

```javascript
const editor = new VisBugEditor({
  container: document.getElementById('app'),
  mode: 'inside' // UI appends to container
});
```

### Key Methods

| Method | Purpose |
|--------|---------|
| `activateTool(name)` | Switch tools: 'position', 'text', 'font' |
| `undo()` / `redo()` | Undo/redo changes |
| `getContent()` / `setContent(html)` | Get/set HTML |
| `selectElement(el)` / `clearSelection()` | Manage selection |
| `destroy()` | Cleanup |

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

### React

```jsx
import { useEffect, useRef } from 'react';
import { VisBugEditor } from 'visbug-editor';

export default function Editor() {
  const containerRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    editorRef.current = new VisBugEditor({
      container: containerRef.current
    });
    return () => editorRef.current?.destroy();
  }, []);

  return (
    <>
      <button onClick={() => editorRef.current?.undo()}>Undo</button>
      <div ref={containerRef}><h1>Editable</h1></div>
    </>
  );
}
```

### Vue

```vue
<template>
  <button @click="editor?.undo()">Undo</button>
  <div ref="container"><h1>Editable</h1></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { VisBugEditor } from 'visbug-editor';

const container = ref(null);
let editor = null;

onMounted(() => {
  editor = new VisBugEditor({ container: container.value });
});

onUnmounted(() => {
  editor?.destroy();
});
</script>
```
