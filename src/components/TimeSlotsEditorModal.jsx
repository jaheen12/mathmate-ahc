import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    IoAddCircleOutline, 
    IoTrashOutline, 
    IoCloseOutline, 
    IoTimeOutline,
    IoSaveOutline,
    IoWarningOutline,
    IoSwapHorizontalOutline,
    IoCloudOfflineOutline // For offline saving
} from 'react-icons/io5';
import { toast } from 'react-toastify'; // Import toast for notifications

// --- Helper Functions (No changes needed) ---
const generateTimeOptions = () => {
    const times = [];
    for (let i = 0; i < 24 * 60; i += 15) {
        const hours = Math.floor(i / 60);
        const minutes = i % 60;
        const h = hours % 12 === 0 ? 12 : hours % 12;
        const m = minutes.toString().padStart(2, '0');
        const ampm = hours < 12 ? 'AM' : 'PM';
        times.push(`${h}:${m} ${ampm}`);
    }
    return times;
};

const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, ampm] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
};

// --- Main Component ---
const TimeSlotsEditorModal = ({ isOpen, onClose, initialTimeSlots, onSave, isOnline }) => {
    const [timeSlots, setTimeSlots] = useState([]); 
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const timeOptions = useMemo(() => generateTimeOptions(), []);

    useEffect(() => {
        if (isOpen) {
            const parsedSlots = (initialTimeSlots || []).map(slot => {
                const [start, end] = slot.split('-');
                return { start: start?.trim() || '', end: end?.trim() || '' };
            });
            setTimeSlots(parsedSlots);
            setErrors({});
        }
    }, [isOpen, initialTimeSlots]);

    const validateAllSlots = useCallback((slots) => {
        const newErrors = {};
        slots.forEach((slot, index) => {
            const slotErrors = {};
            if (!slot.start || !slot.end) return;
            const startMinutes = timeToMinutes(slot.start);
            const endMinutes = timeToMinutes(slot.end);
            if (startMinutes >= endMinutes) {
                slotErrors.end = "End time must be after start time.";
            }
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
            if (Object.keys(slotErrors).length > 0) newErrors[index] = slotErrors;
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, []);

    useEffect(() => {
        if (isOpen) validateAllSlots(timeSlots);
    }, [timeSlots, isOpen, validateAllSlots]);

    const handleAddTimeSlot = () => setTimeSlots(prev => [...prev, { start: "", end: "" }]);
    const handleRemoveTimeSlot = (index) => setTimeSlots(prev => prev.filter((_, i) => i !== index));
    const handleTimeSlotChange = (index, field, value) => {
        const updatedSlots = [...timeSlots];
        updatedSlots[index] = { ...updatedSlots[index], [field]: value };
        setTimeSlots(updatedSlots);
    };

    // --- CHANGE: Updated save handler for offline feedback ---
    const handleSaveChanges = async () => {
        const incompleteSlots = timeSlots.some(slot => !slot.start || !slot.end);
        if (incompleteSlots || !validateAllSlots(timeSlots)) {
            toast.error("Please fix all errors before saving.");
            return;
        }

        setIsSaving(true);
        const formattedSlots = timeSlots.map(slot => `${slot.start}-${slot.end}`);
            
        try {
            await onSave(formattedSlots);
            const message = isOnline ? "Time periods saved successfully!" : "Saved locally! Will sync when online.";
            toast.success(message);
            onClose();
        } catch (err) {
            console.error("Save failed:", err);
            toast.error("Could not save time periods. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const TimeSlotInput = ({ slot, index }) => {
        const slotErrors = errors[index] || {};
        return (
            <div className="mb-4">
                <div className="flex items-center space-x-2">
                    <div className="flex-1 flex items-center gap-2">
                        <IoTimeOutline className="text-gray-500 flex-shrink-0" />
                        <select value={slot.start} onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)} className={`w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 transition-all ${slotErrors.start || slotErrors.overlap ? "border-red-400 ring-red-200" : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"}`}>
                            <option value="" disabled>Start Time</option>{timeOptions.map(time => <option key={`start-${time}`} value={time}>{time}</option>)}
                        </select>
                    </div>
                    <IoSwapHorizontalOutline className="text-gray-400"/>
                    <div className="flex-1">
                         <select value={slot.end} onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)} className={`w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 transition-all ${slotErrors.end || slotErrors.overlap ? "border-red-400 ring-red-200" : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"}`}>
                            <option value="" disabled>End Time</option>{timeOptions.map(time => <option key={`end-${time}`} value={time}>{time}</option>)}
                        </select>
                    </div>
                    <button type="button" onClick={() => handleRemoveTimeSlot(index)} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full"><IoTrashOutline size={18} /></button>
                </div>
                {(slotErrors.end || slotErrors.overlap) && (<div className="text-red-600 text-xs mt-1 ml-6 flex items-center gap-1"><IoWarningOutline />{slotErrors.end || slotErrors.overlap}</div>)}
            </div>
        );
    };

    if (!isOpen) return null;
    
    // --- CHANGE: Updated save disabled logic to allow offline saving ---
    const isSaveDisabled = isSaving || Object.keys(errors).length > 0 || timeSlots.some(s => !s.start || !s.end);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 p-4 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl transition-transform duration-300" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold flex items-center gap-2"><IoTimeOutline/> Edit Time Periods</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><IoCloseOutline size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {timeSlots.map((slot, index) => <TimeSlotInput key={index} slot={slot} index={index} />)}
                    <button onClick={handleAddTimeSlot} className="flex items-center gap-2 text-blue-600 font-medium mt-4 hover:text-blue-800">
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
                        {isSaving ? (
                            "Saving..."
                        ) : isOnline ? (
                            <><IoSaveOutline/> Save Changes</>
                        ) : (
                            <><IoCloudOfflineOutline/> Save Offline</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimeSlotsEditorModal;