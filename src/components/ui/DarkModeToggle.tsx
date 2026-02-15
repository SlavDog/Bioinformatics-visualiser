import { useState, useEffect } from 'react';

function DarkModeToggle() {
  const [isDark, setIsDark] = useState(
    localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [isDark]);

  return (
    <button onClick={() => setIsDark(!isDark)}>
      Přepnout na {isDark ? 'Light' : 'Dark'} Mode
    </button>
  );
}

export default DarkModeToggle;