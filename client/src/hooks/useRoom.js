import { useEffect, useState, useCallback, useRef } from 'react';
import { EVENTS } from '@shared/constants.js';
import { useSocket } from './useSocket.js';
import { getDefaultCode } from '../utils/languages.js';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useRoom = (roomId, username) => {
  const { socket, connected } = useSocket(!!username);

  const [users, setUsers]       = useState([]);
  const [code, setCode]         = useState('');
  const [language, setLanguage] = useState('javascript');
  const [roomInfo, setRoomInfo] = useState(null);
  const [joined, setJoined]     = useState(false);
  const [messages, setMessages] = useState([]);

  const isRemoteChange  = useRef(false);
  const languageRef     = useRef('javascript');
  const codeRef         = useRef('');
  const socketRef       = useRef(null);
  const roomIdRef       = useRef(roomId);
  const usernameRef     = useRef(username);
  const usersRef        = useRef([]);
  const codePerLanguage = useRef({});

  useEffect(() => { languageRef.current = language; }, [language]);
  useEffect(() => { codeRef.current     = code;     }, [code]);
  useEffect(() => { roomIdRef.current   = roomId;   }, [roomId]);
  useEffect(() => { usernameRef.current = username; }, [username]);
  useEffect(() => { usersRef.current    = users;    }, [users]);
  useEffect(() => { socketRef.current   = socket;   }, [socket]);

  // ── Join room ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !connected || !roomId || !username || joined) return;

    const fetchAndJoin = async () => {
      try {
        const res = await fetch(`${API_URL}/api/rooms/${roomId}`);
        const data = await res.json();
        if (!res.ok) return;

        setRoomInfo(data);
        const initialLang = data.language || 'javascript';
        setLanguage(initialLang);
        languageRef.current = initialLang;

        socket.emit(EVENTS.JOIN_ROOM,    { roomId, username });
        socket.emit(EVENTS.CODE_SYNC,    { roomId });
        socket.emit(EVENTS.CHAT_HISTORY, { roomId });

        setJoined(true);
      } catch (err) {
        console.error('[useRoom] fetchAndJoin error:', err);
      }
    };

    fetchAndJoin();
  }, [socket, connected, roomId, username, joined]);

  // ── Re-join after reconnect ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const onReconnect = () => {
      if (roomIdRef.current && usernameRef.current) {
        socket.emit(EVENTS.JOIN_ROOM,    { roomId: roomIdRef.current, username: usernameRef.current });
        socket.emit(EVENTS.CODE_SYNC,    { roomId: roomIdRef.current });
        socket.emit(EVENTS.CHAT_HISTORY, { roomId: roomIdRef.current });
      }
    };
    socket.io.on('reconnect', onReconnect);
    return () => socket.io.off('reconnect', onReconnect);
  }, [socket]);

  // ── Code sync (initial load) ──────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const onCodeSync = ({ code: incoming }) => {
      // ?? not || — empty string is valid
      const finalCode = incoming ?? getDefaultCode(languageRef.current);
      isRemoteChange.current = true;
      setCode(finalCode);
      codeRef.current = finalCode;
      codePerLanguage.current[languageRef.current] = finalCode;
      isRemoteChange.current = false;
    };
    socket.on(EVENTS.CODE_SYNC, onCodeSync);
    return () => socket.off(EVENTS.CODE_SYNC, onCodeSync);
  }, [socket]);

  // ── Per-language code from server (on join) ───────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const onPerLangSync = ({ perLangCode }) => {
      if (!perLangCode) return;
      codePerLanguage.current = { ...perLangCode, ...codePerLanguage.current };
      console.log('[useRoom] perLangCode loaded:', Object.keys(perLangCode));
    };
    socket.on('code_per_language_sync', onPerLangSync);
    return () => socket.off('code_per_language_sync', onPerLangSync);
  }, [socket]);

  // ── Remote code changes ───────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const onCodeChange = ({ code: incoming }) => {
      isRemoteChange.current = true;
      setCode(incoming);
      codeRef.current = incoming;
      codePerLanguage.current[languageRef.current] = incoming;
      isRemoteChange.current = false;
    };
    socket.on(EVENTS.CODE_CHANGE, onCodeChange);
    return () => socket.off(EVENTS.CODE_CHANGE, onCodeChange);
  }, [socket]);

  // ── Remote language changes ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onLang = ({ language: lang, code: incomingCode }) => {
      console.log('[useRoom] LANGUAGE_CHANGE received:', lang, '| code:', !!incomingCode);

      setLanguage(lang);
      languageRef.current = lang;

      const newCode = incomingCode ?? getDefaultCode(lang);

      isRemoteChange.current = true;
      setCode(newCode);
      codeRef.current = newCode;
      codePerLanguage.current[lang] = newCode;
      isRemoteChange.current = false;
    };

    socket.on(EVENTS.LANGUAGE_CHANGE, onLang);
    return () => socket.off(EVENTS.LANGUAGE_CHANGE, onLang);
  }, [socket]);

  // ── User list ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const onRoomUsers = ({ users: list }) => {
      setUsers(list);
      usersRef.current = list;
    };
    const onUserLeft = ({ socketId }) => {
      setUsers((prev) => {
        const next = prev.filter((u) => u.socketId !== socketId);
        usersRef.current = next;
        return next;
      });
    };
    socket.on(EVENTS.ROOM_USERS, onRoomUsers);
    socket.on(EVENTS.USER_LEFT,  onUserLeft);
    return () => {
      socket.off(EVENTS.ROOM_USERS, onRoomUsers);
      socket.off(EVENTS.USER_LEFT,  onUserLeft);
    };
  }, [socket]);

  // ── Chat history ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const onHistory = ({ messages: msgs }) => setMessages(msgs || []);
    socket.on(EVENTS.CHAT_HISTORY, onHistory);
    return () => socket.off(EVENTS.CHAT_HISTORY, onHistory);
  }, [socket]);

  // ── Live chat messages ────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const onMessage = (msg) =>
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    socket.on(EVENTS.CHAT_MESSAGE, onMessage);
    return () => socket.off(EVENTS.CHAT_MESSAGE, onMessage);
  }, [socket]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleCodeChange = useCallback((newCode, delta) => {
    if (isRemoteChange.current) return;
    setCode(newCode);
    codeRef.current = newCode;
    codePerLanguage.current[languageRef.current] = newCode;
    socketRef.current?.emit(EVENTS.CODE_CHANGE, {
      roomId: roomIdRef.current,
      delta,
      code:   newCode,
    });
  }, []);

  const handleLanguageChange = useCallback((lang) => {
    console.log('[useRoom] handleLanguageChange:', lang);

    const currentLang = languageRef.current;
    const currentCode = codeRef.current;

    // Save current code before switching
    if (currentLang) {
      codePerLanguage.current[currentLang] = currentCode ?? '';
      socketRef.current?.emit('save_language_code', {
        roomId:   roomIdRef.current,
        language: currentLang,
        code:     currentCode ?? '',
      });
    }

    const savedCode = codePerLanguage.current[lang];
    const newCode   = savedCode ?? getDefaultCode(lang);

    console.log(`[useRoom] ${currentLang} → ${lang} | savedCode exists: ${savedCode !== undefined}`);

    setLanguage(lang);
    languageRef.current = lang;

    isRemoteChange.current = true;
    setCode(newCode);
    codeRef.current = newCode;
    isRemoteChange.current = false;

    // onLang listener destructures { code: incomingCode }
    // sending 'savedCode' meant incomingCode was always undefined
    socketRef.current?.emit(EVENTS.LANGUAGE_CHANGE, {
      roomId:   roomIdRef.current,
      language: lang,
      code:     newCode,  // always send resolved code, never null/undefined
    });
  }, []);

  const handleCursorMove = useCallback((position) => {
    const me = usersRef.current.find((u) => u.socketId === socketRef.current?.id);
    socketRef.current?.emit(EVENTS.CURSOR_MOVE, {
      roomId:   roomIdRef.current,
      username: usernameRef.current,
      color:    me?.color || '#4AE8A0',
      position,
    });
  }, []);

  const sendMessage = useCallback((text) => {
    if (!text?.trim()) return;
    const me = usersRef.current.find((u) => u.socketId === socketRef.current?.id);
    socketRef.current?.emit(EVENTS.CHAT_MESSAGE, {
      roomId:   roomIdRef.current,
      username: usernameRef.current,
      color:    me?.color || '#4AE8A0',
      text:     text.trim(),
    });
  }, []);

  return {
    socket, connected, users, code, language,
    roomInfo, joined, messages, isRemoteChange,
    handleCodeChange, handleLanguageChange,
    handleCursorMove, sendMessage,
  };
};