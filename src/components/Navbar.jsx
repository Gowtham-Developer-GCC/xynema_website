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
        { icon: Ticket, title: 'My tickets', path: '/bookings' },
        { icon: CreditCard, title: 'Payment methods', path: '/payment-methods' },
        { icon: Gift, title: 'Offers & Promos', path: '/offers' },
        { icon: Bell, title: 'Notifications', path: '/notifications' },
        { icon: Shield, title: 'Account & settings', path: '/account-settings' },
        { icon: HelpCircle, title: 'Help & support', path: '/help' },
    ];

    return (
        <>
            <nav className="bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl text-gray-800 dark:text-gray-100 sticky top-0 z-[60] border-b border-white/50 dark:border-gray-800 shadow-[0_4px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
                <div className="w-full max-w-[95%] md:max-w-[95%] lg:max-w-[95%] xl:max-w-[95%] 2xl:max-w-[80%] mx-auto px-4">
                    <div className="flex justify-between items-center h-16 md:h-20 lg:h-20 xl:h-20">

                        {/* Left: Logo & City */}
                        <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
                            {/* Dev Mode Bicker */}
                            <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
                                <div className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </div>
                                <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none">Dev Mode</span>
                            </div>

                            <Link to="/" className="flex items-center gap-1.5 md:gap-2 group">
                                <img
                                    src="/assets/primary_Logo.png"
                                    alt="Xynema Logo"
                                    className="h-7 md:h-8 w-auto group-hover:scale-105 transition-transform duration-300 transform-gpu"
                                />
                                <span className="text-lg md:text-2xl font-display font-bold text-gray-900 dark:text-white uppercase leading-none group-hover:opacity-90 transition-opacity">Xynema</span>
                            </Link>

                            <button
                                onClick={openCityModal}
                                className="hidden md:flex items-center gap-1 md:gap-1.5 px-2 py-1.5 md:px-4 md:py-2 bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-xl transition-colors group text-[10px] md:text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm ml-1 md:ml-6 border border-white/60 dark:border-gray-700"
                            >
                                <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                                <span className="text-gray-800 dark:text-gray-200 group-hover:text-primary truncate max-w-[60px] md:max-w-none">{selectedCity || 'City'}</span>
                                <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-gray-400 group-hover:text-primary mb-[1px] md:mb-0.5" />
                            </button>
                        </div>

                        {/* Center: Nav Links - Visible from lg breakpoint now that search is an icon */}
                        <div className="hidden lg:flex items-center justify-center gap-6 xl:gap-10 text-[14px] xl:text-[15px] font-bold text-gray-800 dark:text-gray-100 absolute left-1/2 -translate-x-1/2">
                            <Link to="/" className={`relative py-1 transition-colors ${location.pathname === '/' ? 'text-primary after:content-[\'\'] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-primary' : 'hover:text-primary'}`}>For You</Link>
                            <Link to="/movies" className={`relative py-1 transition-colors ${location.pathname.startsWith('/movies') && location.pathname !== '/' ? 'text-primary after:content-[\'\'] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-primary' : 'hover:text-primary'}`}>Movies</Link>
                            <Link to="/events" className={`relative py-1 transition-colors ${location.pathname.startsWith('/events') ? 'text-primary after:content-[\'\'] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-primary' : 'hover:text-primary'}`}>Events</Link>
                        </div>

                        {/* Right: Search & Actions */}
                        <div className="flex items-center justify-end gap-1 md:gap-4 flex-1">
                            {/* Search Icon - Always visible, expands on click */}
                            <button
                                onClick={() => setIsMobileSearchOpen(true)}
                                className="p-1.5 md:p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
                                aria-label="Search"
                            >
                                <Search className="h-4.5 w-4.5 md:h-5 md:w-5 text-gray-600 dark:text-gray-400" />
                            </button>

                            {/* Actions Group */}
                            <div className="flex items-center gap-1 md:gap-2">
                                {/* Desktop Theme Toggle */}
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden xl:flex items-center justify-center text-gray-600 dark:text-gray-300"
                                    aria-label="Toggle dark mode"
                                >
                                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                </button>

                                {user ? (
                                    <button
                                        onClick={() => setIsSidebarOpen(true)}
                                        className="hidden xl:flex items-center gap-2 pl-1.5 pr-4 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                    >
                                        <img
                                            src={user.photoUrl || user.picture || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`}
                                            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 object-cover shadow-sm"
                                            alt=""
                                        />
                                        {/*<span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden 2xl:block">{user.displayName?.split(' ')[0] || 'Guest'}</span>*/}
                                    </button>
                                ) : (
                                    <button
                                        onClick={openLogin}
                                        className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-90 active:scale-95 shadow-sm hidden xl:block"
                                    >
                                        Sign Up
                                    </button>
                                )}
                            </div>

                            {/* Mobile/Tablet Controls - Visible only below xl */}
                            <div className="flex items-center gap-1 xl:hidden">
                                <button
                                    onClick={toggleTheme}
                                    className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all text-gray-600 dark:text-gray-300"
                                >
                                    {isDarkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                                </button>
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all text-gray-600 dark:text-gray-300"
                                >
                                    <Menu className="h-4.5 w-4.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Mobile/Desktop Search Overlay */}
                {isMobileSearchOpen && (
                    <div className="absolute inset-x-0 lg:left-auto lg:right-8 lg:top-3 lg:h-14 lg:w-[450px] bg-white dark:bg-gray-900 z-[65] border-b lg:border lg:border-white/20 lg:dark:border-gray-700 flex items-center px-4 gap-3 animate-in fade-in slide-in-from-top-2 lg:rounded-2xl lg:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all">
                        <div className="flex-1 flex items-center gap-3">
                            <UniversalSearch
                                variant="navbar"
                                className="flex-1"
                                onSelect={() => setIsMobileSearchOpen(false)}
                            />
                            <button
                                onClick={() => setIsMobileSearchOpen(false)}
                                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
                                <h2 className={`text-[15px] font-medium leading-snug ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {user ? user.displayName : 'Welcome!'}
                                </h2>
                                {user?.email && (
                                    <p className={`text-[12px] font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {user.email}
                                    </p>
                                )}
                            </div>

                            {/* Mobile Location Selector inside Sidebar */}
                            <div className="md:hidden mt-6">
                                <button
                                    onClick={() => {
                                        setIsSidebarOpen(false);
                                        openCityModal();
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all active:scale-[0.98] ${isDarkMode
                                            ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                            : 'bg-black/5 border-black/5 hover:bg-black/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-primary/20' : 'bg-primary/10'}`}>
                                            <MapPin className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <p className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Location</p>
                                            <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{selectedCity || 'Select City'}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="mx-5 h-px" style={{ background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />

                        {/* Menu Items */}
                        <div className="flex-1 overflow-y-auto py-3 px-3">
                            {/* Mobile Only Browsing Links */}
                            <div className="2xl:hidden pb-2 mb-2">
                                {[
                                    { to: '/#recommended-section', label: 'For You', icon: Heart, active: location.pathname === '/' },
                                    { to: '/movies', label: 'Movies', icon: Play, active: location.pathname.startsWith('/movies') && location.pathname !== '/' },
                                    { to: '/events', label: 'Events', icon: Calendar, active: location.pathname.startsWith('/events') },
                                ].map((nav) => (
                                    <Link
                                        key={nav.to}
                                        to={nav.to}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${nav.active
                                                ? (isDarkMode ? 'bg-primary/10' : 'bg-primary/5')
                                                : (isDarkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]')
                                            }`}
                                    >
                                        <nav.icon className={`w-[18px] h-[18px] ${nav.active ? 'text-primary' : (isDarkMode ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600')
                                            } transition-colors`} />
                                        <span className={`text-[14px] font-medium ${nav.active ? 'text-primary' : (isDarkMode ? 'text-gray-300' : 'text-gray-700')
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
                                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group ${isDarkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'
                                        }`}
                                >
                                    <item.icon className={`w-[18px] h-[18px] transition-colors ${isDarkMode ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'
                                        }`} />
                                    <span className={`text-[14px] font-medium transition-colors ${isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'
                                        }`}>{item.title}</span>
                                </Link>
                            ))}
                        </div>

                        {/* Log out */}
                        {user && (

                            <div className="px-5 pb-6 md:pb-8 pt-2">
                            <button
                                onClick={() => {
                                    logoutUser();
                                    setIsSidebarOpen(false);
                                }}
                                className={`w-full py-3 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${isDarkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
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
                </div >
            )
            }

{/* Mobile Bottom Navigation - Hidden on focused detail/booking pages */ }
{
    !/\/movie\/[^/]+($|\/theaters|\/seats|\/food|\/summary|\/payment)/.test(location.pathname) &&
    !location.pathname.startsWith('/event/') && (
        <div className="fixed bottom-0 left-0 right-0 z-[55] lg:hidden bg-white/70 dark:bg-gray-950/80 backdrop-blur-2xl border-t border-white/20 dark:border-gray-800/60 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-all duration-300 pb-safe">
            <div className="flex items-center justify-around h-16 md:h-18 px-4 max-w-md mx-auto">
                <Link
                    to="/"
                    className={`flex flex-col items-center gap-1.5 transition-all duration-300 flex-1 py-2 ${location.pathname === '/'
                            ? 'text-primary scale-110'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <div className={`p-1 rounded-lg transition-colors ${location.pathname === '/' ? 'bg-primary/10' : ''}`}>
                        <Heart className={`w-5 h-5 ${location.pathname === '/' ? 'fill-current' : ''}`} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">For You</span>
                </Link>

                <Link
                    to="/movies"
                    className={`flex flex-col items-center gap-1.5 transition-all duration-300 flex-1 py-2 ${location.pathname.startsWith('/movies') && location.pathname !== '/'
                            ? 'text-primary scale-110'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <div className={`p-1 rounded-lg transition-colors ${location.pathname.startsWith('/movies') && location.pathname !== '/' ? 'bg-primary/10' : ''}`}>
                        <Play className={`w-5 h-5 ${location.pathname.startsWith('/movies') && location.pathname !== '/' ? 'fill-current' : ''}`} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Movies</span>
                </Link>

                <Link
                    to="/events"
                    className={`flex flex-col items-center gap-1.5 transition-all duration-300 flex-1 py-2 ${location.pathname.startsWith('/events')
                            ? 'text-primary scale-110'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <div className={`p-1 rounded-lg transition-colors ${location.pathname.startsWith('/events') ? 'bg-primary/10' : ''}`}>
                        <Calendar className={`w-5 h-5 ${location.pathname.startsWith('/events') ? 'fill-current' : ''}`} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Events</span>
                </Link>
            </div>
        </div>
    )
}
        </>
    );
};

export default Navbar;
