import React from 'react';

// The component now accepts an 'icon' prop
const Card = ({ title, description, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-200">
      {/* Icon is displayed at the top */}
      {icon && <div className="mb-3">{icon}</div>}
      
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  );
};

export default Card;