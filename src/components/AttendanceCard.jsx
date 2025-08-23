import React from 'react';
import { IoCheckmarkCircle, IoCloseCircle, IoRefreshOutline } from 'react-icons/io5';

const AttendanceCard = React.memo(({ courseName, stats, onAttend, onMiss, onUndo }) => {
    const { attended, missed, lastAction } = stats;
    const totalTaken = attended + missed;
    const percentage = totalTaken > 0 ? ((attended / totalTaken) * 100) : 100;
    const percentageRounded = Math.round(percentage);

    const getPercentageColor = (pct) => {
        if (pct >= 80) return 'text-green-600';
        if (pct >= 75) return 'text-orange-600';
        return 'text-red-600';
    };

    const getProgressColor = (pct) => {
        if (pct >= 80) return 'bg-green-500';
        if (pct >= 75) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getCardBackground = (pct) => {
        if (pct >= 80) return 'from-green-50 to-green-100';
        if (pct >= 75) return 'from-orange-50 to-orange-100';
        return 'from-red-50 to-red-100';
    };

    const getBorderColor = (pct) => {
        if (pct >= 80) return 'border-green-200';
        if (pct >= 75) return 'border-orange-200';
        return 'border-red-200';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-r ${getCardBackground(percentageRounded)} p-4 border-b ${getBorderColor(percentageRounded)}`}>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{courseName}</h3>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-700 font-medium">
                                {attended} / {totalTaken} classes
                            </span>
                            <span className={`text-2xl font-bold ${getPercentageColor(percentageRounded)}`}>
                                {percentageRounded}%
                            </span>
                        </div>
                    </div>
                    
                    {/* Undo Button */}
                    {lastAction && (
                        <button 
                            onClick={() => onUndo(courseName)}
                            className="ml-3 p-2 bg-white/70 hover:bg-white rounded-xl transition-all duration-200 active:scale-95 flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700 border border-white/50 hover:border-blue-200"
                            title={`Undo last action: ${lastAction}`}
                        >
                            <IoRefreshOutline className="w-4 h-4" />
                            <span className="hidden sm:inline">Undo</span>
                        </button>
                    )}
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3 bg-white/50 rounded-full h-2 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${getProgressColor(percentageRounded)}`}
                        style={{ width: `${Math.min(percentageRounded, 100)}%` }}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => onAttend(courseName)}
                        className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <IoCheckmarkCircle className="w-5 h-5" />
                        <span>Attended</span>
                    </button>
                    <button
                        onClick={() => onMiss(courseName)}
                        className="p-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <IoCloseCircle className="w-5 h-5" />
                        <span>Missed</span>
                    </button>
                </div>
            </div>

            {/* Last Action Indicator */}
            {lastAction && (
                <div className="px-4 pb-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                        <span className="text-xs text-blue-700 font-medium">
                            Last: {lastAction === 'attended' ? 'Attended' : 'Missed'} • Click undo to revert
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
});

AttendanceCard.displayName = 'AttendanceCard';

export default AttendanceCard;