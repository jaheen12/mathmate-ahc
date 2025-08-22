// src/components/NoticeCard.jsx
import React from 'react';
import { useAuth } from '../AuthContext';
import { format } from 'date-fns'; // Import the date formatting function
import { IoTrashOutline, IoCreateOutline } from 'react-icons/io5';

const NoticeCard = ({ notice, onDelete, onEdit }) => { // onEdit will open the modal
    const { currentUser } = useAuth();

    return (
        <div className="bg-white p-4 rounded-lg shadow-md transition-shadow hover:shadow-lg">
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{notice.title}</h3>
                {/* Display the formatted date */}
                <p className="text-xs text-gray-500 whitespace-nowrap">
                    {notice.createdAt ? format(notice.createdAt.toDate(), 'MMM dd, yyyy') : ''}
                </p>
            </div>
            {/* Using whitespace-pre-wrap to respect line breaks in the notice content */}
            <p className="text-gray-700 whitespace-pre-wrap">{notice.content}</p>
            
            {currentUser && (
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => onEdit(notice)} className="text-blue-500 hover:text-blue-700">
                        <IoCreateOutline size={22} />
                    </button>
                    <button onClick={() => onDelete(notice.id)} className="text-red-500 hover:text-red-700">
                        <IoTrashOutline size={22} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default NoticeCard;