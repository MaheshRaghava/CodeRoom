import Room from '../models/Room.js';
import { EVENTS } from '../../../shared/constants.js';

const roomCodeCache = new Map();
const perLangCache  = new Map();

const BROKEN_DEFAULT = '// Start coding here...\n';

const getLanguageDefault = (language) => {
  const defaults = {
    javascript: '// JavaScript\nconsole.log("Hello, CodeRoom!");\n',
    typescript: '// TypeScript\nconst greet = (name: string): string => `Hello, ${name}!`;\nconsole.log(greet("CodeRoom"));\n',
    python:     '# Python\nprint("Hello, CodeRoom!")\n',
    rust:       '// Rust\nfn main() {\n    println!("Hello, CodeRoom!");\n}\n',
    go:         '// Go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, CodeRoom!")\n}\n',
    cpp:        '// C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, CodeRoom!" << endl;\n    return 0;\n}\n',
    java:       '// Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, CodeRoom!");\n    }\n}\n',
  };
  return defaults[language] || defaults.javascript;
};

const getPerLang = (roomId) => {
  if (!perLangCache.has(roomId)) perLangCache.set(roomId, {});
  return perLangCache.get(roomId);
};

const langChangeTimers  = new Map();
const perLangSaveTimers = new Map();

export const registerCodeSync = (io, socket) => {

  // ── Code change (keystroke) ───────────────────────────────────────────────
  socket.on(EVENTS.CODE_CHANGE, async ({ roomId, delta, code }) => {
    if (!roomId) return;
    roomCodeCache.set(roomId, code);
    socket.to(roomId).emit(EVENTS.CODE_CHANGE, { delta, code });
    scheduleDBWrite(roomId, code, 2000);
  });

  // ── Code sync (on join) ───────────────────────────────────────────────────
  socket.on(EVENTS.CODE_SYNC, async ({ roomId }) => {
    if (!roomId) return;

    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      let code = roomCodeCache.get(roomId) ?? room.code;
      if (!code || code === BROKEN_DEFAULT) {
        code = getLanguageDefault(room.language || 'javascript');
      }
      roomCodeCache.set(roomId, code);
      socket.emit(EVENTS.CODE_SYNC, { code });

      // Merge DB + memory per-lang maps and send to joining client
      const dbPerLang  = room.perLanguageCode
        ? (room.perLanguageCode instanceof Map
          ? Object.fromEntries(room.perLanguageCode)
          : room.perLanguageCode)
        : {};
      const memPerLang = getPerLang(roomId);
      const merged     = { ...dbPerLang, ...memPerLang };

      if (Object.keys(merged).length > 0) {
        socket.emit('code_per_language_sync', { perLangCode: merged });
        console.log(`[codeSync] Sent perLangCode keys: ${Object.keys(merged).join(', ')}`);
      }
    } catch (err) {
      console.error('CODE_SYNC error:', err);
    }
  });

  // ── Language change ───────────────────────────────────────────────────────
  socket.on(EVENTS.LANGUAGE_CHANGE, async ({ roomId, language, code }) => {
    if (!roomId || !language) return;

    console.log(`[codeSync] language change in ${roomId} → ${language}`);

    const perLang = getPerLang(roomId);

    // Use code sent by client
    // Fall back to server memory, then DB, then hardcoded default
    let codeToUse = code ?? perLang[language];

    if (codeToUse === undefined || codeToUse === null) {
      try {
        const room = await Room.findOne({ roomId });
        const dbCode = room?.perLanguageCode?.[language];
        codeToUse = dbCode ?? getLanguageDefault(language);
      } catch (_) {
        codeToUse = getLanguageDefault(language);
      }
    }

    roomCodeCache.set(roomId, codeToUse);
    perLang[language] = codeToUse;

    // Broadcast to other users — field name is 'code' to match onLang listener
    socket.to(roomId).emit(EVENTS.LANGUAGE_CHANGE, {
      language,
      code: codeToUse,
    });

    // Save to DB immediately
    try {
      await Room.findOneAndUpdate(
        { roomId },
        {
          $set: {
            language,
            code: codeToUse,
            [`perLanguageCode.${language}`]: codeToUse,
          },
        },
        { new: true }
      );
      console.log(`[codeSync] Persisted language ${language} for room ${roomId}`);
    } catch (err) {
      console.error('Language save error:', err);
    }
  });

  // ── Save language code before switching ──────────────────────────────────
  socket.on('save_language_code', async ({ roomId, language, code }) => {
    if (!roomId || !language) return;
    if (code === undefined || code === null) return;

    const perLang = getPerLang(roomId);
    perLang[language] = code;

    const key = `${roomId}_${language}`;
    if (perLangSaveTimers.has(key)) clearTimeout(perLangSaveTimers.get(key));
    perLangSaveTimers.set(key, setTimeout(async () => {
      try {
        await Room.findOneAndUpdate(
          { roomId },
          { $set: { [`perLanguageCode.${language}`]: code } },
          { new: true }
        );
        perLangSaveTimers.delete(key);
      } catch (err) {
        console.error('Per-lang save error:', err);
      }
    }, 500));
  });
};

const writeTimers = new Map();

const scheduleDBWrite = (roomId, code, delay = 2000) => {
  if (writeTimers.has(roomId)) clearTimeout(writeTimers.get(roomId));
  const timer = setTimeout(async () => {
    try {
      await Room.findOneAndUpdate(
        { roomId },
        { $set: { code } },
        { new: true }
      );
      writeTimers.delete(roomId);
    } catch (err) {
      console.error('DB write error:', err);
    }
  }, delay);
  writeTimers.set(roomId, timer);
};

export const flushAllPendingWrites = async () => {
  const promises = [];
  writeTimers.forEach((timer, roomId) => {
    clearTimeout(timer);
    const code = roomCodeCache.get(roomId);
    if (code !== undefined) {
      promises.push(
        Room.findOneAndUpdate({ roomId }, { $set: { code } }, { new: true })
          .catch((err) => console.error('Flush error:', err))
      );
    }
  });
  writeTimers.clear();
  await Promise.all(promises);
};

export { roomCodeCache };