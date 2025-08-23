import React, { useState, useEffect, useCallback } from 'react';
import { IoCloseOutline, IoCheckmarkCircle, IoCloseCircle, IoSaveOutline, IoCalendarOutline, IoBookOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';

const AddAttendanceModal = ({ isOpen, onClose, onSave, subjects = [] }) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [formData, setFormData] = useState({
        date: today,
        subject: '',
        status: 'present'
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                date: today,
                subject: subjects[0] || '',
                status: 'present'
            });
            setErrors({});
            setIsSubmitting(false);
        }
    }, [isOpen, subjects, today]);

    // Check if selected date is in the future
    const isFutureDate = useCallback(() => {
        if (!formData.date) return false;
        const selectedDate = startOfDay(parseISO(formData.date));
        const todayDate = startOfDay(new Date());
        return isAfter(selectedDate, todayDate);
    }, [formData.date]);

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.date) {
            newErrors.date = 'Date is required';
        } else if (isFutureDate()) {
            newErrors.date = 'Cannot add attendance for future dates';
        }
        
        if (!formData.subject) {
            newErrors.subject = 'Subject is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSave = async () => {
        if (!validateForm()) {
            toast.error('Please fix the errors before saving.');
            return;
        }

        setIsSubmitting(true);
        
        try {
            const recordData = {
                ...formData,
                timestamp: new Date().toISOString()
            };
            
            await onSave(recordData);
            toast.success(`Attendance record added for ${formData.subject} on ${formData.date}`);
            onClose();
        } catch (error) {
            console.error('Error saving attendance record:', error);
            toast.error('Failed to save attendance record. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        onClose();
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen && !isSubmitting) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, isSubmitting]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
            <div 
                className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                            <IoCalendarOutline className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Add Attendance</h2>
                            <p className="text-sm text-gray-600">Record class attendance</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IoCloseOutline className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-6">
                    {/* Date Input */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <IoCalendarOutline className="w-4 h-4 text-blue-500" />
                            Date
                        </label>
                        <input 
                            type="date" 
                            value={formData.date} 
                            onChange={(e) => handleInputChange('date', e.target.value)}
                            className={`w-full p-4 border-2 rounded-xl bg-white focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all duration-200 ${
                                errors.date ? 'border-red-300 bg-red-50' : 'border-gray-200'
                            }`}
                            max={today}
                        />
                        {errors.date && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                <IoCloseCircle className="w-4 h-4" />
                                {errors.date}
                            </p>
                        )}
                        {isFutureDate() && !errors.date && (
                            <p className="mt-2 text-sm text-orange-600">
                                Warning: Selected date is in the future
                            </p>
                        )}
                    </div>

                    {/* Subject Select */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <IoBookOutline className="w-4 h-4 text-purple-500" />
                            Subject
                        </label>
                        <select 
                            value={formData.subject} 
                            onChange={(e) => handleInputChange('subject', e.target.value)}
                            className={`w-full p-4 border-2 rounded-xl bg-white focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all duration-200 ${
                                errors.subject ? 'border-red-300 bg-red-50' : 'border-gray-200'
                            }`}
                        >
                            <option value="">Select a subject...</option>
                            {subjects.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                        {errors.subject && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                <IoCloseCircle className="w-4 h-4" />
                                {errors.subject}
                            </p>
                        )}
                    </div>

                    {/* Status Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Attendance Status
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => handleInputChange('status', 'present')}
                                className={`p-4 rounded-xl flex items-center justify-center font-semibold transition-all duration-200 active:scale-95 ${
                                    formData.status === 'present' 
                                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                                        : 'bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 border-2 border-transparent hover:border-green-200'
                                }`}
                            >
                                <IoCheckmarkCircle className="mr-2 w-5 h-5" />
                                Present
                            </button>
                            <button
                                type="button"
                                onClick={() => handleInputChange('status', 'absent')}
                                className={`p-4 rounded-xl flex items-center justify-center font-semibold transition-all duration-200 active:scale-95 ${
                                    formData.status === 'absent' 
                                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' 
                                        : 'bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 border-2 border-transparent hover:border-red-200'
                                }`}
                            >
                                <IoCloseCircle className="mr-2 w-5 h-5" />
                                Absent
                            </button>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                        <h4 className="font-semibold text-blue-900 text-sm mb-2">Summary</h4>
                        <div className="space-y-1 text-sm text-blue-700">
                            <p><span className="font-medium">Date:</span> {formData.date || 'Not selected'}</p>
                            <p><span className="font-medium">Subject:</span> {formData.subject || 'Not selected'}</p>
                            <p>
                                <span className="font-medium">Status:</span> 
                                <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    formData.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {formData.status === 'present' ? 'Present' : 'Absent'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-100">
                    <button 
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSubmitting || !formData.date || !formData.subject}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <IoSaveOutline className="w-4 h-4" />
                                Save Record
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddAttendanceModal;