/**
 * CodeRoom — shared JSDoc type definitions
 * Used by both client (src/) and server (src/) for documentation + IDE autocomplete
 * No runtime cost — pure JSDoc comments
 */

/**
 * @typedef {Object} User
 * @property {string} socketId   - Socket.io socket ID
 * @property {string} username   - Display name chosen on join
 * @property {string} color      - Assigned hex color e.g. '#4AE8A0'
 */

/**
 * @typedef {Object} Room
 * @property {string}    roomId           - Short nanoid e.g. 'ax3k9p'
 * @property {string}    name             - Display name e.g. "Mahesh's Room"
 * @property {string}    code             - Current editor content
 * @property {Language}  language         - Active programming language
 * @property {string}    createdBy        - Username of creator
 * @property {User[]}    participants     - Currently connected users
 * @property {Date}      expiresAt        - TTL expiry (24h from creation)
 * @property {Date}      createdAt        - Mongoose timestamp
 * @property {Date}      updatedAt        - Mongoose timestamp
 */

/**
 * @typedef {'javascript'|'typescript'|'python'|'rust'|'go'|'cpp'|'java'} Language
 */

/**
 * @typedef {Object} LanguageConfig
 * @property {string}   id          - Internal ID e.g. 'python'
 * @property {string}   label       - Display label e.g. 'Python'
 * @property {string}   monacoId    - Monaco language ID
 * @property {number}   judge0Id    - Judge0 language ID
 * @property {string}   onecompiler - OneCompiler language name
 * @property {string}   jdoodle     - JDoodle language name
 * @property {string}   jdoodleVer  - JDoodle version index
 */

/**
 * @typedef {Object} Message
 * @property {string}            _id        - MongoDB ObjectId string
 * @property {string}            roomId     - Room this message belongs to
 * @property {string}            username   - Sender's username (or 'system')
 * @property {string}            color      - Sender's color
 * @property {string}            text       - Message content
 * @property {'message'|'system'} type      - Message type
 * @property {Date}              createdAt  - Timestamp
 */

/**
 * @typedef {Object} CursorPosition
 * @property {number} lineNumber  - 1-based line number in Monaco
 * @property {number} column      - 1-based column number in Monaco
 */

/**
 * @typedef {Object} RemoteCursor
 * @property {string}         socketId  - Owner's socket ID
 * @property {string}         username  - Owner's display name
 * @property {string}         color     - Owner's assigned color
 * @property {CursorPosition} position  - Current cursor position
 */

/**
 * @typedef {Object} CodeDelta
 * @property {{ startLineNumber: number, startColumn: number,
 *              endLineNumber: number,   endColumn: number }} range
 * @property {string} text         - Replacement text
 * @property {number} rangeLength  - Length of replaced range
 */

/**
 * @typedef {Object} ExecutionResult
 * @property {string}      status        - e.g. 'Accepted', 'Error'
 * @property {number}      statusId      - 3=Accepted, 4=Error, 5=TLE, -1=internal
 * @property {string}      stdout        - Program output
 * @property {string}      stderr        - Error output
 * @property {string}      compileOutput - Compile error (if any)
 * @property {string|null} time          - Execution time string
 * @property {string|null} memory        - Memory usage string
 * @property {string}      provider      - 'OneCompiler' | 'JDoodle' | 'None'
 */

/**
 * @typedef {Object} SocketEvents
 * @property {'room:join'}        JOIN_ROOM
 * @property {'room:leave'}       LEAVE_ROOM
 * @property {'room:users'}       ROOM_USERS
 * @property {'room:user_joined'} USER_JOINED
 * @property {'room:user_left'}   USER_LEFT
 * @property {'code:change'}      CODE_CHANGE
 * @property {'code:sync'}        CODE_SYNC
 * @property {'cursor:move'}      CURSOR_MOVE
 * @property {'cursor:update'}    CURSOR_UPDATE
 * @property {'chat:message'}     CHAT_MESSAGE
 * @property {'chat:history'}     CHAT_HISTORY
 * @property {'code:run'}         CODE_RUN
 * @property {'code:result'}      CODE_RESULT
 * @property {'language:change'}  LANGUAGE_CHANGE
 */