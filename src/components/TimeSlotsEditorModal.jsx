import React, { useState, useEffect, useRef, useCallback } from 'react';

// Simple icon components
const AddIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v8m-4-4h8"/>
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3,6 5,6 21,6"/>
        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
    </svg>
);

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
);

const TimeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12,6 12,12 16,14"/>
    </svg>
);

const SaveIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17,21 17,13 7,13 7,21"/>
        <polyline points="7,3 7,8 15,8"/>
    </svg>
);

const WarningIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
);

const MenuIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
);

// Time Slot Row Component
const TimeSlotRow = React.memo(({ timeSlot, onTimeChange, onRemove, error }) => {
    const inputRef = useRef(null);

    const handleInputChange = useCallback((e) => {
        const value = e.target.value.replace(/[^\d:-]/g, ''); // Only allow digits, colon, dash
        onTimeChange(timeSlot.id, value);
    }, [timeSlot.id, onTimeChange]);

    return (
        <div className="group mb-4">
            <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 text-gray-400">
                    <TimeIcon />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="9:45-10:30"
                    value={timeSlot.value}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                        error 
                            ? "border-red-300 focus:border-red-500 focus:ring-red-100" 
                            : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                    autoComplete="off"
                    spellCheck="false"
                />
                <button
                    type="button"
                    onClick={() => onRemove(timeSlot.id)}
                    className="flex-shrink-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                    <TrashIcon />
                </button>
            </div>
            {error && (
                <div className="ml-8 mt-1">
                    <p className="text-red-500 text-xs flex items-center gap-1">
                        <WarningIcon /> {error}
                    </p>
                </div>
            )}
        </div>
    );
});

// Time Slots Editor Modal Component
const TimeSlotsEditorModal = ({ isOpen, onClose, initialTimeSlots, onSave, isOnline }) => {
    const [timeSlots, setTimeSlots] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const nextIdRef = useRef(1);

    // Initialize time slots when modal opens
    useEffect(() => {
        if (isOpen) {
            const slots = (initialTimeSlots || []).map((slot, index) => ({
                id: `slot-${nextIdRef.current++}`,
                value: slot || ""
            }));

            if (slots.length === 0) {
                slots.push({ id: `slot-${nextIdRef.current++}`, value: "" });
            }

            setTimeSlots(slots);
            setErrors({});
        }
    }, [isOpen, initialTimeSlots]);

    // Validation function
    const validateTimeSlot = (time, currentId) => {
        if (!time.trim()) return null; // Allow empty during typing
        
        const timeRangeRegex = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/;
        const match = time.match(timeRangeRegex);
        
        if (!match) return "Use format: 9:45-10:30";
        
        const [, startHour, startMin, endHour, endMin] = match;
        
        const sHour = parseInt(startHour);
        const sMin = parseInt(startMin);
        const eHour = parseInt(endHour);
        const eMin = parseInt(endMin);
        
        if (sHour > 23 || eHour > 23) return "Hours must be 0-23";
        if (sMin > 59 || eMin > 59) return "Minutes must be 0-59";
        
        const startMinutes = sHour * 60 + sMin;
        const endMinutes = eHour * 60 + eMin;
        if (startMinutes >= endMinutes) return "Start time must be before end time";
        
        const duplicate = timeSlots.find(slot => slot.id !== currentId && slot.value === time);
        if (duplicate) return "Duplicate time range not allowed";
        
        return null;
    };

    // Handle time slot change
    const handleTimeSlotChange = useCallback((id, value) => {
        setTimeSlots(prev => prev.map(slot => slot.id === id ? { ...slot, value } : slot));

        const error = validateTimeSlot(value, id);
        setErrors(prev => ({ ...prev, [id]: error }));
    }, [timeSlots]);

    const handleAddTimeSlot = () => {
        const newSlot = { id: `slot-${nextIdRef.current++}`, value: "" };
        setTimeSlots(prev => [...prev, newSlot]);
    };

    const handleRemoveTimeSlot = (id) => {
        setTimeSlots(prev => prev.filter(slot => slot.id !== id));
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[id];
            return newErrors;
        });
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const validSlots = timeSlots
                .map(slot => slot.value)
                .filter(value => value.trim());
            await onSave(validSlots);
            onClose();
        } catch (err) {
            console.error("Save failed:", err);
        } finally {
        setIsSaving(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    // Check if save is disabled
    const hasValidSlots = timeSlots.some(slot => slot.value.trim());
    const hasErrors = Object.values(errors).some(error => error);
    const isSaveDisabled = !isOnline || isSaving || hasErrors || !hasValidSlots;

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
            role="dialog"
            aria-labelledby="time-slot-modal-title"
            aria-describedby="time-slot-modal-description"
        >
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 id="time-slot-modal-title" className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                        <MenuIcon />
                        Edit Time Slots
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                        aria-label="Close modal"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Body */}
                <div id="time-slot-modal-description" className="flex-1 overflow-y-auto p-4">
                    {timeSlots.map((slot) => (
                        <TimeSlotRow
                            key={slot.id}
                            timeSlot={slot}
                            onTimeChange={handleTimeSlotChange}
                            onRemove={handleRemoveTimeSlot}
                            error={errors[slot.id]}
                        />
                    ))}

                    <button
                        type="button"
                        onClick={handleAddTimeSlot}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium py-2 px-3 hover:bg-blue-50 rounded-lg transition-all"
                    >
                        <AddIcon />
                        <span className="text-sm">Add Time Slot</span>
                    </button>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 bg-white text-gray-700 border border-gray-200 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all"
                            aria-label="Cancel changes"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveChanges}
                            disabled={isSaveDisabled}
                            className={`flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                                isSaveDisabled
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                            }`}
                            aria-label="Save changes"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                    <span>Saving...</span>
                                </>
                            ) : !isOnline ? (
                                <span>Offline</span>
                            ) : (
                                <>
                                    <SaveIcon />
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