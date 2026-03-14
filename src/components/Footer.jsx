import React from 'react';
import { Facebook, Instagram, Youtube, Linkedin, Phone, Mail, MapPin, Send } from 'lucide-react';
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
                        <div className="flex items-center mb-6">
                            <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform duration-300 transform-gpu">
                                <img
                                    src="/assets/primary_Logo.png"
                                    alt="Xynema Logo Symbol"
                                    className="h-10 md:h-14 w-auto brightness-1"
                                />
                                <span className="text-2xl font-roboto font-bold text-white uppercase">Xynema</span>
                            </Link>
                        </div>

                        <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-sm">
                            Your ultimate destination for booking movie tickets, discovering events, and streaming premium content.
                        </p>

                        <div className="space-y-4">
                            <a href="tel:+04844531182" className="flex items-center gap-3 text-gray-400 hover:text-primary transition-all group font-sans">
                                <Phone className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">0484-4531182</span>
                            </a>
                            <a href="mailto:care@xynema.in" className="flex items-center gap-3 text-gray-400 hover:text-primary transition-all group font-sans">
                                <Mail className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">care@xynema.in</span>
                            </a>
                            <div className="flex items-center gap-3 text-gray-400 font-sans">
                                <MapPin className="w-4 h-4 text-primary shrink-0" />
                                <span className="text-sm font-medium">Cochin, Kerala, India</span>
                            </div>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="col-span-1 lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8 md:pl-10">
                        <div>
                            <h4 className="text-gray-200 font-bold mb-6 text-sm tracking-wider font-roboto">Movies</h4>
                            <ul className="space-y-4 font-sans text-sm">
                                <li><Link to="/movies" className="text-gray-400 hover:text-primary transition-colors">Now Showing</Link></li>
                                <li><Link to="/movies?tab=upcoming" className="text-gray-400 hover:text-primary transition-colors">Coming Soon</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-gray-200 font-bold mb-6 text-sm tracking-wider font-roboto">Events</h4>
                            <ul className="space-y-4 font-sans text-sm">
                                <li><Link to="/events" className="text-gray-400 hover:text-primary transition-colors">Public Events</Link></li>
                                <li><Link to="/private-events" className="text-gray-400 hover:text-primary transition-colors">Private Hosting</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-gray-200 font-bold mb-6 text-sm tracking-wider font-roboto">Help</h4>
                            <ul className="space-y-4 font-sans text-sm">
                                <li><Link to="/about" className="text-gray-400 hover:text-primary transition-colors">About Us</Link></li>
                                <li><Link to="/help" className="text-gray-400 hover:text-primary transition-colors">Help Center</Link></li>
                                <li><Link to="/terms" className="text-gray-400 hover:text-primary transition-colors">Terms of Service</Link></li>
                                <li><Link to="/privacy" className="text-gray-400 hover:text-primary transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/refund" className="text-gray-400 hover:text-primary transition-colors">Refund Policy</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="w-full h-px bg-gray-800/80 my-8"></div>

                {/* Social & Legal Row */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        {[
                            { Icon: Facebook, url: "https://www.facebook.com/profile.php?id=61583680624803" },
                            { Icon: Instagram, url: "https://www.instagram.com/xynema.pvt.ltd/" },
                            { Icon: Youtube, url: "https://www.youtube.com/channel/UCzg6LrONPKNcZFbrt-gSSgw" },
                            { Icon: Linkedin, url: "https://www.linkedin.com/company/gcc-dynamics" }
                        ].map((social, i) => (
                            <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#252a37] flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all group scale-90 hover:scale-105">
                                <social.Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </a>
                        ))}
                    </div>

                    <div className="flex flex-col items-center md:items-end">
                        <p className="text-xs text-gray-500 mb-1">
                            © 2026 Xynema. All rights reserved.
                        </p>
                        <p className="text-[11px] text-gray-600 font-medium flex items-center gap-1">
                            Made with <span className="text-primary text-[10px]">♥</span> in India
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
                            className="h-8 w-auto"
                        />
                    </a>
                    <a href="#" className="transition-transform hover:scale-105 active:scale-95 duration-200">
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                            alt="Get it on Google Play"
                            className="h-8 w-auto"
                        />
                    </a>
                </div>
            </div>


        </footer>
    );
};

export default Footer;
