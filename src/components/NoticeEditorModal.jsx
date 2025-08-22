// src/components/NoticeEditorModal.jsx
import React, { useState, useEffect } from 'react';
import { IoCloseCircleOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';

const NoticeEditorModal = ({ isOpen, onClose, notice, onSave }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        if (isOpen && notice) {
            setTitle(notice.title || '');
            setContent(notice.content || '');
        }
    }, [isOpen, notice]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (title.trim() === '' || content.trim() === '') {
            toast.error("Title and content cannot be empty.");
            return;
        }

        // --- THIS IS THE KEY FIX ---
        // We pass a single object back to the onSave function.
        // This is a much more robust pattern.
        onSave({
            id: notice.id, // Will be undefined for a new notice, which is correct
            title: title,
            content: content
        });
        
        onClose(); // Close the modal after saving
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">{notice?.id ? 'Edit Notice' : 'Add New Notice'}</h2>
                    <button onClick={onClose}><IoCloseCircleOutline size={28} className="text-gray-500 hover:text-red-500" /></button>
                </div>
                <div className="space-y-4">
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="border p-2 rounded w-full text-lg" placeholder="Notice Title" />
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} className="border p-2 rounded w-full min-h-[150px]" placeholder="Notice Content" rows="5" />
                </div>
                <div className="flex justify-end mt-6">
                    <button onClick={handleSave} className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoticeEditorModal;