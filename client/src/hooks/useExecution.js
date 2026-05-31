import { useState, useEffect, useCallback } from 'react';
import { EVENTS }             from '@shared/constants.js';
import { getOneCompilerLang } from '../utils/languages.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useExecution = (socket, roomId, code, language) => {
  const [result,  setResult]  = useState(null);
  const [running, setRunning] = useState(false);

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
      const res = await fetch(`${API_URL}/api/execute`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          code,
          language,
          onecompilerLang: getOneCompilerLang(language),
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
    } catch (err) {
      setRunning(false);
      setResult({
        status:   'Error',
        statusId: -1,
        stderr:   `Could not reach server at ${API_URL}. Check your connection.`,
        stdout:   '',
        time:     null,
        memory:   null,
      });
    }
  }, [code, language, roomId, running]);

  return { runCode, running, result };
};