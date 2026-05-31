import { useState, useRef, useEffect } from 'react';
import Toolbar from './Toolbar.jsx';

function PresenceBar({
  roomId, users, connected, language, onLanguageChange,
  chatOpen, unread, onToggleChat,
  running, onRun,
  currentUsername, onLeave,
}) {
  const [copyLabel,        setCopyLabel]        = useState('Copy Link');
  const [showParticipants, setShowParticipants] = useState(false);
  const participantsRef = useRef(null);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyLabel('Copied!');
    setTimeout(() => setCopyLabel('Copy Link'), 2000);
  };

  useEffect(() => {
    const handler = (e) => {
      if (participantsRef.current && !participantsRef.current.contains(e.target))
        setShowParticipants(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const me = users.find((u) => u.username === currentUsername);

  return (
    <header className="h-12 bg-[#161920] border-b border-[#252832] flex items-center justify-between px-4 flex-shrink-0 relative">

      {/* Left */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#4AE8A0] shadow-[0_0_6px_#4AE8A0]" />
          <span className="text-[#4AE8A0] font-bold text-sm tracking-widest uppercase">
            CodeRoom
          </span>
        </div>
        <div className="h-5 w-px bg-[#252832]" />
        <div className="flex items-center gap-2 bg-[#0D0F14] border border-[#252832] rounded-lg px-3 py-1">
          <span className="text-[#5A5F75] text-xs font-mono">room/</span>
          <span className="text-[#6C8EFF] text-xs font-mono font-bold tracking-widest">{roomId}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">

        {/* Connection */}
        <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded-lg border ${
          connected
            ? 'bg-[#1A2A1F] border-[#2A4A35] text-[#4AE8A0]'
            : 'bg-[#2A1A1A] border-[#4A2A2A] text-red-400'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#4AE8A0] animate-pulse' : 'bg-red-400'}`} />
          {connected ? `${users.length} online` : 'Disconnected'}
        </div>

        {/* Current user pill */}
        {me && (
          <div
            style={{ background: me.color + '20', borderColor: me.color, padding: '0 10px', minWidth: '36px' }}
            className="h-8 rounded-full border-2 flex items-center justify-center cursor-default select-none"
          >
            <span style={{ color: me.color }} className="text-[10px] font-bold whitespace-nowrap">
              {me.username}
            </span>
          </div>
        )}

        {/* Participants button + dropdown */}
        <div className="relative" ref={participantsRef}>
          <button
            onClick={() => setShowParticipants((p) => !p)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
              showParticipants
                ? 'bg-[#1A1D2A] border-[#6C8EFF] text-[#6C8EFF]'
                : 'bg-[#252832] border-[#252832] text-[#5A5F75] hover:text-[#E8EAF2] hover:border-[#3A3F55]'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="font-medium">{users.length}</span>
          </button>

          {showParticipants && (
            <div className="absolute top-10 right-0 w-64 bg-[#161920] border border-[#252832] rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-[#252832] flex items-center justify-between">
                <span className="text-[#E8EAF2] text-sm font-semibold">Participants</span>
                <span className="text-[#5A5F75] text-xs bg-[#252832] px-2 py-0.5 rounded-full">
                  {users.length} online
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto py-2">
                {users.map((user) => {
                  const isMe = user.username === currentUsername;
                  return (
                    <div key={user.socketId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1E2130] transition-colors">
                      <div
                        style={{ background: user.color + '20', borderColor: user.color }}
                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      >
                        <span style={{ color: user.color }}>
                          {user.username.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#E8EAF2] text-sm font-medium truncate">
                          {user.username}
                          {isMe && <span className="ml-2 text-[10px] text-[#5A5F75] font-normal">(you)</span>}
                        </p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-[#4AE8A0] flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-[#252832]" />
        <Toolbar language={language} onLanguageChange={onLanguageChange} />
        <div className="h-5 w-px bg-[#252832]" />

        {/* Copy link */}
        <button
          onClick={copyLink}
          className="flex items-center gap-2 bg-[#252832] hover:bg-[#2E3241] text-[#E8EAF2] text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          {copyLabel}
        </button>

        {/* Chat toggle */}
        <button
          onClick={onToggleChat}
          className={`relative flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium border ${
            chatOpen
              ? 'bg-[#1A1D2A] border-[#6C8EFF] text-[#6C8EFF]'
              : 'bg-[#252832] border-[#252832] text-[#E8EAF2] hover:bg-[#2E3241]'
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Chat
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FF8C6A] text-[#0D0F14] text-[9px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* Run button */}
        <button
          onClick={onRun}
          disabled={running}
          className="flex items-center gap-2 bg-[#4AE8A0] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-[#0D0F14] text-xs px-4 py-1.5 rounded-lg transition-all font-bold"
        >
          {running ? (
            <>
              <div className="w-3 h-3 border-2 border-[#0D0F14] border-t-transparent rounded-full animate-spin" />
              Running
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Run
            </>
          )}
        </button>

        {/* Leave room button */}
        <button
          onClick={onLeave}
          title="Leave room"
          className="flex items-center gap-1.5 bg-[#2A1A1A] hover:bg-[#3A2020] border border-[#4A2A2A] text-red-400 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Leave
        </button>

      </div>
    </header>
  );
}

export default PresenceBar;