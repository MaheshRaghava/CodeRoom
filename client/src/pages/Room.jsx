import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate }  from 'react-router-dom';
import { EVENTS }       from '@shared/constants.js';
import { useRoom }      from '../hooks/useRoom.js';
import { useExecution } from '../hooks/useExecution.js';
import Editor           from '../components/Editor.jsx';
import PresenceBar      from '../components/PresenceBar.jsx';
import Chat             from '../components/Chat.jsx';
import Output           from '../components/Output.jsx';
import { disconnectSocket } from '../hooks/useSocket.js';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function Room() {
  const { roomId } = useParams();
  const navigate   = useNavigate();

  const [usernameInput, setUsernameInput] = useState(
    sessionStorage.getItem('username') || ''
  );
  const [submitted, setSubmitted]         = useState(
    !!sessionStorage.getItem('username')
  );
  const [nameError, setNameError]         = useState('');
  const [checkingName, setCheckingName]   = useState(false);

  const [remoteCursors, setRemoteCursors] = useState([]);
  const [chatOpen, setChatOpen]           = useState(true);
  const [unread, setUnread]               = useState(0);
  const [error, setError]                 = useState('');

  // ── Draggable terminal height ─────────────────────────────────────────────
  const [terminalHeight, setTerminalHeight] = useState(220);
  const [terminalOpen, setTerminalOpen]     = useState(false);
  const isDragging  = useRef(false);
  const dragStartY  = useRef(0);
  const dragStartH  = useRef(0);

  const onDragStart = useCallback((e) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartH.current = terminalHeight;
    document.body.style.cursor    = 'row-resize';
    document.body.style.userSelect = 'none';
  }, [terminalHeight]);

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      const delta  = dragStartY.current - e.clientY;
      const newH   = Math.min(500, Math.max(80, dragStartH.current + delta));
      setTerminalHeight(newH);
    };
    const onUp = () => {
      isDragging.current            = false;
      document.body.style.cursor    = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []);

  const {
    socket, connected, users, code, language,
    roomInfo, joined, messages, isRemoteChange,
    handleCodeChange, handleLanguageChange,
    handleCursorMove, sendMessage,
  } = useRoom(roomId, submitted ? usernameInput : null);

  const { runCode, running, result } = useExecution(
    socket, roomId, code, language
  );

  // Remote cursors
  useEffect(() => {
    if (!socket) return;
    const onCursorUpdate = ({ socketId, username, color, position }) => {
      setRemoteCursors((prev) => [
        ...prev.filter((c) => c.socketId !== socketId),
        { socketId, username, color, position },
      ]);
    };
    const onUserLeft = ({ socketId }) =>
      setRemoteCursors((prev) => prev.filter((c) => c.socketId !== socketId));
    socket.on(EVENTS.CURSOR_UPDATE, onCursorUpdate);
    socket.on(EVENTS.USER_LEFT,     onUserLeft);
    return () => {
      socket.off(EVENTS.CURSOR_UPDATE, onCursorUpdate);
      socket.off(EVENTS.USER_LEFT,     onUserLeft);
    };
  }, [socket]);

  // Unread badge
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (!chatOpen && last?.type === 'message') setUnread((n) => n + 1);
  }, [messages]); // eslint-disable-line

  // Auto-open terminal on run
  useEffect(() => {
    if (running) setTerminalOpen(true);
  }, [running]);

  const handleToggleChat = () => {
    setChatOpen((o) => !o);
    setUnread(0);
  };

  // Leave room
  const handleLeave = () => {
    sessionStorage.removeItem('username');
    disconnectSocket();
    navigate('/');
  };

  // Check username uniqueness then join
  const handleJoinSubmit = async () => {
    if (!usernameInput.trim()) {
      setNameError('Please enter your name');
      return;
    }
    setCheckingName(true);
    setNameError('');
    try {
      const res = await fetch(
        `${API_URL}/api/rooms/${roomId}/check-username?username=${encodeURIComponent(usernameInput.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        setNameError(data.error || 'Could not verify username');
        setCheckingName(false);
        return;
      }

      if (!data.available) {
        setNameError(`"${usernameInput.trim()}" is already in this room. Choose a different name.`);
        setCheckingName(false);
        return;
      }

      sessionStorage.setItem('username', usernameInput.trim());
      setSubmitted(true);
    } catch (err) {
      setNameError('Server error — is the backend running?');
    } finally {
      setCheckingName(false);
    }
  };

  // ── Name entry screen ─────────────────────────────────────────────────────
  if (!submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0F14] px-4">
        <div className="bg-[#161920] border border-[#252832] rounded-2xl p-8 w-full max-w-md">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-[#4AE8A0] shadow-[0_0_6px_#4AE8A0]" />
            <span className="text-[#4AE8A0] font-bold text-sm tracking-widest uppercase">
              CodeRoom
            </span>
          </div>
          <h2 className="text-[#E8EAF2] text-lg font-bold mb-1">Join Room</h2>
          <p className="text-[#5A5F75] text-sm mb-6">
            Room <span className="text-[#6C8EFF] font-mono">{roomId}</span> is ready
          </p>
          <input
            autoFocus
            type="text"
            value={usernameInput}
            onChange={(e) => { setUsernameInput(e.target.value); setNameError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleJoinSubmit(); }}
            placeholder="Your name..."
            maxLength={20}
            className="w-full bg-[#0D0F14] border border-[#252832] text-[#E8EAF2] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#4AE8A0] transition-colors mb-4 placeholder:text-[#3A3F55]"
          />
          {nameError && (
            <div className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
              {nameError}
            </div>
          )}
          <button
            onClick={handleJoinSubmit}
            disabled={checkingName}
            className="w-full bg-[#4AE8A0] text-[#0D0F14] py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all mb-3 disabled:opacity-50"
          >
            {checkingName ? 'Checking...' : 'Join Room'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-[#252832] text-[#E8EAF2] py-3 rounded-xl font-bold text-sm hover:bg-[#2E3241] transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Main room UI ──────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-[#0D0F14] overflow-hidden">

      <PresenceBar
        roomId={roomId}
        users={users}
        connected={connected}
        language={language}
        onLanguageChange={handleLanguageChange}
        chatOpen={chatOpen}
        unread={unread}
        onToggleChat={handleToggleChat}
        running={running}
        onRun={runCode}
        currentUsername={usernameInput}
        onLeave={handleLeave}
      />

      <div className="flex flex-1 overflow-hidden">

        {/* Left column — editor + terminal */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Editor — fills remaining space above terminal */}
          <div className="flex-1 overflow-hidden min-h-0">
            {joined ? (
              <Editor
                code={code}
                language={language}
                isRemoteChange={isRemoteChange}
                remoteCursors={remoteCursors}
                onCodeChange={handleCodeChange}
                onCursorMove={handleCursorMove}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="flex items-center gap-3 text-[#5A5F75]">
                  <div className="w-2 h-2 bg-[#4AE8A0] rounded-full animate-pulse" />
                  <span className="text-sm">Joining room...</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Draggable divider + terminal ── */}
          {terminalOpen && (
            <>
              {/* Drag handle — the line between editor and terminal */}
              <div
                onMouseDown={onDragStart}
                className="h-1.5 bg-[#252832] hover:bg-[#6C8EFF] transition-colors cursor-row-resize flex-shrink-0 flex items-center justify-center group"
                title="Drag to resize terminal"
              >
                {/* Visual grip dots */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {[0,1,2].map((i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-[#6C8EFF]" />
                  ))}
                </div>
              </div>

              {/* Terminal panel — NO X button */}
              <div
                style={{ height: terminalHeight }}
                className="bg-[#161920] flex flex-col flex-shrink-0 overflow-hidden"
              >
                {/* Terminal header — no close button */}
                <div className="h-8 flex items-center px-4 border-b border-[#252832] flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      running
                        ? 'bg-[#F7C948] animate-pulse'
                        : result?.statusId === 3
                        ? 'bg-[#4AE8A0]'
                        : result
                        ? 'bg-[#FF8C6A]'
                        : 'bg-[#3A3F55]'
                    }`} />
                    <span className="text-[#5A5F75] text-[10px] font-semibold uppercase tracking-widest">
                      Terminal
                    </span>
                  </div>
                  {/* No X button here — terminal stays open until user navigates away */}
                </div>

                <div className="flex-1 overflow-hidden min-h-0">
                  <Output result={result} running={running} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right — chat panel */}
        <Chat
          messages={messages}
          onSend={sendMessage}
          currentUsername={usernameInput}
          isOpen={chatOpen}
          onToggle={handleToggleChat}
        />
      </div>

      {/* Status bar */}
      <footer className="h-6 bg-[#161920] border-t border-[#252832] flex items-center px-4 gap-3 flex-shrink-0">
        <LanguageDot language={language} />
        <span className="text-[#3A3F55] text-xs font-mono">{language}</span>
        <span className="text-[#3A3F55] text-xs">·</span>
        <span className="text-[#3A3F55] text-xs">UTF-8</span>
        <span className="text-[#3A3F55] text-xs">·</span>
        <span className="text-[#3A3F55] text-xs">Monaco Editor</span>
        {result && (
          <>
            <span className="text-[#3A3F55] text-xs">·</span>
            <span className={`text-xs ${result.statusId === 3 ? 'text-[#4AE8A0]' : 'text-[#FF8C6A]'}`}>
              {result.status}
              {result.time && ` · ${result.time}`}
            </span>
          </>
        )}
        <div className="ml-auto text-[#3A3F55] text-xs">{roomInfo?.name}</div>
      </footer>
    </div>
  );
}

function LanguageDot({ language }) {
  const colors = {
    javascript: '#F7C948', typescript: '#3178C6',
    python:     '#4AE8A0', rust:       '#FF8C6A',
    go:         '#38BDF8', cpp:        '#6C8EFF',
    java:       '#E879F9',
  };
  return (
    <div style={{ background: colors[language] || '#5A5F75' }} className="w-2 h-2 rounded-full" />
  );
}

export default Room;