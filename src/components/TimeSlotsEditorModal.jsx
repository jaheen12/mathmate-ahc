import React, { useState, useEffect } from 'react';
import { 
    IoAddCircleOutline, 
    IoTrashOutline, 
    IoCloseOutline, 
    IoTimeOutline,
    IoSaveOutline,
    IoWarningOutline,
    IoReorderThreeOutline
} from 'react-icons/io5';

const TimeSlotsEditorModal = ({ isOpen, onClose, initialTimeSlots, onSave, isOnline }) => {
    const [timeSlots, setTimeSlots] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            setTimeSlots(initialTimeSlots || []);
            setErrors({});
        }
    }, [isOpen, initialTimeSlots]);

    if (!isOpen) return null;

    // --- Validation ---
    const validateTimeSlot = (time, index) => {
        if (!time.trim()) return "Time cannot be empty.";
        if (!/^\d{1,2}:\d{2}$/.test(time)) return "Invalid time format (HH:MM).";
        if (timeSlots.filter((t, i) => i !== index && t === time).length > 0) return "Duplicate time not allowed.";
        return null;
    };

    // --- Handlers ---
    const handleAddTimeSlot = () => setTimeSlots([...timeSlots, ""]);

    const handleRemoveTimeSlot = (index) => {
        const updated = [...timeSlots];
        updated.splice(index, 1);
        setTimeSlots(updated);
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[index];
            return newErrors;
        });
    };

    const handleTimeSlotChange = (index, value) => {
        const updated = [...timeSlots];
        updated[index] = value;
        setTimeSlots(updated);

        const error = validateTimeSlot(value, index);
        setErrors(prev => {
            const newErrors = { ...prev };
            if (error) newErrors[index] = error;
            else delete newErrors[index];
            return newErrors;
        });
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await onSave(timeSlots);
            setIsSaving(false);
            onClose();
        } catch (err) {
            console.error("Save failed:", err);
            setIsSaving(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    // --- Time Slot Input ---
    const TimeSlotInput = ({ time, index }) => (
        <div className="flex items-center space-x-3 mb-3">
            <IoTimeOutline className="text-gray-500" />
            <input
                type="text"
                placeholder="HH:MM"
                value={time}
                onChange={(e) => handleTimeSlotChange(index, e.target.value)}
                className={`flex-1 border rounded-lg px-3 py-2 focus:outline-none ${
                    errors[index] ? "border-red-500" : "border-gray-300"
                }`}
            />
            <button
                type="button"
                onClick={() => handleRemoveTimeSlot(index)}
                className="text-red-500 hover:text-red-700"
            >
                <IoTrashOutline size={20} />
            </button>
        </div>
    );

    const isSaveDisabled = !isOnline || isSaving || Object.keys(errors).length > 0 || timeSlots.filter(t => t.trim()).length === 0;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl transform transition-transform duration-300">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <IoReorderThreeOutline className="text-gray-600" />
                        Edit Time Slots
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <IoCloseOutline size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {timeSlots.map((time, index) => (
                        <div key={index}>
                            <TimeSlotInput time={time} index={index} />
                            {errors[index] && (
                                <p className="text-red-500 text-sm ml-7 flex items-center gap-1">
                                    <IoWarningOutline /> {errors[index]}
                                </p>
                            )}
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={handleAddTimeSlot}
                        className="flex items-center gap-2 text-green-600 font-medium mt-4"
                    >
                        <IoAddCircleOutline size={20} />
                        Add Time Slot
                    </button>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl sm:rounded-b-2xl">
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 bg-white text-gray-700 border border-gray-300 py-3 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 active:scale-95"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveChanges}
                            disabled={isSaveDisabled}
                            className={`flex-1 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${
                                isSaveDisabled
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg'
                            }`}
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Saving...</span>
                                </>
                            ) : !isOnline ? (
                                <span>Offline</span>
                            ) : (
                                <>
                                    <IoSaveOutline className="w-4 h-4" />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeSlotsEditorModal;