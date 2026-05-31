import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  // 'create' | 'join'
  const [face, setFace]         = useState('create');
  const [flipping, setFlipping] = useState(false);

  const [createName, setCreateName]   = useState('');
  const [joinName, setJoinName]       = useState('');
  const [joinRoomId, setJoinRoomId]   = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const flip = (to) => {
    if (flipping || face === to) return;
    setFlipping(true);
    setError('');
    setTimeout(() => {
      setFace(to);
      setFlipping(false);
    }, 350); // half of the CSS transition
  };

  // ── Create room ───────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!createName.trim()) { setError('Please enter your name'); return; }
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/rooms', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: createName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create room'); return; }
      sessionStorage.setItem('username', createName.trim());
      navigate(`/room/${data.roomId}`);
    } catch {
      setError('Server error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  // ── Join room ─────────────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!joinName.trim())   { setError('Please enter your name'); return; }
    if (!joinRoomId.trim()) { setError('Please enter a room ID'); return; }
    setError('');
    setLoading(true);
    try {
      // Check room exists
      const roomRes  = await fetch(`/api/rooms/${joinRoomId.trim()}`);
      const roomData = await roomRes.json();
      if (!roomRes.ok) { setError(roomData.error || 'Room not found'); return; }

      // Check username not taken
      const nameRes  = await fetch(
        `/api/rooms/${joinRoomId.trim()}/check-username?username=${encodeURIComponent(joinName.trim())}`
      );
      const nameData = await nameRes.json();
      if (!nameData.available) {
        setError(`"${joinName.trim()}" is already in this room. Choose a different name.`);
        return;
      }

      sessionStorage.setItem('username', joinName.trim());
      navigate(`/room/${joinRoomId.trim()}`);
    } catch {
      setError('Server error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const isCreate = face === 'create';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0F14] px-4">

      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: isCreate
            ? 'radial-gradient(ellipse 60% 40% at 50% 20%, #4AE8A020 0%, transparent 70%)'
            : 'radial-gradient(ellipse 60% 40% at 50% 20%, #6C8EFF20 0%, transparent 70%)',
          transition: 'background 0.7s ease',
        }}
      />

      <div className="w-full max-w-md relative" style={{ perspective: '1200px' }}>

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-[#4AE8A0] shadow-[0_0_12px_#4AE8A0]" />
            <span className="text-[#4AE8A0] font-bold text-2xl tracking-widest uppercase">
              CodeRoom
            </span>
          </div>
          <p className="text-[#5A5F75] text-sm">Real-time collaborative code editor</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#0D0F14] border border-[#252832] rounded-2xl p-1 mb-6">
          <button
            onClick={() => flip('create')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
              isCreate
                ? 'bg-[#4AE8A0] text-[#0D0F14] shadow-lg'
                : 'text-[#5A5F75] hover:text-[#E8EAF2]'
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => flip('join')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
              !isCreate
                ? 'bg-[#6C8EFF] text-white shadow-lg'
                : 'text-[#5A5F75] hover:text-[#E8EAF2]'
            }`}
          >
            Join Room
          </button>
        </div>

        {/* 3D flip card */}
        <div
          style={{
            transformStyle:  'preserve-3d',
            transform:       flipping
              ? isCreate
                ? 'rotateY(-90deg)'
                : 'rotateY(90deg)'
              : 'rotateY(0deg)',
            transition:      'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            position:        'relative',
          }}
        >
          <div className="bg-[#161920] border border-[#252832] rounded-2xl p-8">

            {/* ── Create face ── */}
            {isCreate && (
              <div>
                {/* Icon */}
                <div className="flex items-center justify-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#4AE8A0]/10 border border-[#4AE8A0]/20 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4AE8A0" strokeWidth="2" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-[#E8EAF2] text-xl font-bold text-center mb-1">
                  Create a Room
                </h2>
                <p className="text-[#5A5F75] text-sm text-center mb-6">
                  Start a session and invite others
                </p>

                <label className="block text-xs font-semibold text-[#5A5F75] uppercase tracking-widest mb-2">
                  Your Name
                </label>
                <input
                  autoFocus
                  type="text"
                  value={createName}
                  onChange={(e) => { setCreateName(e.target.value); setError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                  placeholder="e.g. Mahesh"
                  maxLength={20}
                  className="w-full bg-[#0D0F14] border border-[#252832] text-[#E8EAF2] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#4AE8A0] transition-colors mb-4 placeholder:text-[#3A3F55]"
                />

                {error && (
                  <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full bg-[#4AE8A0] text-[#0D0F14] py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0D0F14] border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Create Room &amp; Get Link
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ── Join face ── */}
            {!isCreate && (
              <div>
                {/* Icon */}
                <div className="flex items-center justify-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#6C8EFF]/10 border border-[#6C8EFF]/20 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6C8EFF" strokeWidth="2" aria-hidden="true">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-[#E8EAF2] text-xl font-bold text-center mb-1">
                  Join a Room
                </h2>
                <p className="text-[#5A5F75] text-sm text-center mb-6">
                  Enter a room ID to collaborate
                </p>

                <label className="block text-xs font-semibold text-[#5A5F75] uppercase tracking-widest mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => { setJoinName(e.target.value); setError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
                  placeholder="e.g. Raghava"
                  maxLength={20}
                  className="w-full bg-[#0D0F14] border border-[#252832] text-[#E8EAF2] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6C8EFF] transition-colors mb-4 placeholder:text-[#3A3F55]"
                />

                <label className="block text-xs font-semibold text-[#5A5F75] uppercase tracking-widest mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => { setJoinRoomId(e.target.value); setError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
                  placeholder="e.g. QkaSfL"
                  maxLength={10}
                  className="w-full bg-[#0D0F14] border border-[#252832] text-[#E8EAF2] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6C8EFF] transition-colors mb-4 placeholder:text-[#3A3F55] font-mono tracking-widest"
                />

                {error && (
                  <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleJoin}
                  disabled={loading}
                  className="w-full bg-[#6C8EFF] text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                      Join Room
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Bottom info */}
            <p className="text-center text-[#3A3F55] text-xs mt-6">
              Rooms auto-expire after 24 hours
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[#3A3F55] text-xs mt-8">
          Built with Monaco Editor · Socket.io · Yjs
        </p>
      </div>
    </div>
  );
}

export default Home;