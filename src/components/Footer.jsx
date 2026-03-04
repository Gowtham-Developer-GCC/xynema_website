import React from 'react';
import { Facebook, Twitter, Instagram, Youtube, Phone, Mail, MapPin, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-[#1a1f2c] text-gray-400 font-sans text-sm relative z-10 w-full mt-20 border-t border-gray-800">
            {/* Main Footer Content */}
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-20 pb-10">

                {/* Top Section: Brand & Links */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">

                    {/* Brand Column */}
                    <div className="col-span-1 lg:col-span-4 flex flex-col items-start pr-0 lg:pr-12">
                        {/* Logo Area */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-white shadow-md rounded-md flex items-center justify-center p-1.5 shrink-0 overflow-hidden transform hover:scale-105 transition-transform duration-300">
                                <img src="/favicon.ico" alt="Xynema Logo Symbol" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-2xl font-display font-bold text-white tracking-tight">Xynema</span>
                        </div>

                        <p className="text-sm text-gray-400 leading-relaxed mb-8">
                            Your ultimate destination for booking movie tickets, discovering events, and streaming premium content.
                        </p>

                        <div className="space-y-4">
                            <a href="tel:+919874563210" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                                <Phone className="w-4 h-4 text-[#3874c8] group-hover:text-blue-400 transition-colors" />
                                <span className="text-sm">+91 9874563210</span>
                            </a>
                            <a href="mailto:support@xynema.com" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                                <Mail className="w-4 h-4 text-[#3874c8] group-hover:text-blue-400 transition-colors" />
                                <span className="text-sm">support@xynema.com</span>
                            </a>
                            <div className="flex items-center gap-3 text-gray-400">
                                <MapPin className="w-4 h-4 text-[#3874c8] shrink-0" />
                                <span className="text-sm">Ernakulam, Kerala, India</span>
                            </div>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="col-span-1 lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h4 className="text-gray-200 font-medium mb-6 text-sm tracking-wide">Movies</h4>
                            <ul className="space-y-4 font-sans text-sm">
                                <li><Link to="/movies" className="text-gray-400 hover:text-white transition-colors">Now Showing</Link></li>
                                <li><Link to="/upcoming-movies" className="text-gray-400 hover:text-white transition-colors">Coming Soon</Link></li>
                                <li><Link to="/movies" className="text-gray-400 hover:text-white transition-colors">Recommended</Link></li>
                                <li><Link to="/movies" className="text-gray-400 hover:text-white transition-colors">Top Rated</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-gray-200 font-medium mb-6 text-sm tracking-wide">Events</h4>
                            <ul className="space-y-4 font-sans text-sm">
                                <li><Link to="/events" className="text-gray-400 hover:text-white transition-colors">Public Events</Link></li>
                                <li><Link to="/events" className="text-gray-400 hover:text-white transition-colors">Private Hosting</Link></li>
                                <li><Link to="/events" className="text-gray-400 hover:text-white transition-colors">Concerts</Link></li>
                                <li><Link to="/events" className="text-gray-400 hover:text-white transition-colors">Comedy Shows</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-gray-200 font-medium mb-6 text-sm tracking-wide">Company</h4>
                            <ul className="space-y-4 font-sans text-sm">
                                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                                <li><Link to="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
                                <li><Link to="/press" className="text-gray-400 hover:text-white transition-colors">Press & Media</Link></li>
                                <li><Link to="/advertise" className="text-gray-400 hover:text-white transition-colors">Advertise With Us</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-gray-200 font-medium mb-6 text-sm tracking-wide">Support</h4>
                            <ul className="space-y-4 font-sans text-sm">
                                <li><Link to="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
                                <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                                <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/refund" className="text-gray-400 hover:text-white transition-colors">Refund Policy</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Newsletter Sub-Section */}
                <div className="border-t border-gray-800/60 pt-12 pb-8 flex flex-col items-center justify-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-200 mb-2">Subscribe to Our Newsletter</h3>
                    <p className="text-sm text-gray-400 text-center mb-8 max-w-xl">
                        Get the latest movie releases, event updates, and exclusive offers delivered to your inbox.
                    </p>
                    <div className="flex w-full max-w-md gap-3">
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            className="flex-1 bg-[#252a37] border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3874c8] transition-colors"
                        />
                        <button className="bg-[#3874c8] hover:bg-[#2b5a9e] text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors">
                            <Send className="w-4 h-4" />
                            <span>Subscribe</span>
                        </button>
                    </div>
                </div>

                <div className="w-full h-px bg-gray-800/80 my-8"></div>

                {/* Social & Legal Row */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
                    <div className="flex items-center gap-4">
                        {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                            <a key={i} href="#" className="w-10 h-10 rounded-full bg-[#252a37] flex items-center justify-center text-gray-400 hover:bg-[#3874c8] hover:text-white transition-all group">
                                <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </a>
                        ))}
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">
                            © 2026 Xynema. All rights reserved.
                        </p>
                        <p className="text-[11px] text-gray-600 font-medium">
                            Made with ♥ in India
                        </p>
                    </div>
                </div>

            </div>

            {/* Absolute Bottom Strip */}
            <div className="bg-[#151924] py-4 px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-800/40">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-medium mr-2">We accept:</span>
                    {['Visa', 'Mastercard', 'UPI', 'Paytm'].map(method => (
                        <div key={method} className="bg-[#2a303e] text-gray-400 text-[10px] font-semibold px-3 py-1.5 rounded-md uppercase tracking-wide">
                            {method}
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 font-medium tracking-wide mr-1 border-r border-gray-800 pr-5">Download App</span>
                    <a href="#" className="transition-transform hover:scale-105 active:scale-95 duration-200">
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                            alt="Download on the App Store"
                            className="h-10 w-auto"
                        />
                    </a>
                    <a href="#" className="transition-transform hover:scale-105 active:scale-95 duration-200">
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                            alt="Get it on Google Play"
                            className="h-10 w-auto"
                        />
                    </a>
                </div>
            </div>

        </footer>
    );
};

export default Footer;
