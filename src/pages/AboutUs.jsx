import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Users, Target, TrendingUp, Heart, Zap, Shield, Sparkles } from 'lucide-react';
import SEO from '../components/SEO';

const AboutUs = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: "Your Gateway to Experiences",
            icon: Globe,
            content: "XYNEMA is your gateway to everything happening around you. From booking a football turf with friends to buying movie tickets, discovering local festivals, attending college events, or joining community celebrations or hosting events — XYNEMA brings all these experiences together in one simple platform.",
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-900/10"
        },
        {
            title: "Connecting the Ecosystem",
            icon: Users,
            content: "The platform connects users, venues, and event organizers, making it easy to discover, book, and manage activities in real time. Whether it’s a cinema show, a sports tournament, a music event, or a cultural festival, XYNEMA helps people find and participate in the best experiences happening in their city.",
            color: "text-purple-500",
            bg: "bg-purple-50 dark:bg-purple-900/10"
        },
        {
            title: "Local at Heart",
            icon: Target,
            content: "XYNEMA is designed to highlight the vibrant local ecosystem — including sports venues, independent theatres, community events, and regional festivals. We believe in the power of local discovery and the importance of supporting homegrown businesses.",
            color: "text-red-500",
            bg: "bg-red-50 dark:bg-red-900/10"
        },
        {
            title: "Growth & Community",
            icon: TrendingUp,
            content: "With affordable convenience fees, strong local partnerships, and powerful management tools for businesses, XYNEMA creates a platform where people discover experiences, communities celebrate together, and local businesses grow.",
            color: "text-green-500",
            bg: "bg-green-50 dark:bg-green-900/10"
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f1115] transition-colors duration-300">
            <SEO 
                title="About Us | Xynema" 
                description="Discover Xynema's mission to connect communities through cinema, sports, and local events."
            />

            {/* Hero Section */}
            <div className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
                {/* Background Decor */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <button 
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm font-medium text-gray-600 dark:text-gray-400 backdrop-blur-md"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>
                    
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight font-roboto leading-tight">
                        Empowering Your <br className="hidden md:block" />
                        <span className="text-primary">City's Heartbeat</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-sans">
                        XYNEMA is building the ultimate platform for discovery, connection, and celebration in every neighborhood.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {sections.map((section, index) => (
                        <div 
                            key={index}
                            className="p-8 rounded-3xl bg-gray-50 dark:bg-[#151924] border border-gray-100 dark:border-gray-800/50 hover:border-primary/20 transition-all group"
                        >
                            <div className={`w-14 h-14 rounded-2xl ${section.bg} flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500`}>
                                <section.icon className={`w-7 h-7 ${section.color}`} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-roboto">
                                {section.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[15px]">
                                {section.content}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Values Strip */}
                <div className="mt-24 pt-24 border-t border-gray-100 dark:border-gray-800/50">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 font-roboto">Rooted in Excellence</h2>
                        <p className="text-gray-500 dark:text-gray-400">Our core pillars of operation</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { icon: Heart, label: "Community First" },
                            { icon: Zap, label: "Instant Booking" },
                            { icon: Shield, label: "Secure Payments" },
                            { icon: Sparkles, label: "Premium Content" }
                        ].map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-3">
                                <item.icon className="w-8 h-8 text-primary" />
                                <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Closing Statement */}
                <div className="mt-32 max-w-3xl mx-auto text-center">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6">
                        Join the Journey
                    </div>
                    <p className="text-xl md:text-2xl font-medium text-gray-700 dark:text-gray-300 italic leading-relaxed font-roboto">
                        "Creating a platform where people discover experiences, communities celebrate together, and local businesses grow."
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
