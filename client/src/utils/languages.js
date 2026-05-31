import { LANGUAGES } from '@shared/constants.js';

export { LANGUAGES };

export const getMonacoLanguage = (langId) => {
  // Explicit map — never derive from onecompiler/jdoodle names
  const monacoMap = {
    javascript: 'javascript',
    typescript: 'typescript',
    python:     'python',
    rust:       'rust',
    go:         'go',
    cpp:        'cpp',
    java:       'java',
  };
  return monacoMap[langId] || 'javascript';
};

export const getJudge0Id = (langId) => {
  const lang = LANGUAGES.find((l) => l.id === langId);
  return lang?.judge0Id || 63;
};

export const getOneCompilerLang = (langId) => {
  const map = {
    javascript: 'nodejs',
    typescript: 'typescript',
    python:     'python',
    rust:       'rust',
    go:         'go',
    cpp:        'cpp',
    java:       'java',
  };
  return map[langId] || 'nodejs';
};

export const getJDoodleLang = (langId) => {
  const lang = LANGUAGES.find((l) => l.id === langId);
  return {
    language:     lang?.jdoodle    || 'nodejs',
    versionIndex: lang?.jdoodleVer || '4',
  };
};

export const getDefaultCode = (langId) => {
  const defaults = {
    javascript: '// JavaScript\nconsole.log("Hello, CodeRoom!");\n',
    typescript: '// TypeScript\nconst greet = (name: string): string => `Hello, ${name}!`;\nconsole.log(greet("CodeRoom"));\n',
    python:     '# Python\nprint("Hello, CodeRoom!")\n',
    rust:       '// Rust\nfn main() {\n    println!("Hello, CodeRoom!");\n}\n',
    go:         '// Go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, CodeRoom!")\n}\n',
    cpp:        '// C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, CodeRoom!" << endl;\n    return 0;\n}\n',
    java:       '// Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, CodeRoom!");\n    }\n}\n',
  };
  return defaults[langId] || defaults.javascript;
};