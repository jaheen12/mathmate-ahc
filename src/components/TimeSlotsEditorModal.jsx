import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    IoAddCircleOutline, 
    IoTrashOutline, 
    IoCloseOutline, 
    IoTimeOutline,
    IoSaveOutline,
    IoWarningOutline,
    IoSwapHorizontalOutline
} from 'react-icons/io5';

// --- NEW: Time Generation Helper ---
// Creates an array of time strings in 15-minute intervals for the dropdowns.
const generateTimeOptions = () => {
    const times = [];
    for (let i = 0; i < 24 * 60; i += 15) { // 15-minute intervals
        const hours = Math.floor(i / 60);
        const minutes = i % 60;
        
        const h = hours % 12 === 0 ? 12 : hours % 12;
        const m = minutes.toString().padStart(2, '0');
        const ampm = hours < 12 ? 'AM' : 'PM';
        
        times.push(`${h}:${m} ${ampm}`);
    }
    return times;
};

// --- NEW: 12-Hour Time to Minutes Conversion Helper ---
// Converts a string like "1:30 PM" into a number of minutes from midnight for easy comparison.
const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, ampm] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (ampm === 'PM' && hours !== 12) {
        hours += 12;
    }
    if (ampm === 'AM' && hours === 12) {
        hours = 0; // Midnight case
    }
    return hours * 60 + minutes;
};

const TimeSlotsEditorModal = ({ isOpen, onClose, initialTimeSlots, onSave, isOnline }) => {
    const [timeSlots, setTimeSlots] = useState([]); 
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // Memoize the time options so they are only generated once.
    const timeOptions = useMemo(() => generateTimeOptions(), []);

    // Effect to parse initial string slots into objects when the modal opens.
    useEffect(() => {
        if (isOpen) {
            const parsedSlots = (initialTimeSlots || []).map(slot => {
                const [start, end] = slot.split('-');
                return { start: start || '', end: end || '' };
            });
            setTimeSlots(parsedSlots);
            setErrors({});
        }
    }, [isOpen, initialTimeSlots]);

    // --- UPDATED: Validation Logic for 12-Hour Time ---
    const validateAllSlots = useCallback((slots) => {
        const newErrors = {};
        
        slots.forEach((slot, index) => {
            const slotErrors = {};
            if (!slot.start || !slot.end) {
                // Don't validate incomplete slots, but don't allow saving either.
                return;
            }

            const startMinutes = timeToMinutes(slot.start);
            const endMinutes = timeToMinutes(slot.end);

            // End time must be after start time.
            if (startMinutes >= endMinutes) {
                slotErrors.end = "End time must be after start time.";
            }

            // Check for overlaps with other slots.
            for (let i = 0; i < slots.length; i++) {
                if (i === index || !slots[i].start || !slots[i].end) continue;
                const otherSlot = slots[i];
                const otherStart = timeToMinutes(otherSlot.start);
                const otherEnd = timeToMinutes(otherSlot.end);

                if (Math.max(startMinutes, otherStart) < Math.min(endMinutes, otherEnd)) {
                    slotErrors.overlap = "This time range overlaps with another period.";
                    break; 
                }
            }
            
            if (Object.keys(slotErrors).length > 0) {
                newErrors[index] = slotErrors;
            }
        });
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, []);

    // Re-validate whenever time slots change.
    useEffect(() => {
        if (isOpen) {
            validateAllSlots(timeSlots);
        }
    }, [timeSlots, isOpen, validateAllSlots]);

    // --- Handlers ---
    const handleAddTimeSlot = () => setTimeSlots(prev => [...prev, { start: "", end: "" }]);
    const handleRemoveTimeSlot = (index) => setTimeSlots(prev => prev.filter((_, i) => i !== index));

    const handleTimeSlotChange = (index, field, value) => {
        const updatedSlots = [...timeSlots];
        updatedSlots[index] = { ...updatedSlots[index], [field]: value };
        setTimeSlots(updatedSlots);
    };

    const handleSaveChanges = async () => {
        // Ensure all slots are complete before attempting to save.
        const incompleteSlots = timeSlots.some(slot => !slot.start || !slot.end);
        if (incompleteSlots || !validateAllSlots(timeSlots)) return;

        setIsSaving(true);
        const formattedSlots = timeSlots.map(slot => `${slot.start}-${slot.end}`);
            
        try {
            await onSave(formattedSlots);
            setIsSaving(false);
            onClose();
        } catch (err) {
            console.error("Save failed:", err);
            setIsSaving(false);
        }
    };

    // --- UPDATED: Time Slot UI with <select> ---
    const TimeSlotInput = ({ slot, index }) => {
        const slotErrors = errors[index] || {};
        return (
            <div className="mb-4">
                <div className="flex items-center space-x-2">
                    <div className="flex-1 flex items-center gap-2">
                        <IoTimeOutline className="text-gray-500 flex-shrink-0" />
                        <select
                            value={slot.start}
                            onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 transition-all ${
                                slotErrors.start ? "border-red-400 ring-red-200" : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                            }`}
                        >
                            <option value="" disabled>Start Time</option>
                            {timeOptions.map(time => <option key={`start-${time}`} value={time}>{time}</option>)}
                        </select>
                    </div>
                    
                    <IoSwapHorizontalOutline className="text-gray-400"/>
                    
                    <div className="flex-1">
                         <select
                            value={slot.end}
                            onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 transition-all ${
                                slotErrors.end ? "border-red-400 ring-red-200" : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                            }`}
                        >
                            <option value="" disabled>End Time</option>
                            {timeOptions.map(time => <option key={`end-${time}`} value={time}>{time}</option>)}
                        </select>
                    </div>

                    <button type="button" onClick={() => handleRemoveTimeSlot(index)} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full">
                        <IoTrashOutline size={18} />
                    </button>
                </div>
                {(slotErrors.end || slotErrors.overlap) && (
                    <div className="text-red-600 text-xs mt-1 ml-6 flex items-center gap-1">
                        <IoWarningOutline />
                        {slotErrors.end || slotErrors.overlap}
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return null;
    
    const isSaveDisabled = !isOnline || isSaving || Object.keys(errors).length > 0 || timeSlots.some(s => !s.start || !s.end);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold flex items-center gap-2">Edit Time Periods</h2>
                    <button onClick={onClose}><IoCloseOutline size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {timeSlots.map((slot, index) => <TimeSlotInput key={index} slot={slot} index={index} />)}
                    <button onClick={handleAddTimeSlot} className="flex items-center gap-2 text-blue-600 font-medium mt-4">
                        <IoAddCircleOutline size={20} /> Add Period
                    </button>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl sm:rounded-b-2xl">
                     <button 
                        onClick={handleSaveChanges}
                        disabled={isSaveDisabled}
                        className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${
                            isSaveDisabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        }`}
                    >
                        {isSaving ? "Saving..." : !isOnline ? "Offline" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimeSlotsEditorModal;