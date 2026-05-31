import { LANGUAGES } from '@shared/constants.js';

function Toolbar({ language, onLanguageChange }) {

  const handleChange = (e) => {
    const newLang = e.target.value;

    console.log('[Toolbar] selected:', newLang);

    onLanguageChange(newLang);
  };

  return (
    <div className="flex items-center gap-2">
      <LanguageIcon language={language} />

      <select
        value={language}
        onChange={handleChange}
        className="bg-[#0D0F14] border border-[#252832] text-[#E8EAF2] text-xs rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:border-[#3A3F55] transition-colors"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function LanguageIcon({ language }) {
  const colors = {
    javascript: '#F7C948',
    typescript: '#3178C6',
    python: '#4AE8A0',
    rust: '#FF8C6A',
    go: '#38BDF8',
    cpp: '#6C8EFF',
    java: '#E879F9',
  };

  return (
    <div
      style={{ background: colors[language] || '#5A5F75' }}
      className="w-2 h-2 rounded-full flex-shrink-0"
      title={language}
    />
  );
}

export default Toolbar;