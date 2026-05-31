export const EVENTS = {
  JOIN_ROOM:       'room:join',
  LEAVE_ROOM:      'room:leave',
  ROOM_USERS:      'room:users',
  USER_JOINED:     'room:user_joined',
  USER_LEFT:       'room:user_left',
  CODE_CHANGE:     'code:change',
  CODE_SYNC:       'code:sync',
  CURSOR_MOVE:     'cursor:move',
  CURSOR_UPDATE:   'cursor:update',
  CHAT_MESSAGE:    'chat:message',
  CHAT_HISTORY:    'chat:history',
  CODE_RUN:        'code:run',
  CODE_RESULT:     'code:result',
  LANGUAGE_CHANGE: 'language:change',
};

export const USER_COLORS = [
  '#4AE8A0',
  '#6C8EFF',
  '#FF8C6A',
  '#F7C948',
  '#E879F9',
  '#38BDF8',
];

export const LANGUAGES = [
  {
    id:          'javascript',
    label:       'JavaScript',
    monacoId:    'javascript',
    judge0Id:    63,
    onecompiler: 'nodejs',   // OneCompiler language name
    jdoodle:     'nodejs',   // JDoodle language name
    jdoodleVer:  '4',        // JDoodle version index
  },
  {
    id:          'typescript',
    label:       'TypeScript',
    monacoId:    'typescript',
    judge0Id:    74,
    onecompiler: 'typescript',
    jdoodle:     'nodejs',   // JDoodle has no TS — transpile via Node
    jdoodleVer:  '4',
  },
  {
    id:          'python',
    label:       'Python',
    monacoId:    'python',
    judge0Id:    71,
    onecompiler: 'python',
    jdoodle:     'python3',
    jdoodleVer:  '4',
  },
  {
    id:          'rust',
    label:       'Rust',
    monacoId:    'rust',
    judge0Id:    73,
    onecompiler: 'rust',
    jdoodle:     'rust',
    jdoodleVer:  '4',
  },
  {
    id:          'go',
    label:       'Go',
    monacoId:    'go',
    judge0Id:    60,
    onecompiler: 'go',
    jdoodle:     'go',
    jdoodleVer:  '4',
  },
  {
    id:          'cpp',
    label:       'C++',
    monacoId:    'cpp',
    judge0Id:    54,
    onecompiler: 'cpp',
    jdoodle:     'cpp17',
    jdoodleVer:  '1',
  },
  {
    id:          'java',
    label:       'Java',
    monacoId:    'java',
    judge0Id:    62,
    onecompiler: 'java',
    jdoodle:     'java',
    jdoodleVer:  '4',
  },
];