import React, { useState, useEffect } from 'react';
import DonationModal from '../components/DonationModal'; // Import the new modal
import { 
    IoHeart, 
    IoCodeSlash, 
    IoLogoGithub, 
    IoPersonCircleOutline, 
    IoLinkOutline, 
    IoStarOutline,
    IoMailOutline,
    IoPhonePortraitOutline,
    IoLocationOutline,
    IoBulbOutline,
    IoRocketOutline,
    IoShieldCheckmarkOutline,
    IoInformationCircleOutline
} from "react-icons/io5";

const Settings = ({ setHeaderTitle }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [animateCard, setAnimateCard] = useState(false);

    useEffect(() => {
        setHeaderTitle('Settings');
        // Trigger animation on mount
        setTimeout(() => setAnimateCard(true), 100);
    }, [setHeaderTitle]);

    const developerInfo = {
        name: "Jafor Sadik",
        title: "Full Stack Developer",
        location: "Bangladesh 🇧🇩",
        email: "jaheenshahariar@gmail.com",
        githubUrl: "https://github.com/jaheen12",
        portfolioUrl: "https://jaheen12.github.io/",
        bio: "Passionate developer creating innovative solutions with modern technologies. Focused on building user-friendly applications that make a difference.",
    };

    const appFeatures = [
        { icon: IoRocketOutline, title: "Fast Performance", desc: "Optimized for speed and efficiency" },
        { icon: IoShieldCheckmarkOutline, title: "Secure & Reliable", desc: "Built with security best practices" },
        { icon: IoBulbOutline, title: "User-Friendly", desc: "Intuitive design for better experience" },
    ];

    const supportReasons = [
        "☕ Buy me a coffee to fuel late-night coding sessions",
        "🚀 Help improve and add new features",
        "💡 Support ongoing maintenance and updates",
        "🌟 Encourage open-source development"
    ];

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
                <div className="max-w-5xl mx-auto space-y-8">
                    
                    {/* Developer Profile Section */}
                    <div className={`bg-white p-8 rounded-3xl shadow-lg border border-gray-100 transform transition-all duration-700 ${animateCard ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <div className="flex items-center gap-6 mb-6">
                            <IoCodeSlash size={32} className="text-blue-600" />
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800">Meet the Developer</h2>
                                <p className="text-gray-500">The person behind this application</p>
                            </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Profile Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <IoPersonCircleOutline size={80} className="text-gray-300" />
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">{developerInfo.name}</h3>
                                        <p className="text-blue-600 font-semibold">{developerInfo.title}</p>
                                        <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                                            <IoLocationOutline size={16} />
                                            {developerInfo.location}
                                        </div>
                                    </div>
                                </div>
                                
                                <p className="text-gray-600 leading-relaxed">{developerInfo.bio}</p>
                                
                                {/* Contact Info */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <IoMailOutline size={18} className="text-blue-500" />
                                        <span className="text-sm">{developerInfo.email}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Links & Actions */}
                            <div className="space-y-4">
                                <h4 className="text-lg font-semibold text-gray-800 mb-4">Connect & Follow</h4>
                                
                                <div className="space-y-3">
                                    <a 
                                        href={developerInfo.githubUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                                    >
                                        <IoLogoGithub size={24} className="text-gray-700 group-hover:text-black" />
                                        <div>
                                            <p className="font-semibold text-gray-800">GitHub Profile</p>
                                            <p className="text-sm text-gray-500">View my open-source projects</p>
                                        </div>
                                        <IoLinkOutline size={18} className="text-gray-400 ml-auto" />
                                    </a>
                                    
                                    <a 
                                        href={developerInfo.portfolioUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 group"
                                    >
                                        <IoPersonCircleOutline size={24} className="text-blue-600 group-hover:text-blue-700" />
                                        <div>
                                            <p className="font-semibold text-gray-800">Portfolio Website</p>
                                            <p className="text-sm text-gray-500">Explore my work & projects</p>
                                        </div>
                                        <IoLinkOutline size={18} className="text-gray-400 ml-auto" />
                                    </a>
                                </div>
                                
                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl text-center border border-blue-100">
                                        <IoStarOutline size={24} className="text-blue-600 mx-auto mb-2" />
                                        <p className="text-sm font-semibold text-gray-700">Quality Code</p>
                                    </div>
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl text-center border border-green-100">
                                        <IoRocketOutline size={24} className="text-green-600 mx-auto mb-2" />
                                        <p className="text-sm font-semibold text-gray-700">Fast Delivery</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* App Features Section */}
                    <div className={`bg-white p-8 rounded-3xl shadow-lg border border-gray-100 transform transition-all duration-700 delay-150 ${animateCard ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <div className="flex items-center gap-4 mb-6">
                            <IoBulbOutline size={28} className="text-yellow-500" />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">App Features</h2>
                                <p className="text-gray-500">What makes this application special</p>
                            </div>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-6">
                            {appFeatures.map((feature, index) => (
                                <div key={index} className="text-center p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-200 group">
                                    <feature.icon size={40} className="text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                                    <h3 className="font-bold text-gray-800 mb-2">{feature.title}</h3>
                                    <p className="text-gray-600 text-sm">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Support & Donation Section */}
                    <div className={`bg-gradient-to-r from-red-50 to-pink-50 p-8 rounded-3xl shadow-lg border border-red-100 transform transition-all duration-700 delay-300 ${animateCard ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <div className="flex items-center gap-4 mb-6">
                            <IoHeart size={32} className="text-red-500" />
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800">Support This Project ❤️</h2>
                                <p className="text-gray-600">Help keep this project alive and growing</p>
                            </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                                    Your support means the world to me! If this app has helped you in any way, 
                                    please consider making a small contribution to support its continued development.
                                </p>
                                
                                <div className="space-y-3 mb-6">
                                    <h4 className="font-semibold text-gray-800 mb-3">Your donation helps with:</h4>
                                    {supportReasons.map((reason, index) => (
                                        <div key={index} className="flex items-start gap-2 text-gray-600">
                                            <span className="text-sm leading-relaxed">{reason}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex flex-col justify-center">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-4">
                                    <div className="text-center mb-4">
                                        <IoInformationCircleOutline size={48} className="text-blue-500 mx-auto mb-3" />
                                        <p className="text-gray-600 text-sm">
                                            Every contribution, no matter how small, is deeply appreciated 
                                            and helps keep this project running! 🙏
                                        </p>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold text-xl rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                                >
                                    <IoHeart size={24} />
                                    💝 Make a Donation
                                </button>
                                
                                <p className="text-center text-gray-500 text-sm mt-3">
                                    Secure local payment methods available
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* App Info Footer */}
                    <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center transform transition-all duration-700 delay-500 ${animateCard ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <p className="text-gray-500 text-sm">
                            Made with ❤️ using React, Tailwind CSS, and lots of coffee ☕
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            © 2025 {developerInfo.name}. Built with passion for the community.
                        </p>
                    </div>
                </div>
            </div>
            
            {/* --- THE MODAL COMPONENT IS RENDERED HERE --- */}
            <DonationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
};

export default Settings;