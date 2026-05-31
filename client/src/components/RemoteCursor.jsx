import { useEffect, useRef } from 'react';

/**
 * RemoteCursor — renders floating username labels over the Monaco editor.
 *
 * Strategy: a zero-pointer-events div overlay sitting on top of the Monaco
 * container. We use editor.getScrolledVisiblePosition() to convert each
 * remote cursor's { lineNumber, column } into pixel coordinates, then
 * absolutely position a label div at those coords.
 *
 * This component is rendered inside Editor.jsx and receives:
 *   - editorRef: ref to the Monaco editor instance
 *   - remoteCursors: array of { socketId, username, color, position }
 */
function RemoteCursor({ editorRef, remoteCursors }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current;
    const overlay = overlayRef.current;
    if (!editor || !overlay) return;

    // Redraw all labels
    const draw = () => {
      overlay.innerHTML = '';

      remoteCursors.forEach(({ socketId, username, color, position }) => {
        if (!position) return;

        try {
          const coords = editor.getScrolledVisiblePosition({
            lineNumber: position.lineNumber,
            column:     position.column,
          });

          // Null means the line is scrolled out of view — skip it
          if (!coords) return;

          // Cursor caret line
          const caret = document.createElement('div');
          caret.style.cssText = `
            position:   absolute;
            top:        ${coords.top}px;
            left:       ${coords.left}px;
            width:      2px;
            height:     18px;
            background: ${color};
            border-radius: 1px;
            pointer-events: none;
            z-index:    1000;
            animation:  cursorBlink 1.2s ease infinite;
          `;
          overlay.appendChild(caret);

          // Username label above the caret
          const label = document.createElement('div');
          label.style.cssText = `
            position:      absolute;
            top:           ${coords.top - 20}px;
            left:          ${coords.left}px;
            background:    ${color};
            color:         #0D0F14;
            font-size:     10px;
            font-weight:   700;
            padding:       2px 6px;
            border-radius: 3px 3px 3px 0;
            pointer-events: none;
            white-space:   nowrap;
            z-index:       1001;
            font-family:   Inter, sans-serif;
            line-height:   16px;
            box-shadow:    0 2px 6px rgba(0,0,0,0.4);
          `;
          label.textContent = username;
          overlay.appendChild(label);

        } catch (e) {
          // Position not currently visible — skip silently
        }
      });
    };

    // Draw immediately
    draw();

    // Redraw on scroll so labels track correctly
    const scrollDisposable = editor.onDidScrollChange(draw);

    // Redraw on layout change (window resize)
    const layoutDisposable = editor.onDidLayoutChange(draw);

    return () => {
      scrollDisposable.dispose();
      layoutDisposable.dispose();
    };
  }, [editorRef, remoteCursors]);

  return (
    <>
      {/* Blink animation injected once */}
      <style>{`
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>

      <div
        ref={overlayRef}
        aria-hidden="true"
        style={{
          position:       'absolute',
          inset:          0,
          pointerEvents:  'none',
          overflow:       'hidden',
          zIndex:         10,
        }}
      />
    </>
  );
}

export default RemoteCursor;