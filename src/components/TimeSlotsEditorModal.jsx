// src/components/TimeSlotsEditorModal.jsx
import React, { useState, useEffect } from 'react';
import { IoAddCircleOutline, IoTrashOutline, IoCloseCircleOutline } from 'react-icons/io5';

const TimeSlotsEditorModal = ({ isOpen, onClose, initialTimeSlots, onSave }) => {
    const [timeSlots, setTimeSlots] = useState([]);

    // When the modal opens, sync its internal state with the props
    useEffect(() => {
        if (isOpen) {
            setTimeSlots(initialTimeSlots || []);
        }
    }, [isOpen, initialTimeSlots]);

    if (!isOpen) {
        return null;
    }

    const handleAddTimeSlot = () => {
        setTimeSlots([...timeSlots, '']); // Add a new empty time slot
    };

    const handleRemoveTimeSlot = (index) => {
        const newTimeSlots = timeSlots.filter((_, i) => i !== index);
        setTimeSlots(newTimeSlots);
    };

    const handleTimeSlotChange = (index, value) => {
        const newTimeSlots = [...timeSlots];
        newTimeSlots[index] = value;
        setTimeSlots(newTimeSlots);
    };

    const handleSaveChanges = () => {
        // Filter out any empty strings before saving
        const filteredTimeSlots = timeSlots.filter(ts => ts.trim() !== '');
        onSave(filteredTimeSlots);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Edit Time Periods</h2>
                    <button onClick={onClose}><IoCloseCircleOutline size={28} className="text-gray-500 hover:text-red-500" /></button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {timeSlots.map((time, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="e.g., 9:00 AM"
                                value={time}
                                onChange={(e) => handleTimeSlotChange(index, e.target.value)}
                                className="border p-2 rounded w-full"
                            />
                            <button onClick={() => handleRemoveTimeSlot(index)} className="text-red-500 hover:text-red-700">
                                <IoTrashOutline size={24} />
                            </button>
                        </div>
                    ))}
                </div>

                <button onClick={handleAddTimeSlot} className="mt-4 flex items-center text-blue-500 hover:text-blue-700">
                    <IoAddCircleOutline size={24} className="mr-2" />
                    Add Time Slot
                </button>

                <div className="flex justify-end mt-6">
                    <button onClick={handleSaveChanges} className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimeSlotsEditorModal;