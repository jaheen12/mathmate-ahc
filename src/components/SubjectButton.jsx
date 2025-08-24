// src/components/SubjectButton.jsx
import React from 'react';
import { IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5';

const SubjectButton = ({ subject, status, onClick }) => {
  const isPresent = status === 'present';
  const isAbsent = status === 'absent';

  // Base classes for all buttons
  const baseClasses =
    'p-3 rounded-lg font-semibold text-center transition-all duration-200 ease-in-out transform hover:scale-105 flex items-center justify-center';

  // Status-specific classes
  const statusClasses = isPresent
    ? 'bg-green-500 text-white shadow-lg'
    : isAbsent
    ? 'bg-red-500 text-white shadow-lg'
    : 'bg-white text-gray-700 shadow-md hover:bg-gray-100';

  return (
    <button
      onClick={() => onClick(subject, status)}
      className={`${baseClasses} ${statusClasses}`}
    >
      {isPresent && <IoCheckmarkCircle className="mr-2" />}
      {isAbsent && <IoCloseCircle className="mr-2" />}
      <span>{subject}</span>
    </button>
  );
};

export default SubjectButton;