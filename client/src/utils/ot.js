// Operational Transform helpers
// Yjs handles the heavy CRDT logic — these are lightweight
// utilities for working with Monaco delta operations

/**
 * Convert a Monaco model content change event
 * into a serializable delta we can send over the socket
 */
export const monacoChangeToDelta = (changes) => {
  return changes.map((change) => ({
    range: {
      startLineNumber: change.range.startLineNumber,
      startColumn: change.range.startColumn,
      endLineNumber: change.range.endLineNumber,
      endColumn: change.range.endColumn,
    },
    text: change.text,
    rangeLength: change.rangeLength,
  }));
};

/**
 * Apply a received delta to a Monaco editor model
 * Only called for remote changes
 */
export const applyDeltaToMonaco = (editor, delta) => {
  if (!editor || !delta?.length) return;

  const model = editor.getModel();
  if (!model) return;

  // Build Monaco edit operations from the delta
  const edits = delta.map((op) => ({
    range: op.range,
    text: op.text,
    forceMoveMarkers: true,
  }));

  // Apply without triggering our own onChange listener
  model.applyEdits(edits);
};

/**
 * Generate a random hex color for a user cursor
 */
export const generateCursorColor = (index) => {
  const colors = [
    '#4AE8A0',
    '#6C8EFF',
    '#FF8C6A',
    '#F7C948',
    '#E879F9',
    '#38BDF8',
  ];
  return colors[index % colors.length];
};