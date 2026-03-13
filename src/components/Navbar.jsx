import React, { useState, useEffect } from 'react';
import { Search, MapPin, ChevronDown, LogOut, Ticket, Calendar, Menu, Bell, Play, CreditCard, HelpCircle, Settings, Gift, X, MessageSquare, ChevronRight, Heart, Moon, Sun, Wallet, Shield, Edit3 } from 'lucide-react';
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
        { icon: Wallet, title: 'Wallet', path: '/profile' },
        { icon: Ticket, title: 'My tickets', path: '/bookings' },
        { icon: CreditCard, title: 'Payment methods', path: '/profile' },
        { icon: Gift, title: 'Offers & Promos', path: '/' },
        { icon: Bell, title: 'Notifications', path: '/' },
        { icon: Shield, title: 'Account privacy', path: '/profile' },
        { icon: MapPin, title: 'Location', path: '/' },
        { icon: HelpCircle, title: 'Help & support', path: '/contact' },
    ];

    return (
        <>
            <nav className="bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl text-gray-800 dark:text-gray-100 sticky top-0 z-[60] border-b border-white/50 dark:border-gray-800 shadow-[0_4px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
                <div className="w-[95%] md:w-[90%] lg:w-[80%] xl:w-[75%] mx-auto px-4">
                    <div className="flex justify-between items-center h-16 md:h-20">

                        {/* Left: Logo & City */}
                        <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
                            <Link to="/" className="flex items-center gap-2 group">
                                <img
                                    src="/assets/primary_Logo.png"
                                    alt="Xynema Logo"
                                    className="h-8 md:h-14 w-auto group-hover:scale-105 transition-transform duration-300 transform-gpu"
                                />
                                <span className="text-xl md:text-2xl font-display font-bold text-gray-900 dark:text-white uppercase leading-none group-hover:opacity-90 transition-opacity">Xynema</span>
                            </Link>

                            <button
                                onClick={openCityModal}
                                className="flex items-center gap-1 md:gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-xl transition-colors group text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm ml-2 md:ml-6 border border-white/60 dark:border-gray-700"
                            >
                                <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                <span className="text-gray-800 dark:text-gray-200 group-hover:text-primary truncate max-w-[80px] md:max-w-none">{selectedCity || 'Select City'}</span>
                                <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 group-hover:text-primary mb-[1px] md:mb-0.5" />
                            </button>
                        </div>

                        {/* Center: Nav Links */}
                        <div className="hidden lg:flex items-center justify-center gap-8 text-[15px] font-bold text-gray-800 dark:text-gray-100 absolute left-1/2 -translate-x-1/2">
                            <Link to="/" className={`relative py-1 transition-colors ${location.pathname === '/' ? 'text-primary after:content-[\'\'] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-primary' : 'hover:text-primary'}`}>For You</Link>
                            <Link to="/movies" className={`relative py-1 transition-colors ${location.pathname.startsWith('/movies') && location.pathname !== '/' ? 'text-primary after:content-[\'\'] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-primary' : 'hover:text-primary'}`}>Movies</Link>
                            <Link to="/events" className={`relative py-1 transition-colors ${location.pathname.startsWith('/events') ? 'text-primary after:content-[\'\'] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-primary' : 'hover:text-primary'}`}>Events</Link>
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
                                    className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-90 active:scale-95 shadow-sm hidden md:block"
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

            {/* Side Drawer Overlay — Liquid Glass Effect */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-[100]"
                    onClick={() => setIsSidebarOpen(false)}
                >
                    {/* Frosted overlay backdrop */}
                    <div className={`absolute inset-0 backdrop-blur-[2px] transition-colors duration-500 ${isDarkMode ? 'bg-black/40' : 'bg-black/20'}`} />

                    {/* Glass Panel */}
                    <div
                        className="absolute right-0 top-0 h-full w-full max-w-[320px] flex flex-col animate-slide-in"
                        style={{
                            background: isDarkMode 
                                ? 'linear-gradient(180deg, rgba(30,32,40,0.92) 0%, rgba(20,22,28,0.88) 40%, rgba(15,17,21,0.85) 100%)'
                                : 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(245,245,250,0.82) 40%, rgba(240,240,245,0.78) 100%)',
                            backdropFilter: 'blur(60px) saturate(2)',
                            WebkitBackdropFilter: 'blur(60px) saturate(2)',
                            borderLeft: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.5)',
                            boxShadow: isDarkMode 
                                ? '-10px 0 60px rgba(0,0,0,0.4), inset 1px 0 0 rgba(255,255,255,0.05)'
                                : '-10px 0 60px rgba(0,0,0,0.06), inset 1px 0 0 rgba(255,255,255,0.7)',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Profile Header */}
                        <div className="relative px-6 pt-7 pb-6 shrink-0">
                            {/* Edit icon — top right */}
                            <Link
                                to="/profile"
                                onClick={() => setIsSidebarOpen(false)}
                                className={`absolute top-6 right-5 z-20 p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                            >
                                <Edit3 className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            </Link>

                            {/* Avatar */}
                            <div className="flex justify-start mb-4">
                                {user ? (
                                    <div className="relative">
                                        <img
                                            src={user?.photoUrl || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}&background=random`}
                                            alt=""
                                            className="w-14 h-14 rounded-full object-cover"
                                            style={{ 
                                                border: isDarkMode ? '2.5px solid rgba(255,255,255,0.15)' : '2.5px solid rgba(255,255,255,0.8)', 
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.2)' 
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                        <span className={`text-lg font-bold ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>?</span>
                                    </div>
                                )}
                            </div>

                            {/* Name & Email */}
                            <div className="space-y-0.5">
                                <h2 className={`text-[15px] font-bold leading-snug ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {user ? user.displayName : 'Welcome!'}
                                </h2>
                                {user?.email && (
                                    <p className={`text-[12px] font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {user.email}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="mx-5 h-px" style={{ background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />

                        {/* Menu Items */}
                        <div className="flex-1 overflow-y-auto py-3 px-3">
                            {/* Mobile Only Browsing Links */}
                            <div className="lg:hidden pb-2 mb-2">
                                {[
                                    { to: '/#recommended-section', label: 'For You', icon: Heart, active: location.pathname === '/' },
                                    { to: '/movies', label: 'Movies', icon: Play, active: location.pathname.startsWith('/movies') && location.pathname !== '/' },
                                    { to: '/events', label: 'Events', icon: Calendar, active: location.pathname.startsWith('/events') },
                                ].map((nav) => (
                                    <Link
                                        key={nav.to}
                                        to={nav.to}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                                            nav.active 
                                                ? (isDarkMode ? 'bg-primary/10' : 'bg-primary/5') 
                                                : (isDarkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]')
                                        }`}
                                    >
                                        <nav.icon className={`w-[18px] h-[18px] ${
                                            nav.active ? 'text-primary' : (isDarkMode ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600')
                                        } transition-colors`} />
                                        <span className={`text-[14px] font-medium ${
                                            nav.active ? 'text-primary' : (isDarkMode ? 'text-gray-300' : 'text-gray-700')
                                        }`}>{nav.label}</span>
                                    </Link>
                                ))}
                                <div className="mt-2 mx-3 h-px" style={{ background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }} />
                            </div>

                            {sidebarItems.map((item, idx) => (
                                <Link
                                    key={idx}
                                    to={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group ${
                                        isDarkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'
                                    }`}
                                >
                                    <item.icon className={`w-[18px] h-[18px] transition-colors ${
                                        isDarkMode ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'
                                    }`} />
                                    <span className={`text-[14px] font-medium transition-colors ${
                                        isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'
                                    }`}>{item.title}</span>
                                </Link>
                            ))}
                        </div>

                        {/* Log out */}
                        {user && (
                            <div className="px-5 pb-6 pt-2">
                                <button
                                    onClick={() => {
                                        logoutUser();
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`w-full py-3 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                                        isDarkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                                    }`}
                                    style={{
                                        color: '#ef4444',
                                        border: isDarkMode ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1.5px solid rgba(239, 68, 68, 0.25)',
                                        background: isDarkMode ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.03)',
                                    }}
                                >
                                    <LogOut className="w-4 h-4" />
                                    Log out
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
