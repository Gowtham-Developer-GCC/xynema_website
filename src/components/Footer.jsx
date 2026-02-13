import React from 'react';
import { Facebook, Twitter, Instagram, Youtube, Linkedin, Headphones, Ticket, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-[#333545] text-gray-400 font-sans text-sm">
            {/* Top Stats/Info */}
            <div className="bg-[#404454] py-4">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex items-center gap-4 text-white border-b border-gray-600 md:border-none pb-4 md:pb-0">
                        <Headphones className="w-10 h-10 text-white" />
                        <div>
                            <p className="font-display font-bold text-sm uppercase tracking-wider text-white">24/7 Customer Care</p>
                            <p className="text-xs text-gray-400">We're here to help you 24/7</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-white md:border-x border-gray-600 md:px-8 border-b md:border-b-0 pb-4 md:pb-0">
                        <Ticket className="w-10 h-10 text-white" />
                        <div>
                            <p className="font-display font-bold text-sm uppercase tracking-wider text-white">Send Booking Confirmation</p>
                            <p className="text-xs text-gray-400">Send booking confirmation to your email!</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-white">
                        <Smartphone className="w-10 h-10 text-white" />
                        <div>
                            <p className="font-display font-bold text-sm uppercase tracking-wider text-white">Subscribe to Newsletter</p>
                            <p className="text-xs text-gray-400">Get latest movie updates</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Links Section */}
            <div className="py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center md:text-left">
                        <div>
                            <h4 className="text-white font-display font-bold uppercase mb-6 text-xs tracking-widest border-l-4 border-xynemaRose pl-3">Explore Movies</h4>
                            <ul className="space-y-3 font-sans">
                                <li><Link to="/movies" className="hover:text-white transition-colors text-xs">Latest Releases</Link></li>
                                <li><Link to="/upcoming-movies" className="hover:text-white transition-colors text-xs">Upcoming Movies</Link></li>
                                <li><Link to="/movies" className="hover:text-white transition-colors text-xs">Recommended</Link></li>
                                <li><Link to="/favorites" className="hover:text-white transition-colors text-xs">My Favorites</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-display font-bold uppercase mb-6 text-xs tracking-widest border-l-4 border-xynemaRose pl-3">Events & Activities</h4>
                            <ul className="space-y-3 font-sans">
                                <li><Link to="/explore" className="hover:text-white transition-colors text-xs">Public Events</Link></li>
                                <li><Link to="/explore?category=Plays" className="hover:text-white transition-colors text-xs">Plays & Theatre</Link></li>
                                <li><Link to="/explore?category=Sports" className="hover:text-white transition-colors text-xs">Sports Events</Link></li>
                                <li><Link to="/explore?category=Activities" className="hover:text-white transition-colors text-xs">Outdoor Activities</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-display font-bold uppercase mb-6 text-xs tracking-widest border-l-4 border-xynemaRose pl-3">Your Account</h4>
                            <ul className="space-y-3 font-sans">
                                <li><Link to="/profile" className="hover:text-white transition-colors text-xs">My Profile</Link></li>
                                <li><Link to="/bookings" className="hover:text-white transition-colors text-xs">Movie Bookings</Link></li>
                                <li><Link to="/events-bookings" className="hover:text-white transition-colors text-xs">Event Tickets</Link></li>
                                <li><Link to="/store" className="hover:text-white transition-colors text-xs">Xynema Store</Link></li>
                            </ul>
                        </div>

                        <div className="flex flex-col items-center md:items-start font-sans">
                            <h4 className="text-white font-display font-bold uppercase mb-6 text-xs tracking-widest border-l-4 border-xynemaRose pl-3">Help & Policy</h4>
                            <ul className="space-y-3 font-sans mb-8">
                                <li><Link to="/terms" className="hover:text-white transition-colors text-xs">Terms of Use</Link></li>
                                <li><Link to="/privacy" className="hover:text-white transition-colors text-xs">Privacy Policy</Link></li>
                            </ul>

                            <div className="mb-8">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Download our App</p>
                                <a
                                    href="https://play.google.com/store/apps/details?id=com.xynema.movieapp"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 bg-black border border-gray-600/50 rounded-xl px-4 py-2 hover:bg-gray-900 transition-all group shadow-lg hover:shadow-xl w-auto"
                                >
                                    <img src="https://yt3.googleusercontent.com/PJh5BeCRze4_08Qp8zOtb2bV6JGLiqmmc9QIRTVeTlrVmC2828C7gw5KIOU8uk70jN__SSY5Ug=s900-c-k-c0x00ffffff-no-rj" alt="Google Play" className="w-8 h-8 shrink-0 rounded-full" />
                                    <div className="flex flex-col items-start -space-y-1">
                                        <span className="text-[10px] text-gray-300 font-medium tracking-wide">GET IT ON</span>
                                        <span className="text-lg text-white font-bold tracking-tight font-sans">Google Play</span>
                                    </div>
                                </a>
                            </div>

                            <div className="flex gap-4">
                                {[Facebook, Twitter, Instagram, Youtube, Linkedin].map((Icon, i) => (
                                    <a key={i} href="#" className="w-8 h-8 rounded-full bg-[#404454] flex items-center justify-center hover:bg-xynemaRose hover:text-white transition-all">
                                        <Icon className="w-4 h-4" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Strip */}
            <div className="bg-[#1F212E] py-8 text-center">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-xs mb-4 text-gray-500">
                        Copyright {new Date().getFullYear()} © Xynema Entertainment Pvt. Ltd. All Rights Reserved.
                    </p>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        The content and images used on this site are copyright protected and copyrights vests with the respective owners. Unauthorized use is prohibited.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
