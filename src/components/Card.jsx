// src/components/Card.jsx
import React from 'react';

// Generic Card component with optional icon
const Card = ({ title, description, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-200">
      {/* Render the icon if provided */}
      {icon && <div className="mb-3">{icon}</div>}

      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  );
};

export default Card;