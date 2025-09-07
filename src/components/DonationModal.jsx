import React, { useState, useEffect, useCallback } from 'react';
import { IoCloseOutline, IoCopyOutline, IoCheckmarkOutline, IoQrCodeOutline, IoHeartOutline } from "react-icons/io5";

// Enhanced toast function with better UX
const toast = {
    success: (message) => {
        // Create a temporary toast element
        const toastEl = document.createElement('div');
        toastEl.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[70] animate-in slide-in-from-right-full duration-300';
        toastEl.textContent = message;
        document.body.appendChild(toastEl);
        
        setTimeout(() => {
            toastEl.classList.add('animate-out', 'slide-out-to-right-full');
            setTimeout(() => document.body.removeChild(toastEl), 300);
        }, 3000);
    },
    error: (message) => {
        const toastEl = document.createElement('div');
        toastEl.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-[70] animate-in slide-in-from-right-full duration-300';
        toastEl.textContent = message;
        document.body.appendChild(toastEl);
        
        setTimeout(() => {
            toastEl.classList.add('animate-out', 'slide-out-to-right-full');
            setTimeout(() => document.body.removeChild(toastEl), 300);
        }, 3000);
    }
};

// Enhanced payment info with validation and multiple options
const paymentInfo = {
    bKash: {
        name: "bKash",
        number: "01608453459",
        type: "Personal",
        qrCodeUrl: "/assets/bkash_qr.png",
        color: "bg-pink-500",
        bgColor: "from-pink-500 to-pink-600",
        textColor: "text-pink-600",
        hoverColor: "hover:bg-pink-600",
        description: "Mobile banking solution for quick payments"
    },
    // Add more payment methods easily
    nagad: {
        name: "Nagad",
        number: "",
        type: "Personal",
        qrCodeUrl: "/assets/nagad_qr.png",
        color: "bg-orange-500",
        bgColor: "from-orange-500 to-orange-600",
        textColor: "text-orange-600",
        hoverColor: "hover:bg-orange-600",
        description: "Digital financial service for secure transactions"
    }
};

const PaymentMethod = ({ details, onQRClick, isActive, onClick }) => {
    const [copied, setCopied] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(details.number);
            setCopied(true);
            toast.success(`${details.name} number copied successfully!`);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            // Enhanced fallback for older browsers
            try {
                const textArea = document.createElement('textarea');
                textArea.value = details.number;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                setCopied(true);
                toast.success(`${details.name} number copied successfully!`);
                setTimeout(() => setCopied(false), 2000);
            } catch (fallbackErr) {
                toast.error('Failed to copy. Please copy manually.');
            }
        }
    };

    const handleQRClick = (e) => {
        e.stopPropagation();
        if (!imageError && details.qrCodeUrl) {
            onQRClick(details.qrCodeUrl, details.name);
        }
    };

    const handleImageLoad = () => {
        setImageLoading(false);
    };

    const handleImageError = () => {
        setImageError(true);
        setImageLoading(false);
    };

    // Only show if number is properly configured
    if (!details.number || details.number.startsWith("YOUR_")) {
        return null;
    }

    return (
        <div 
            className={`relative text-center p-6 border-2 rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
                isActive 
                    ? `border-${details.color.replace('bg-', '')}-500 shadow-lg ring-4 ring-${details.color.replace('bg-', '')}-500/20` 
                    : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            aria-label={`Select ${details.name} payment method`}
        >
            {/* Selection indicator */}
            {isActive && (
                <div className={`absolute -top-2 -right-2 w-6 h-6 ${details.color} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                    ✓
                </div>
            )}
            
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${details.bgColor} text-white mb-4 mx-auto shadow-md`}>
                <IoQrCodeOutline className="text-2xl" />
            </div>
            
            <h3 className={`text-xl font-bold mb-2 ${details.textColor}`}>
                {details.name}
            </h3>
            
            <p className="text-sm text-gray-500 mb-4">{details.description}</p>
            
            {details.qrCodeUrl && (
                <div className="w-40 h-40 mx-auto my-4 relative">
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl shadow-inner border border-gray-100 relative overflow-hidden">
                        {imageLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                            </div>
                        )}
                        
                        {!imageError ? (
                            <img 
                                src={details.qrCodeUrl} 
                                alt={`${details.name} QR Code`} 
                                className={`w-full h-full object-contain p-2 rounded-xl ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                            />
                        ) : (
                            <div className="text-center text-gray-400">
                                <IoQrCodeOutline className="text-4xl mx-auto mb-2 opacity-50" />
                                <p className="text-xs">QR Code unavailable</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Fullscreen QR Button */}
                    {!imageError && (
                        <button
                            onClick={handleQRClick}
                            className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 ${details.color} hover:${details.color.replace('500', '600')} text-white px-3 py-1 rounded-full text-xs font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-1`}
                            aria-label={`View ${details.name} QR code in fullscreen`}
                        >
                            <IoQrCodeOutline className="text-sm" />
                            View QR
                        </button>
                    )}
                </div>
            )}
            
            <div className="mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <p className="text-sm text-gray-500 font-medium">Account Number</p>
                    {details.type && (
                        <span className={`text-xs px-2 py-1 rounded-full ${details.color} text-white font-medium`}>
                            {details.type}
                        </span>
                    )}
                </div>
                <p className="text-lg font-mono tracking-wider text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200 font-semibold select-all">
                    {details.number}
                </p>
            </div>
            
            <button
                onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 text-sm sm:text-base ${
                    copied 
                        ? 'bg-green-500 text-white focus:ring-green-500' 
                        : `${details.color} ${details.hoverColor} text-white shadow-md hover:shadow-lg focus:ring-${details.color.replace('bg-', '')}-500`
                }`}
                disabled={copied}
                aria-label={copied ? 'Number copied to clipboard' : `Copy ${details.name} number to clipboard`}
            >
                {copied ? (
                    <>
                        <IoCheckmarkOutline className="text-lg flex-shrink-0" />
                        <span className="truncate">Copied!</span>
                    </>
                ) : (
                    <>
                        <IoCopyOutline className="text-lg flex-shrink-0" />
                        <span className="truncate">Copy Number</span>
                    </>
                )}
            </button>
        </div>
    );
};

const DonationModal = ({ isOpen, onClose }) => {
    const [fullscreenQR, setFullscreenQR] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState('bKash');
    const [donationAmount, setDonationAmount] = useState('');
    const [donorMessage, setDonorMessage] = useState('');

    // Handle escape key to close modal
    const handleEscapeKey = useCallback((event) => {
        if (event.key === 'Escape') {
            if (fullscreenQR) {
                closeFullscreenQR();
            } else {
                onClose();
            }
        }
    }, [fullscreenQR, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }
        
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleEscapeKey]);

    const handleQRClick = (qrCodeUrl, paymentName) => {
        setFullscreenQR({ url: qrCodeUrl, name: paymentName });
    };

    const closeFullscreenQR = () => {
        setFullscreenQR(null);
    };

    const handlePaymentSelect = (paymentKey) => {
        setSelectedPayment(paymentKey);
    };

    const quickAmounts = [50, 100, 200, 500, 1000, 2000];

    const handleQuickAmount = (amount) => {
        setDonationAmount(amount.toString());
    };

    if (!isOpen) return null;

    const selectedPaymentDetails = paymentInfo[selectedPayment];

    return (
        <>
            {/* Main Modal */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in-0 duration-300"
                role="dialog"
                aria-modal="true"
                aria-labelledby="donation-modal-title"
            >
                <div 
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Enhanced Header */}
                    <header className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 sm:px-8 py-6 sm:py-8 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
                        
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <IoHeartOutline className="text-xl sm:text-2xl" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 id="donation-modal-title" className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2 truncate">Support the Developer</h2>
                                    <p className="text-emerald-100 text-sm sm:text-base opacity-90 line-clamp-2">Your contribution helps maintain and improve this project</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-2 sm:p-3 hover:bg-white/20 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 ml-2 flex-shrink-0" 
                                aria-label="Close donation modal"
                            >
                                <IoCloseOutline className="text-2xl sm:text-3xl" />
                            </button>
                        </div>
                    </header>
                    
                    <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
                        {/* Donation Amount Section */}
                        <div className="mb-6 sm:mb-8">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Choose Amount (Optional)</h3>
                            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
                                {quickAmounts.map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => handleQuickAmount(amount)}
                                        className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                                            donationAmount === amount.toString()
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        ৳{amount}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-4">
                                <input
                                    type="number"
                                    placeholder="Enter custom amount"
                                    value={donationAmount}
                                    onChange={(e) => setDonationAmount(e.target.value)}
                                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
                                />
                                <span className="flex items-center px-3 sm:px-4 bg-gray-100 rounded-lg text-gray-600 font-medium text-sm sm:text-base">
                                    BDT
                                </span>
                            </div>
                        </div>

                        {/* Message Section */}
                        <div className="mb-6 sm:mb-8">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Leave a Message (Optional)</h3>
                            <textarea
                                placeholder="Share your thoughts, feedback, or feature requests..."
                                value={donorMessage}
                                onChange={(e) => setDonorMessage(e.target.value)}
                                rows={3}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-sm sm:text-base"
                            />
                        </div>

                        {/* Payment Methods */}
                        <div className="mb-6 sm:mb-8">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-6">Select Payment Method</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                {Object.entries(paymentInfo).map(([key, details]) => (
                                    <PaymentMethod 
                                        key={key}
                                        details={details} 
                                        onQRClick={handleQRClick}
                                        isActive={selectedPayment === key}
                                        onClick={() => handlePaymentSelect(key)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Enhanced Information Box */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-4 sm:p-6">
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg sm:text-xl flex-shrink-0">
                                    💡
                                </div>
                                <div className="text-blue-800 min-w-0 flex-1">
                                    <h4 className="font-semibold text-base sm:text-lg mb-2">How to donate:</h4>
                                    <ul className="text-xs sm:text-sm space-y-1 list-disc list-inside">
                                        <li>Select your preferred payment method above</li>
                                        <li>Click "View QR" to see QR code in full screen, or copy the number</li>
                                        <li>Send your donation using your mobile banking app</li>
                                        <li>Your support helps maintain and improve this project! 🙏</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Enhanced Fullscreen QR Code Modal */}
            {fullscreenQR && (
                <div 
                    className="fixed inset-0 bg-black/95 backdrop-blur-sm flex justify-center items-center z-[60] p-4 animate-in fade-in-0 duration-300"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="qr-modal-title"
                >
                    <div className="relative max-w-lg w-full animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={closeFullscreenQR}
                            className="absolute -top-12 sm:-top-16 right-0 p-2 sm:p-3 text-white hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                            aria-label="Close QR code view"
                        >
                            <IoCloseOutline className="text-2xl sm:text-3xl" />
                        </button>
                        
                        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
                            <h3 id="qr-modal-title" className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 text-gray-800">
                                {fullscreenQR.name} QR Code
                            </h3>
                            <div className="flex justify-center mb-4 sm:mb-6">
                                <div className="p-3 sm:p-4 bg-gray-50 rounded-2xl">
                                    <img 
                                        src={fullscreenQR.url} 
                                        alt={`${fullscreenQR.name} QR Code`}
                                        className="w-64 h-64 sm:w-80 sm:h-80 object-contain rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-base sm:text-lg text-gray-700 mb-2">
                                    Scan this QR code with your {fullscreenQR.name} app
                                </p>
                                {donationAmount && (
                                    <p className="text-emerald-600 font-semibold text-sm sm:text-base">
                                        Amount: ৳{donationAmount}
                                    </p>
                                )}
                                
                                {/* Close button for mobile */}
                                <button
                                    onClick={closeFullscreenQR}
                                    className="mt-4 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors sm:hidden"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DonationModal;