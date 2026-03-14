import React from 'react';
import { Facebook, Instagram, Youtube, Linkedin, Phone, Mail, MapPin, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-[#1a202c] text-gray-400 font-sans text-sm relative z-10 w-full mt-20 border-t border-gray-800 pb-24 lg:pb-0">
            {/* Main Footer Content */}
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-20 pb-10">

                {/* Top Section: Brand & Links */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">

                    {/* Brand Column */}
                    <div className="col-span-1 lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left pr-0 lg:pr-12">
                        {/* Logo Area */}
                        <div className="flex items-center mb-6">
                            <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform duration-300 transform-gpu">
                                <img
                                    src="/assets/primary_Logo.png"
                                    alt="Xynema Logo Symbol"
                                    className="h-10 md:h-12 w-auto brightness-110"
                                />
                                <span className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Xynema</span>
                            </Link>
                        </div>

                        <p className="text-sm text-gray-400 leading-relaxed mb-10 max-w-sm">
                            Your ultimate destination for booking movie tickets, discovering events, and streaming premium content.
                        </p>

                        <div className="flex flex-col sm:flex-row items-stretch lg:items-center gap-4 sm:gap-6 md:gap-10">
                            <a href="tel:+04844531182" className="flex items-center gap-4 text-gray-400 hover:text-primary transition-all group shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-colors">
                                    <Phone className="w-5 h-5 text-primary/80 group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest leading-none">Call Us</span>
                                    <span className="text-sm font-bold text-gray-300 whitespace-nowrap">0484-4531182</span>
                                </div>
                            </a>
                            
                            <a href="mailto:care@xynema.in" className="flex items-center gap-4 text-gray-400 hover:text-primary transition-all group shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-colors">
                                    <Mail className="w-5 h-5 text-primary/80 group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest leading-none">Email Support</span>
                                    <span className="text-sm font-bold text-gray-300">care@xynema.in</span>
                                </div>
                            </a>
                        </div>
                        
                        <div className="flex flex-col gap-3 mt-6 pl-1 animate-in fade-in slide-in-from-left duration-700">
                            <div className="flex items-center gap-4 group">
                                <div className="w-5 flex justify-center">
                                    <MapPin className="w-4 h-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Cochin, Kerala, India</span>
                            </div>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="col-span-1 lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:pl-10">
                        <div>
                            <h4 className="text-gray-100 font-bold mb-6 text-sm tracking-wider font-roboto">Movies</h4>
                            <ul className="space-y-4 font-sans text-sm">
                                <li><Link to="/movies" className="text-gray-500 hover:text-primary transition-colors">Now Showing</Link></li>
                                <li><Link to="/movies?tab=upcoming" className="text-gray-500 hover:text-primary transition-colors">Coming Soon</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-gray-100 font-bold mb-6 text-sm tracking-wider font-roboto">Events</h4>
                            <ul className="space-y-4 font-sans text-sm">
                                <li><Link to="/events" className="text-gray-500 hover:text-primary transition-colors">Public Events</Link></li>
                                <li><Link to="/private-events" className="text-gray-500 hover:text-primary transition-colors">Private Hosting</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-gray-100 font-bold mb-6 text-sm tracking-wider font-roboto">Company</h4>
                            <ul className="space-y-4 font-sans text-sm">
                                <li><Link to="/about" className="text-gray-500 hover:text-primary transition-colors">About Us</Link></li>
                                <li><Link to="/help" className="text-gray-500 hover:text-primary transition-colors">Help Center</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-gray-100 font-bold mb-6 text-sm tracking-wider font-roboto">Terms & Policies</h4>
                            <ul className="space-y-4 font-sans text-sm">
                                <li><Link to="/terms" className="text-gray-500 hover:text-primary transition-colors">Terms of Service</Link></li>
                                <li><Link to="/privacy" className="text-gray-500 hover:text-primary transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/refund" className="text-gray-500 hover:text-primary transition-colors">Refund Policy</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="w-full h-px bg-gray-800/40 mt-16 mb-8"></div>

                {/* Social & Legal Row */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        {[
                            { Icon: Facebook, url: "https://www.facebook.com/profile.php?id=61583680624803" },
                            { Icon: Instagram, url: "https://www.instagram.com/xynema.pvt.ltd/" },
                            { Icon: Youtube, url: "https://www.youtube.com/channel/UCzg6LrONPKNcZFbrt-gSSgw" },
                            { Icon: Linkedin, url: "https://www.linkedin.com/company/gcc-dynamics" }
                        ].map((social, i) => (
                            <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#252a37]/50 flex items-center justify-center text-gray-500 hover:bg-primary/20 hover:text-primary transition-all group">
                                <social.Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </a>
                        ))}
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-1.5">
                        <p className="text-xs text-gray-500 tracking-wide">
                            © 2026 Xynema. All rights reserved.
                        </p>
                        <p className="text-[11px] text-gray-600 font-medium flex items-center gap-1 opacity-80">
                            Made with <span className="text-gray-500 text-[10px]">♥</span> in India
                        </p>
                    </div>
                </div>

            </div>

            {/* Absolute Bottom Strip */}
            <div className="bg-[#151924]/80 backdrop-blur-sm py-8 lg:py-4 px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-6 border-t border-gray-800/30">
                <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
                    <span className="text-[10px] sm:text-[11px] text-gray-600 font-black uppercase tracking-wider md:mr-2 w-full md:w-auto text-center md:text-left mb-2 md:mb-0">We accept:</span>
                    {['Visa', 'Mastercard', 'UPI', 'Rupay'].map(method => (
                        <div key={method} className="bg-[#1c2230] border border-white/5 text-gray-500 text-[9px] font-black px-3 py-1.5 rounded uppercase tracking-widest shadow-sm">
                            {method}
                        </div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className="flex items-center lg:border-r border-gray-800/80 lg:pr-6 lg:mr-2">
                        <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Download App</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="#" className="transition-all hover:scale-105 active:scale-95 duration-200 shadow-lg rounded-md overflow-hidden border border-white/5 shrink-0">
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                                alt="Download on the App Store"
                                className="h-8 md:h-9 w-auto"
                            />
                        </a>
                        <a href="#" className="transition-all hover:scale-105 active:scale-95 duration-200 shadow-lg rounded-md overflow-hidden border border-white/5 shrink-0">
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                                alt="Get it on Google Play"
                                className="h-8 md:h-9 w-auto"
                            />
                        </a>
                    </div>
                </div>
            </div>

        </footer>
    );
};

export default Footer;
