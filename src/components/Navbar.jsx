import React, { useState, useEffect } from 'react';
import { Search, MapPin, ChevronDown, LogOut, Ticket, Calendar, Menu, Bell, Play, CreditCard, HelpCircle, Settings, Gift, X, MessageSquare, ChevronRight, Heart, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import UniversalSearch from './UniversalSearch';
const Navbar = ({ selectedCity, setSelectedCity, openCityModal }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const { user, logoutUser, openLogin } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.openLogin && !user) {
            openLogin();
            window.history.replaceState({}, document.title);
        }
    }, [location, user, openLogin]);

    const sidebarItems = [
        { icon: Ticket, title: 'Your Orders', description: 'View all your bookings & purchases', path: '/bookings' },
        { icon: Heart, title: 'Favorites', description: 'Your saved movies & events', path: '/favorites' },
        { icon: Menu, title: 'Store', description: 'Rented & Purchased Movies', path: '/store' },
        { icon: Settings, title: 'Accounts & Settings', description: 'Location, Payments, Permissions & More', path: '/profile' },
    ];

    return (
        <>
            <nav className="bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl text-gray-800 dark:text-gray-100 sticky top-0 z-[60] border-b border-white/50 dark:border-gray-800 shadow-[0_4px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
                <div className="w-full mx-auto px-4 sm:px-8 lg:px-12">
                    <div className="flex justify-between items-center h-16 md:h-20">

                        {/* Left: Logo & City */}
                        <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
                            <Link to="/" className="flex items-center gap-2 group">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                    <Play className="w-4 h-4 md:w-5 md:h-5 fill-white text-white translate-x-0.5" />
                                </div>
                                <span className="text-xl md:text-2xl font-display font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none group-hover:opacity-90 transition-opacity">Xynema</span>
                            </Link>

                            <button
                                onClick={openCityModal}
                                className="flex items-center gap-1 md:gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-xl transition-colors group text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm ml-2 md:ml-6 border border-white/60 dark:border-gray-700"
                            >
                                <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                <span className="text-gray-800 dark:text-gray-200 group-hover:text-[#2563EB] truncate max-w-[80px] md:max-w-none">{selectedCity || 'Select City'}</span>
                                <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 group-hover:text-[#2563EB] mb-[1px] md:mb-0.5" />
                            </button>
                        </div>

                        {/* Center: Nav Links */}
                        <div className="hidden lg:flex items-center justify-center gap-8 text-[15px] font-bold text-gray-800 dark:text-gray-100 absolute left-1/2 -translate-x-1/2">
                            <Link to="/" className={`relative py-1 transition-colors ${location.pathname === '/' ? 'text-[#2563EB] after:content-[\'\'] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-[#2563EB]' : 'hover:text-[#2563EB]'}`}>For You</Link>
                            <Link to="/movies" className={`relative py-1 transition-colors ${location.pathname.startsWith('/movies') && location.pathname !== '/' ? 'text-[#2563EB] after:content-[\'\'] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-[#2563EB]' : 'hover:text-[#2563EB]'}`}>Movies</Link>
                            <Link to="/events" className={`relative py-1 transition-colors ${location.pathname.startsWith('/events') ? 'text-[#2563EB] after:content-[\'\'] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-[#2563EB]' : 'hover:text-[#2563EB]'}`}>Events</Link>
                        </div>

                        {/* Right: Search & Actions */}
                        <div className="flex items-center justify-end gap-3 md:gap-4 flex-1">
                            {/* Mobile Search Toggle */}
                            <button
                                onClick={() => setIsMobileSearchOpen(true)}
                                className="md:hidden p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
                            >
                                <Search className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </button>

                            {/* Desktop Search */}
                            <div className="hidden md:block w-56 lg:w-72">
                                <UniversalSearch variant="navbar" className="w-full" />
                            </div>

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:flex items-center justify-center text-gray-600 dark:text-gray-300"
                                aria-label="Toggle dark mode"
                            >
                                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            {user ? (
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="flex items-center gap-2 pl-1.5 pr-4 py-1.5 hover:bg-gray-50 rounded-full transition-all border border-transparent hover:border-gray-200"
                                >
                                    <img
                                        src={user.photoUrl || user.picture || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`}
                                        className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 object-cover shadow-sm"
                                        alt=""
                                    />
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden lg:block">Hi, {user.displayName?.split(' ')[0] || 'Guest'}</span>
                                </button>
                            ) : (
                                <button
                                    onClick={openLogin}
                                    className="bg-[#2563EB] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all hover:bg-blue-700 active:scale-95 shadow-sm hidden md:block"
                                >
                                    Sign Up
                                </button>
                            )}

                            {/* Mobile Menu & Theme Toggle */}
                            <div className="flex items-center gap-1 lg:hidden">
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all text-gray-600 dark:text-gray-300"
                                >
                                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                </button>
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all text-gray-600 dark:text-gray-300"
                                >
                                    <Menu className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Mobile Search Overlay */}
                {isMobileSearchOpen && (
                    <div className="absolute inset-x-0 top-0 h-16 bg-white dark:bg-gray-900 z-[65] border-b border-gray-100 dark:border-gray-800 flex items-center px-4 gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex-1 flex items-center gap-3">
                            <UniversalSearch
                                variant="navbar"
                                className="flex-1"
                                onSelect={() => setIsMobileSearchOpen(false)}
                            />
                            <button
                                onClick={() => setIsMobileSearchOpen(false)}
                                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0"
                            >
                                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                )}

            </nav >

            {/* Side Drawer Overlay - Moved OUTSIDE <nav> to avoid filter/transform issues */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-[100] transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                >
                    <div
                        className="absolute right-0 top-0 h-full w-full max-w-[380px] bg-white dark:bg-gray-900 shadow-2xl flex flex-col animate-slide-in"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-8 pb-10 bg-gradient-to-br from-xynemaRose via-charcoalSlate to-charcoalSlate text-white relative overflow-hidden shrink-0">
                            {/* Decorative background circle */}
                            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl animate-pulse" />

                            <div className="flex items-center justify-between relative z-10 pt-4">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em]">Personal Hub</p>
                                    <h2 className="text-3xl font-display font-black tracking-tighter uppercase leading-tight truncate pr-4">
                                        {user ? user.displayName : 'Welcome!'}
                                    </h2>
                                    {user ? (
                                        <div className="flex items-center gap-4 pt-1">
                                            <Link
                                                to="/profile"
                                                onClick={() => setIsSidebarOpen(false)}
                                                className="text-[9px] text-xynemaRose font-black uppercase tracking-[0.2em] bg-white px-3 py-1 rounded-full shadow-lg shadow-black/20 flex items-center gap-1 hover:scale-105 transition-all"
                                            >
                                                Account <ChevronRight className="w-2 h-2" />
                                            </Link>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em]">Enter the premium experience</p>
                                    )}
                                </div>
                                {user ? (
                                    <div className="relative">
                                        <img
                                            src={user?.photoUrl || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}&background=random`}
                                            alt=""
                                            className="w-16 h-16 rounded-2xl border-2 border-white/20 shadow-2xl"
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-charcoalSlate rounded-full" />
                                    </div>
                                ) : (
                                    <button
                                        onClick={openLogin}
                                        className="text-[9px] text-xynemaRose font-black uppercase tracking-[0.2em] bg-white px-3 py-1 rounded-full shadow-lg shadow-black/20 flex items-center gap-1 hover:scale-105 transition-all">Sign In</button>
                                )}
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto py-4 space-y-1">
                            {/* Mobile Only Browsing Links */}
                            <div className="lg:hidden pb-2 mb-2 border-b border-gray-50 dark:border-gray-800">
                                <Link to="/#recommended-section" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-4 px-6 py-3 border-l-4 transition-all group ${location.pathname === '/' ? 'bg-blue-50/50 dark:bg-blue-900/20 border-[#2563EB]' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    <div className="w-5 flex justify-center"><Heart className={`w-4 h-4 transition-colors ${location.pathname === '/' ? 'text-[#2563EB]' : 'text-gray-400 group-hover:text-xynemaRose'}`} /></div>
                                    <span className={`text-sm font-medium ${location.pathname === '/' ? 'text-[#2563EB]' : 'text-gray-800 dark:text-gray-200'}`}>For You</span>
                                </Link>
                                <Link to="/movies" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-4 px-6 py-3 border-l-4 transition-all group ${location.pathname.startsWith('/movies') && location.pathname !== '/' ? 'bg-blue-50/50 dark:bg-blue-900/20 border-[#2563EB]' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    <div className="w-5 flex justify-center"><Play className={`w-4 h-4 transition-colors ${location.pathname.startsWith('/movies') && location.pathname !== '/' ? 'text-[#2563EB]' : 'text-gray-400 group-hover:text-xynemaRose'}`} /></div>
                                    <span className={`text-sm font-medium ${location.pathname.startsWith('/movies') && location.pathname !== '/' ? 'text-[#2563EB]' : 'text-gray-800 dark:text-gray-200'}`}>Movies</span>
                                </Link>
                                <Link to="/events" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-4 px-6 py-3 border-l-4 transition-all group ${location.pathname.startsWith('/events') ? 'bg-blue-50/50 dark:bg-blue-900/20 border-[#2563EB]' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    <div className="w-5 flex justify-center"><Calendar className={`w-4 h-4 transition-colors ${location.pathname.startsWith('/events') ? 'text-[#2563EB]' : 'text-gray-400 group-hover:text-xynemaRose'}`} /></div>
                                    <span className={`text-sm font-medium ${location.pathname.startsWith('/events') ? 'text-[#2563EB]' : 'text-gray-800 dark:text-gray-200'}`}>Events</span>
                                </Link>
                            </div>

                            {sidebarItems.map((item, idx) => (
                                <Link
                                    key={idx}
                                    to={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <item.icon className="w-5 h-5 text-gray-400 group-hover:text-xynemaRose transition-colors" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{item.title}</p>
                                            {item.description && (
                                                <p className="text-[10px] text-gray-400 mt-0.5">{item.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-gray-400 transition-colors" />
                                </Link>
                            ))}
                        </div>

                        {/* Sign Out */}
                        {user && (
                            <div className="p-6 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        logoutUser();
                                        setIsSidebarOpen(false);
                                    }}
                                    className="w-full py-3 text-red-500 font-bold border border-red-100 bg-red-50/50 hover:bg-red-50 rounded-lg text-xs transition-all"
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )
            }

        </>
    );
};

export default Navbar;
