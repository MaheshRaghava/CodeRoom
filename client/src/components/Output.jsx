function Output({ result, running }) {

  if (running) {
    return (
      <div className="h-full flex flex-col bg-[#0D0F14]">
        <OutputHeader />
        <div className="flex-1 flex items-center justify-center gap-3">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{ animationDelay: `${i * 0.15}s` }}
                className="w-1.5 h-1.5 bg-[#4AE8A0] rounded-full animate-bounce"
              />
            ))}
          </div>
          <span className="text-[#5A5F75] text-sm">Running code...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex flex-col bg-[#0D0F14]">
        <OutputHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-[#1E2130] flex items-center justify-center mx-auto mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3A3F55" strokeWidth="2" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <p className="text-[#3A3F55] text-xs">Press Run to execute</p>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = result.statusId === 3;
  const isTLE     = result.statusId === 5;
  const statusColor = isSuccess ? '#4AE8A0' : isTLE ? '#F7C948' : '#FF8C6A';

  // OneCompiler puts full traceback in stderr
  const compileError = result.compileOutput?.trim();
  const stderr       = result.stderr?.trim();
  const stdout       = result.stdout?.trim();

  return (
    <div className="h-full flex flex-col bg-[#0D0F14]">
      <OutputHeader result={result} statusColor={statusColor} />

      {/* 
        This outer div is the scrollable container.
        overflow-y-auto + min-h-0 is the key combination 
      */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 flex flex-col gap-3">

        {/* Compile / syntax errors */}
        {compileError && (
          <OutputBlock
            label="Compile Error"
            content={compileError}
            color="#FF8C6A"
            bgColor="#2A1A10"
            borderColor="#4A2A1A"
          />
        )}

        {/* Runtime errors — full traceback */}
        {stderr && (
          <OutputBlock
            label="Error"
            content={stderr}
            color="#FF8C6A"
            bgColor="#2A1A10"
            borderColor="#4A2A1A"
          />
        )}

        {/* Standard output */}
        {stdout && (
          <OutputBlock
            label="Output"
            content={stdout}
            color="#4AE8A0"
            bgColor="#1A2A1F"
            borderColor="#2A4A35"
          />
        )}

        {/* No output at all */}
        {isSuccess && !stdout && !stderr && !compileError && (
          <div className="text-[#3A3F55] text-xs italic px-1">
            (no output)
          </div>
        )}

        {isTLE && (
          <div className="text-[#F7C948] text-xs px-1">
            Execution exceeded the time limit.
          </div>
        )}

        {/* Stats row */}
        {(result.time || result.memory || result.provider) && (
          <div className="flex items-center gap-4 pt-2 border-t border-[#252832] flex-wrap mt-auto">
            {result.time && (
              <Stat label="Time"   value={formatTime(result.time)}     color="#4AE8A0" />
            )}
            {result.memory && (
              <Stat label="Memory" value={formatMemory(result.memory)} color="#6C8EFF" />
            )}
            {result.exitCode != null && (
              <Stat label="Exit"   value={result.exitCode}             color="#5A5F75" />
            )}
            {result.provider && result.provider !== 'None' && (
              <div className="ml-auto flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  result.provider === 'OneCompiler' ? 'bg-[#F7C948]' : 'bg-[#6C8EFF]'
                }`} />
                <span className="text-[#3A3F55] text-[10px]">
                  via {result.provider}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const formatTime = (time) => {
  if (!time) return null;
  const ms = parseFloat(time) * (String(time).includes('.') ? 1000 : 1);
  return isNaN(ms) ? String(time) : `${Math.round(ms)} ms`;
};

const formatMemory = (memory) => {
  if (!memory) return null;
  const kb = parseFloat(memory);
  if (isNaN(kb)) return String(memory);
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
};

function OutputHeader({ result, statusColor }) {
  return (
    <div className="h-10 flex items-center justify-between px-4 border-b border-[#252832] flex-shrink-0">
      <div className="flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5A5F75" strokeWidth="2" aria-hidden="true">
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
        <span className="text-[#5A5F75] text-xs font-semibold uppercase tracking-widest">
          Output
        </span>
      </div>
      {result && (
        <div
          style={{
            background:  statusColor + '15',
            borderColor: statusColor + '40',
            color:       statusColor,
          }}
          className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-md border"
        >
          <div style={{ background: statusColor }} className="w-1.5 h-1.5 rounded-full" />
          {result.status}
        </div>
      )}
    </div>
  );
}

function OutputBlock({ label, content, color, bgColor, borderColor }) {
  return (
    <div
      style={{ background: bgColor, borderColor }}
      className="rounded-xl border overflow-hidden flex-shrink-0"
    >
      <div
        style={{ borderColor, color }}
        className="px-3 py-1.5 border-b text-[10px] font-semibold uppercase tracking-wider"
      >
        {label}
      </div>
      {/* pre tag preserves all whitespace and newlines — full traceback shows */}
      <pre
        style={{ color }}
        className="px-3 py-3 whitespace-pre-wrap break-words leading-relaxed text-xs font-mono overflow-x-auto"
      >
        {content}
      </pre>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[#3A3F55] text-[10px] uppercase tracking-wider">{label}</span>
      <span style={{ color }} className="font-semibold text-xs">{value}</span>
    </div>
  );
}

export default Output;