# visbug-editor

Framework-agnostic visual editing library extracted from [VisBug](https://github.com/GoogleChromeLabs/ProjectVisBug).

[![npm version](https://img.shields.io/npm/v/visbug-editor.svg)](https://www.npmjs.com/package/visbug-editor)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

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

## API Reference

### Constructor Options

```typescript
interface VisBugEditorOptions {
  container: HTMLElement;              // Required: editing canvas
  mode?: 'shadowDOM' | 'div';          // Default: 'shadowDOM'
  initialTool?: 'position' | 'text' | 'font';
  onToolChange?: (tool: string) => void;
  onSelectionChange?: (elements: HTMLElement[]) => void;
  onChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  onImageUpload?: (file: File) => Promise<string>;
  styles?: Record<string, string>;
  clearHistoryOnSetContent?: boolean;
}
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

- **Position**: Drag or use arrow keys (1px), Shift+arrow (10px), Alt+arrow (0.5px)
- **Text**: Click to edit inline with contenteditable
- **Font**: Cmd/Ctrl+↑/↓ (size), Cmd/Ctrl+Shift+↑/↓ (letter spacing), Alt+↑/↓ (line height), Cmd/Ctrl+B (bold), Cmd/Ctrl+I (italic)
- **Image**: Drag-drop images onto `<img>` tags to replace

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

### Custom Image Upload

```javascript
const editor = new VisBugEditor({
  container: document.getElementById('app'),
  onImageUpload: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const { url } = await fetch('/api/upload', { method: 'POST', body: formData }).then(r => r.json());
    return url;
  }
});
```

## Content Persistence

```javascript
// Save
const html = editor.getContent();
await fetch("/api/save", { method: "POST", body: JSON.stringify({ html }) });

// Load
const { html } = await fetch("/api/content/123").then(r => r.json());
editor.setContent(html);
```

## Browser Support

Chrome/Edge 80+, Firefox 75+, Safari 13.1+ (requires ES6 modules, custom elements, shadow DOM support)
