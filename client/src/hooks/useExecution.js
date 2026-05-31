import { useState, useEffect, useCallback } from 'react';
import { EVENTS }            from '@shared/constants.js';
import { getOneCompilerLang } from '../utils/languages.js';

export const useExecution = (socket, roomId, code, language) => {
  const [result,  setResult]  = useState(null);
  const [running, setRunning] = useState(false);

  // Listen for results from server (broadcast to whole room)
  useEffect(() => {
    if (!socket) return;

    const onResult = (data) => {
      if (data.status === 'running') {
        setRunning(true);
        setResult(null);
        return;
      }
      setRunning(false);
      setResult(data);
    };

    socket.on(EVENTS.CODE_RESULT, onResult);
    return () => socket.off(EVENTS.CODE_RESULT, onResult);
  }, [socket]);

  const runCode = useCallback(async () => {
    if (!code?.trim() || running) return;

    setRunning(true);
    setResult(null);

    try {
      const res = await fetch('/api/execute', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          code,
          language,                              // our internal id
          onecompilerLang: getOneCompilerLang(language), // mapped for OneCompiler
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRunning(false);
        setResult({
          status:   'Error',
          statusId: -1,
          stderr:   data.error || 'Execution request failed.',
          stdout:   '',
          time:     null,
          memory:   null,
        });
      }
      // If ok — result arrives via socket from server

    } catch (err) {
      setRunning(false);
      setResult({
        status:   'Error',
        statusId: -1,
        stderr:   'Could not reach the server. Is it running?',
        stdout:   '',
        time:     null,
        memory:   null,
      });
    }
  }, [code, language, roomId, running]);

  return { runCode, running, result };
};