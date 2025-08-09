import React from 'react';
import { Menu } from 'lucide-react';

function Header({ title, onMenuClick }) {
  return (
    <header className="app-header">
      <button onClick={onMenuClick} className="menu-button">
        <Menu size={28} />
      </button>
      <h1 className="header-title">{title}</h1>
    </header>
  );
}

export default Header;