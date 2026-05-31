import { useState, useEffect, useRef, useCallback } from 'react';

const MIN_WIDTH = 200;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 288;

function Chat({ messages, onSend, currentUsername, isOpen, onToggle }) {
  const [width, setWidth]     = useState(DEFAULT_WIDTH);
  const [input, setInput]     = useState('');
  const bottomRef             = useRef(null);
  const inputRef              = useRef(null);
  const isDragging            = useRef(false);
  const dragStartX            = useRef(0);
  const dragStartW            = useRef(0);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const onDragStart = useCallback((e) => {
    isDragging.current  = true;
    dragStartX.current  = e.clientX;
    dragStartW.current  = width;
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }, [width]);

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      // Dragging left increases width, right decreases
      const delta = dragStartX.current - e.clientX;
      const newW  = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartW.current + delta));
      setWidth(newW);
    };
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current             = false;
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []);

  // ── Scroll + focus ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ width, minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH }}
      className="flex flex-col bg-[#161920] border-l border-[#252832] flex-shrink-0 relative"
    >
      {/* ── Drag handle — left edge ── */}
      <div
        onMouseDown={onDragStart}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 group hover:bg-[#6C8EFF] transition-colors"
        title="Drag to resize chat"
      >
        {/* Visual grip dots in center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-[#6C8EFF]" />
          ))}
        </div>
      </div>

      {/* ── Chat header ── */}
      <div className="h-10 flex items-center justify-between px-4 border-b border-[#252832] flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5A5F75" strokeWidth="2" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-[#5A5F75] text-xs font-semibold uppercase tracking-widest">
            Room Chat
          </span>
          <span className="text-[#3A3F55] text-xs">
            {messages.filter((m) => m.type === 'message').length}
          </span>
        </div>
        <button
          onClick={onToggle}
          className="text-[#3A3F55] hover:text-[#E8EAF2] transition-colors"
          aria-label="Close chat"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center mt-8">
            <p className="text-[#3A3F55] text-xs text-center">
              No messages yet.<br />Say hello!
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe     = msg.username === currentUsername;
          const isSystem = msg.type === 'system';

          if (isSystem) {
            return (
              <div key={msg._id || i} className="flex justify-center">
                <span className="text-[#3A3F55] text-xs px-3 py-1 bg-[#1A1D2A] rounded-full">
                  {msg.text}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg._id || i}
              className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}
            >
              {!isMe && (
                <div className="flex items-baseline gap-2 px-1">
                  <span style={{ color: msg.color || '#6C8EFF' }} className="text-xs font-bold">
                    {msg.username}
                  </span>
                  {msg.createdAt && (
                    <span className="text-[#3A3F55] text-[10px]">{formatTime(msg.createdAt)}</span>
                  )}
                </div>
              )}

              <div
                style={isMe ? {
                  background:  (msg.color || '#6C8EFF') + '20',
                  borderColor: (msg.color || '#6C8EFF') + '40',
                } : {}}
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed break-words border ${
                  isMe
                    ? 'rounded-tr-sm text-[#E8EAF2]'
                    : 'bg-[#1E2130] border-[#252832] text-[#E8EAF2] rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>

              {isMe && msg.createdAt && (
                <span className="text-[#3A3F55] text-[10px] px-1">{formatTime(msg.createdAt)}</span>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="p-3 border-t border-[#252832] flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#0D0F14] border border-[#252832] rounded-xl px-3 py-2 focus-within:border-[#4AE8A0] transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            maxLength={500}
            className="flex-1 bg-transparent text-[#E8EAF2] text-xs outline-none placeholder:text-[#3A3F55]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="text-[#4AE8A0] disabled:text-[#3A3F55] transition-colors flex-shrink-0"
            aria-label="Send message"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-[#3A3F55] text-[10px] mt-1.5 text-right">Enter to send</p>
      </div>
    </div>
  );
}

export default Chat;