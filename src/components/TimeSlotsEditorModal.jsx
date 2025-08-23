// src/components/TimeSlotsEditorModal.jsx
import React, { useState, useEffect } from 'react';
import { 
    IoAddCircleOutline, 
    IoTrashOutline, 
    IoCloseOutline, 
    IoTimeOutline,
    IoSaveOutline,
    IoWarningOutline,
    IoCheckmarkCircleOutline,
    IoReorderThreeOutline
} from 'react-icons/io5';

const TimeSlotsEditorModal = ({ isOpen, onClose, initialTimeSlots, onSave }) => {
    const [timeSlots, setTimeSlots] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTimeSlots(initialTimeSlots || []);
            setErrors({});
        }
    }, [isOpen, initialTimeSlots]);

    if (!isOpen) {
        return null;
    }

    const validateTimeSlot = (time, index) => {
        const newErrors = { ...errors };
        
        if (!time.trim()) {
            newErrors[index] = 'Time period is required';
        } else if (timeSlots.filter(t => t === time).length > 1) {
            newErrors[index] = 'Duplicate time period';
        } else {
            delete newErrors[index];
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddTimeSlot = () => {
        setTimeSlots([...timeSlots, '']);
        // Auto-focus the new input after a brief delay
        setTimeout(() => {
            const inputs = document.querySelectorAll('.time-input');
            const lastInput = inputs[inputs.length - 1];
            if (lastInput) lastInput.focus();
        }, 100);
    };

    const handleRemoveTimeSlot = (index) => {
        const newTimeSlots = timeSlots.filter((_, i) => i !== index);
        setTimeSlots(newTimeSlots);
        // Remove any errors for this index
        const newErrors = { ...errors };
        delete newErrors[index];
        setErrors(newErrors);
    };

    const handleTimeSlotChange = (index, value) => {
        const newTimeSlots = [...timeSlots];
        newTimeSlots[index] = value;
        setTimeSlots(newTimeSlots);
        validateTimeSlot(value, index);
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        
        // Validate all time slots
        const filteredTimeSlots = timeSlots.filter(ts => ts.trim() !== '');
        let hasErrors = false;
        
        filteredTimeSlots.forEach((time, index) => {
            if (!validateTimeSlot(time, index)) {
                hasErrors = true;
            }
        });

        if (hasErrors || filteredTimeSlots.length === 0) {
            setIsSaving(false);
            return;
        }

        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate save delay
            onSave(filteredTimeSlots);
            onClose();
        } catch (error) {
            console.error('Error saving time slots:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const TimeSlotInput = ({ time, index }) => (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3">
                {/* Drag Handle */}
                <div className="text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600 transition-colors">
                    <IoReorderThreeOutline className="w-5 h-5" />
                </div>

                {/* Time Icon */}
                <div className="p-2 bg-blue-50 rounded-lg">
                    <IoTimeOutline className="w-4 h-4 text-blue-500" />
                </div>

                {/* Input Field */}
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="e.g., 9:00 AM - 10:00 AM"
                        value={time}
                        onChange={(e) => handleTimeSlotChange(index, e.target.value)}
                        className={`time-input w-full p-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                            errors[index] 
                                ? 'border-red-300 focus:ring-red-200 bg-red-50' 
                                : 'border-gray-200 focus:ring-blue-200 focus:border-blue-300'
                        }`}
                    />
                    {errors[index] && (
                        <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                            <IoWarningOutline className="w-4 h-4" />
                            <span>{errors[index]}</span>
                        </div>
                    )}
                </div>

                {/* Remove Button */}
                <button 
                    onClick={() => handleRemoveTimeSlot(index)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 active:scale-95"
                >
                    <IoTrashOutline className="w-5 h-5" />
                </button>
            </div>
        </div>
    );

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl transform transition-transform duration-300">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md">
                            <IoTimeOutline className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Edit Time Periods</h2>
                            <p className="text-sm text-gray-600">Manage your class schedule periods</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors active:scale-95"
                    >
                        <IoCloseOutline className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {timeSlots.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                                <IoTimeOutline className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Time Periods</h3>
                            <p className="text-gray-600 mb-6">Add your first time period to get started</p>
                            <button 
                                onClick={handleAddTimeSlot}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 active:scale-95 flex items-center gap-2 mx-auto"
                            >
                                <IoAddCircleOutline className="w-5 h-5" />
                                Add First Period
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4 mb-6">
                                {timeSlots.map((time, index) => (
                                    <TimeSlotInput 
                                        key={index} 
                                        time={time} 
                                        index={index} 
                                    />
                                ))}
                            </div>

                            {/* Add New Period Button */}
                            <button 
                                onClick={handleAddTimeSlot}
                                className="w-full bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 text-blue-700 p-4 rounded-xl font-medium hover:from-blue-100 hover:to-purple-100 hover:border-blue-400 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <IoAddCircleOutline className="w-5 h-5" />
                                Add New Time Period
                            </button>
                        </>
                    )}

                    {/* Quick Tips */}
                    <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs">💡</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-amber-900 text-sm mb-1">Quick Tips</h4>
                                <ul className="text-amber-800 text-xs space-y-1">
                                    <li>• Use clear time formats like "9:00 AM - 10:00 AM"</li>
                                    <li>• Avoid duplicate time periods</li>
                                    <li>• Periods will be sorted automatically</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl sm:rounded-b-2xl">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <IoCheckmarkCircleOutline className="w-4 h-4 text-green-500" />
                            <span>{timeSlots.filter(t => t.trim()).length} periods configured</span>
                        </div>
                        
                        {Object.keys(errors).length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                                <IoWarningOutline className="w-4 h-4" />
                                <span>{Object.keys(errors).length} error(s)</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 bg-white text-gray-700 border border-gray-300 py-3 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 active:scale-95"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveChanges}
                            disabled={isSaving || Object.keys(errors).length > 0 || timeSlots.filter(t => t.trim()).length === 0}
                            className={`flex-1 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${
                                isSaving || Object.keys(errors).length > 0 || timeSlots.filter(t => t.trim()).length === 0
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg'
                            }`}
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Saving...</span>
                                </>
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