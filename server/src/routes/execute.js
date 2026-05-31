import { Router } from 'express';
import axios      from 'axios';
import { executionRateLimiter } from '../middleware/rateLimiter.js';
import { getIO }  from '../socket.js';
import { EVENTS } from '../../../shared/constants.js';

const router = Router();

const getFileName = (lang) => {
  const names = {
    nodejs: 'index.js', javascript: 'index.js',
    typescript: 'index.ts', python: 'main.py',
    rust: 'main.rs', go: 'main.go',
    cpp: 'main.cpp', java: 'Main.java',
  };
  return names[lang] || 'main.txt';
};

// Strip TypeScript type annotations for JDoodle (which runs as Node.js)
const stripTypeScriptTypes = (code) => {
  return code
    // Remove type annotations from function params: (name: string) -> (name)
    .replace(/(\w+)\s*:\s*[A-Za-z<>\[\]|&]+(\s*[,)=])/g, '$1$2')
    // Remove return type annotations: ): string => -> ) =>
    .replace(/\)\s*:\s*[A-Za-z<>\[\]|&]+\s*(=>|\{)/g, ') $1')
    // Remove interface declarations
    .replace(/interface\s+\w+\s*\{[^}]*\}/gs, '')
    // Remove type declarations
    .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
    // Remove generic type parameters: Array<string> -> Array
    .replace(/<[A-Za-z,\s<>\[\]]+>/g, '')
    // Remove 'as Type' casts
    .replace(/\s+as\s+[A-Za-z<>\[\]]+/g, '')
    // Remove access modifiers
    .replace(/\b(public|private|protected|readonly)\s+/g, '');
};

const runWithOneCompiler = async (code, language, stdin = '') => {
  const url = `https://api.onecompiler.com/api/v1/run?access_token=${process.env.ONECOMPILER_API_KEY}`;

  const response = await axios.post(url, {
    language,
    stdin,
    files: [{ name: getFileName(language), content: code }],
  }, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 20000,
  });

  const data = response.data;
  console.log('[OneCompiler] Raw response:', JSON.stringify(data, null, 2));

  // Treat failed/error status as thrown error → triggers JDoodle fallback
  if (data.status === 'failed' || data.error) {
    throw new Error(data.error || 'OneCompiler failed');
  }

  const stdout    = data.stdout    || '';
  const stderr    = data.stderr    || '';
  const exception = data.exception || '';
  const hasError  = data.status === 'error' || !!exception;

  return {
    stdout,
    stderr:        hasError && !stderr ? exception : stderr,
    compileOutput: exception || '',
    status:        hasError ? 'Error' : 'Accepted',
    statusId:      hasError ? 4 : 3,
    time:          data.executionTime ? `${data.executionTime}` : null,
    memory:        null,
    provider:      'OneCompiler',
  };
};

const runWithJDoodle = async (code, langId, stdin = '') => {
  const JDOODLE_MAP = {
    javascript: { language: 'nodejs',  versionIndex: '4' },
    typescript: { language: 'nodejs',  versionIndex: '4' }, // runs stripped JS
    python:     { language: 'python3', versionIndex: '4' },
    rust:       { language: 'rust',    versionIndex: '4' },
    go:         { language: 'go',      versionIndex: '4' },
    cpp:        { language: 'cpp17',   versionIndex: '1' },
    java:       { language: 'java',    versionIndex: '4' },
  };

  const langConfig = JDOODLE_MAP[langId] || JDOODLE_MAP.javascript;

  // TypeScript must be stripped to plain JS for JDoodle's Node.js runner
  let codeToRun = code;
  if (langId === 'typescript') {
    codeToRun = stripTypeScriptTypes(code);
    console.log('[JDoodle] Stripped TS → JS for execution');
  }

  console.log(`[JDoodle] Running ${langId} as ${langConfig.language}`);

  const response = await axios.post(
    process.env.JDOODLE_API_URL,
    {
      clientId:     process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script:       codeToRun,
      language:     langConfig.language,
      versionIndex: langConfig.versionIndex,
      stdin,
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
  );

  const data = response.data;
  console.log('[JDoodle] Raw response:', JSON.stringify(data, null, 2));

  if (data.statusCode === 429) throw new Error('JDoodle daily limit reached');

  const isError = data.statusCode !== 200 || data.output?.includes('error')
    && data.statusCode !== 200;

  return {
    stdout:        isError ? '' : (data.output || ''),
    stderr:        isError ? (data.output || 'Execution failed') : '',
    compileOutput: '',
    status:        isError ? 'Error' : 'Accepted',
    statusId:      isError ? 4 : 3,
    time:          data.cpuTime  || null,
    memory:        data.memory   || null,
    provider:      'JDoodle',
  };
};

router.post('/', executionRateLimiter, async (req, res) => {
  const { roomId, code, language, onecompilerLang, stdin = '' } = req.body;

  if (!roomId || !code?.trim() || !language) {
    return res.status(400).json({ error: 'roomId, code, and language are required' });
  }

  try {
    const io = getIO();
    io.to(roomId).emit(EVENTS.CODE_RESULT, {
      status: 'running', stdout: null, stderr: null,
      time: null, memory: null, provider: null,
    });
  } catch (_) {}

  res.json({ status: 'submitted' });

  let result = null;

  try {
    result = await runWithOneCompiler(code, onecompilerLang || language, stdin);
    console.log(`[Execute] OneCompiler success — status: ${result.status}`);
  } catch (primaryErr) {
    console.warn(`[Execute] OneCompiler failed: ${primaryErr.message}`);

    try {
      result = await runWithJDoodle(code, language, stdin);
      console.log(`[Execute] JDoodle success — status: ${result.status}`);
    } catch (fallbackErr) {
      console.error(`[Execute] Both failed: ${fallbackErr.message}`);
      result = {
        status: 'Error', statusId: -1,
        stdout: '', stderr: fallbackErr.message.includes('daily limit')
          ? 'Both providers exhausted for today. Try again tomorrow.'
          : 'Both execution providers failed. Please try again.',
        compileOutput: '', time: null, memory: null, provider: 'None',
      };
    }
  }

  try {
    const io = getIO();
    io.to(roomId).emit(EVENTS.CODE_RESULT, result);
  } catch (err) {
    console.error('[Execute] Broadcast error:', err.message);
  }
});

export default router;