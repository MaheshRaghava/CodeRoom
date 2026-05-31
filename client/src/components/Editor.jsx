import { useRef, useEffect, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { monacoChangeToDelta } from '../utils/ot.js';
import { getMonacoLanguage } from '../utils/languages.js';
import RemoteCursor from './RemoteCursor.jsx';

const decorationCollections = new Map();

function Editor({
  code, language, isRemoteChange,
  remoteCursors, onCodeChange, onCursorMove,
}) {
  const editorRef   = useRef(null);
  const monacoRef   = useRef(null);
  const suppressRef = useRef(false);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme('coderoom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment',  foreground: '546E7A', fontStyle: 'italic' },
        { token: 'keyword',  foreground: 'C792EA' },
        { token: 'string',   foreground: 'C3E88D' },
        { token: 'number',   foreground: 'F78C6C' },
        { token: 'type',     foreground: '82AAFF' },
        { token: 'function', foreground: '82AAFF' },
        { token: 'variable', foreground: 'EEFFFF' },
        { token: 'operator', foreground: '89DDFF' },
      ],
      colors: {
        'editor.background':                  '#0D0F14',
        'editor.foreground':                  '#E8EAF2',
        'editor.lineHighlightBackground':     '#1E2130',
        'editorLineNumber.foreground':        '#3A3F55',
        'editorLineNumber.activeForeground':  '#6C8EFF',
        'editor.selectionBackground':         '#6C8EFF33',
        'editorCursor.foreground':            '#4AE8A0',
        'editor.inactiveSelectionBackground': '#6C8EFF1A',
      },
    });
    monaco.editor.setTheme('coderoom-dark');

    editor.onDidChangeCursorPosition((e) => {
      onCursorMove({ lineNumber: e.position.lineNumber, column: e.position.column });
    });
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !isRemoteChange.current) return;
    if (editor.getValue() === code) return;
    suppressRef.current = true;
    const position   = editor.getPosition();
    const selections = editor.getSelections();
    editor.setValue(code);
    if (position)   editor.setPosition(position);
    if (selections) editor.setSelections(selections);
    suppressRef.current = false;
  }, [code, isRemoteChange]);

  const handleChange = useCallback((value, event) => {
    if (suppressRef.current)    return;
    if (isRemoteChange.current) return;
    const delta = monacoChangeToDelta(event.changes);
    onCodeChange(value, delta);
  }, [onCodeChange, isRemoteChange]);

  // Remote cursor decorations
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const activeIds = new Set();
    remoteCursors?.forEach(({ socketId, color, position }) => {
      if (!position || !socketId) return;
      activeIds.add(socketId);
      const colorHex = (color || '#6C8EFF').replace('#', '');
      const styleId  = `cr-cursor-${colorHex}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id    = styleId;
        style.textContent = `.cr-cursor-${colorHex}{border-left:2px solid #${colorHex}!important;margin-left:-1px;}`;
        document.head.appendChild(style);
      }
      if (!decorationCollections.has(socketId)) {
        decorationCollections.set(socketId, editor.createDecorationsCollection([]));
      }
      decorationCollections.get(socketId).set([{
        range: new monaco.Range(position.lineNumber, 1, position.lineNumber, 1),
        options: {
          isWholeLine: false,
          linesDecorationsClassName: `cr-cursor-${colorHex}`,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      }]);
    });
    decorationCollections.forEach((col, sid) => {
      if (!activeIds.has(sid)) { col.clear(); decorationCollections.delete(sid); }
    });
  }, [remoteCursors]);

  return (
    <div className="w-full h-full relative">
      <MonacoEditor
      key={language}
        height="100%"
        language={getMonacoLanguage(language)}
        value={code}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
          bracketPairColorization: { enabled: true },
          formatOnPaste: true,
          automaticLayout: true,
        }}
      />
      <RemoteCursor editorRef={editorRef} remoteCursors={remoteCursors} />
    </div>
  );
}

export default Editor;