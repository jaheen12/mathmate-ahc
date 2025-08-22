// src/components/AddAttendanceModal.jsx
import React, { useState } from 'react';
import { IoCloseCircleOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';

// The component now accepts 'subjects' as a prop
const AddAttendanceModal = ({ isOpen, onClose, onSave, subjects }) => {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [subject, setSubject] = useState('');
    const [status, setStatus] = useState('present');

    if (!isOpen) return null;

    const handleSave = () => {
        if (!date || !subject) {
            toast.error("Please select a date and a subject.");
            return;
        }
        onSave({ date, subject, status });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Add Attendance Record</h2>
                    <button onClick={onClose}><IoCloseCircleOutline size={28} className="text-gray-500 hover:text-red-500" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border p-2 rounded w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="border p-2 rounded w-full bg-white">
                            <option value="">-- Select a subject --</option>
                            {/* The dropdown is now populated from the 'subjects' prop */}
                            {subjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <div className="flex gap-4">{/* ... Present/Absent buttons ... */}</div>
                    </div>
                </div>
                <div className="flex justify-end mt-8">
                    <button onClick={handleSave} className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600">
                        Save Record
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddAttendanceModal;