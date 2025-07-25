import React from 'react';

const Header = ({ onRestart }: { onRestart: () => void }) => {
  return (
    <header>
      <h1>Presentation Generator</h1>
      <button onClick={onRestart}>Restart</button>
    </header>
  );
};

export default Header;
