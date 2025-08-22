import React from 'react';
import { FaBars } from 'react-icons/fa';

// The header now accepts a 'title' prop
const Header = ({ toggleSidebar, title }) => {
  return (
    <header className="sticky top-0 bg-white shadow-md p-4 flex items-center z-10">
      <button 
        onClick={toggleSidebar} 
        className="text-gray-500 mr-4 md:hidden"
        aria-label="Open sidebar"
      >
        <FaBars size={24} />
      </button>

      {/* Display the title passed in, or default to "MathMate AHC" */}
      <h1 className="text-xl font-semibold text-gray-800">
        {title || 'MathMate AHC'}
      </h1>
    </header>
  );
};

export default Header;