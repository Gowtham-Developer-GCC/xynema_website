import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff, Shield, Globe, Bell, Moon, Trash2, Camera, Check, Monitor, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { registerNotificationToken, removeNotificationToken } from '../services/notificationService';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { toast } from 'react-hot-toast';

const AccountSettingsPage = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const fileInputRef = useRef(null);

    const [activeTab, setActiveTab] = useState('profile');
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Form states with mock defaults
    const [formData, setFormData] = useState({
        name: user?.displayName || '',
        email: user?.email || '',
        phone: user?.phoneNumber || '',
        language: language,
        region: user?.region || 'India',
        pushNotifications: !!localStorage.getItem('fcmToken'),
        photoUrl: user?.photoUrl || ''
    });
    const [errors, setErrors] = useState({});

    const [isLoading, setIsLoading] = useState(true);

    // Fetch full profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profile = await getUserProfile();
                if (profile) {
                    setFormData(prev => ({
                        ...prev,
                        name: profile.displayName || '',
                        email: profile.email || '',
                        phone: profile.phoneNumber || '',
                        region: profile.region || 'India',
                        photoUrl: profile.photoUrl || ''
                    }));
                    // Update global user context if needed
                    updateUser(profile);
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
                // Fallback to minimal data from auth context
                if (user) {
                    setFormData(prev => ({
                        ...prev,
                        name: user.displayName || '',
                        email: user.email || '',
                        phone: user.phoneNumber || '',
                        region: user.region || 'India',
                        photoUrl: user.photoUrl || ''
                    }));
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const [tempLanguage, setTempLanguage] = useState(language);

    const categories = [
        { id: 'profile', label: t('profile_info'), icon: User },
        { id: 'security', label: t('security'), icon: Lock },
        { id: 'preferences', label: t('preferences'), icon: Globe },
        { id: 'privacy', label: t('privacy'), icon: Shield },
    ];

    const handleSendTestNotification = () => {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Test Notification", {
                body: "This is a test notification from XYNEMA.",
                icon: "/logo.png"
            });
            toast.success("Test notification sent!");
        } else {
            toast.error("Please enable notifications to test.");
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name?.trim()) {
            newErrors.name = 'Name is required';
        }
        if (!formData.email?.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        const phoneDigits = (formData.phone || '').replace(/[^\d]/g, '');
        if (phoneDigits && phoneDigits.length !== 10) {
            newErrors.phone = 'Please enter a 10-digit phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size exceeds 5MB limit.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photoUrl: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!validateForm()) {
            toast.error('Please check the fields for errors.');
            return;
        }
        setIsSaving(true);
        try {
            // 1. Update language preference
            setLanguage(tempLanguage);
            
            // 2. Call Update Profile API
            const updatedProfile = await updateUserProfile({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                region: formData.region,
                picture: formData.photoUrl
            });

            if (updatedProfile) {
                updateUser(updatedProfile);
                setSaveSuccess(true);
                toast.success(t('profile_updated'));
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Save failed:', err);
            toast.error(err.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const [isTogglingPush, setIsTogglingPush] = useState(false);

    const handleTogglePush = async () => {
        if (isTogglingPush) return;
        
        const newState = !formData.pushNotifications;
        console.log('[AccountSettings] Attempting to toggle push notifications to:', newState);
        
        setIsTogglingPush(true);
        try {
            if (newState) {
                // Enabling
                const token = await registerNotificationToken();
                if (token) {
                    // Token is fetched! Update UI immediately for responsiveness
                    setFormData(prev => ({ ...prev, pushNotifications: true }));
                    toast.success('Push Notifications Enabled!');
                    console.log('[AccountSettings] UI updated, backend registration should be complete.');
                }
            } else {
                // Disabling
                await removeNotificationToken();
                setFormData(prev => ({ ...prev, pushNotifications: false }));
                toast.success('Push Notifications Disabled.');
            }
        } catch (err) {
            console.error('[AccountSettings] Catch block:', err);
            // Show more descriptive error messages to the user
            if (err.message?.includes('permission')) {
                toast.error('Notification permission denied. Please reset in browser settings.');
            } else if (err.message?.includes('Service Worker')) {
                toast.error('Service worker failed to activate. Please refresh.');
            } else {
                toast.error(`Error: ${err.message || 'Action failed'}`);
            }
        } finally {
            setIsTogglingPush(false);
        }
    };


    if (isLoading && !user) {
        return (
            <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f1115] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f1115] transition-colors duration-300">
            <SEO 
                title="Account Settings - XYNEMA" 
                description="Manage your profile settings, security preferences, and personal information."
            />

            {/* Header */}
            <div className="bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 sticky top-[64px] md:top-[80px] z-[50]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
                            {t('account_settings').split(' & ')[0]} <span className="text-primary">& {t('account_settings').split(' & ')[1]}</span>
                        </h1>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    
                    {/* Left Sidebar - Categories */}
                    <div className="lg:w-72 shrink-0">
                        <div className="bg-white dark:bg-gray-800/50 rounded-[32px] border border-gray-100 dark:border-white/5 p-4 shadow-sm backdrop-blur-md">
                            <div className="space-y-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveTab(cat.id)}
                                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
                                            activeTab === cat.id 
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                            : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-slate-800 dark:hover:text-white'
                                        }`}
                                    >
                                        <cat.icon className="w-4 h-4" />
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Theme Quick Toggle Card */}
                        <div className="mt-6 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[32px] p-6 text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden group">
                            <div className="relative z-10 flex flex-col h-full">
                                <h4 className="text-xs font-black uppercase tracking-widest mb-4 opacity-80">{t('quick_settings')}</h4>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('dark_mode')}</span>
                                    <button 
                                        onClick={toggleTheme}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out bg-white/20`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                            <Moon className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 group-hover:rotate-12 transition-transform duration-700" />
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 max-w-2xl">
                        <div className="bg-white dark:bg-gray-800/50 rounded-[40px] border border-gray-100 dark:border-white/5 p-8 md:p-12 shadow-sm backdrop-blur-md">
                            
                            {activeTab === 'profile' && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <SectionHeader 
                                        title={t('personal_info')} 
                                        subtitle={t('update_profile')} 
                                    />

                                    <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
                                        <input 
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleAvatarChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <div 
                                            className="relative group cursor-pointer" 
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] overflow-hidden bg-primary/10 border-4 border-white dark:border-gray-800 shadow-xl group-hover:scale-105 transition-all duration-500 relative">
                                                <img 
                                                    src={formData.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name || 'Gowtham'}&backgroundColor=b6e3f4`} 
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=random`;
                                                    }}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover" 
                                                />
                                                {/* Hover Overlay overlay */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                                                    <Camera className="w-6 h-6 md:w-8 md:h-8 text-white" />
                                                </div>
                                            </div>
                                            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white dark:border-gray-900 pointer-events-none">
                                                <Camera className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="text-center sm:text-left">
                                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{formData.name}</h3>
                                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Profile Photo (Max 5MB)</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField 
                                            label={t('full_name')} 
                                            icon={User} 
                                            value={formData.name} 
                                            onChange={(val) => {
                                                setFormData({...formData, name: val});
                                                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                                            }}
                                            placeholder="GOWTHAM MAYA LABS" 
                                            error={errors.name}
                                        />
                                        <InputField 
                                            label={t('email_address')} 
                                            icon={Mail} 
                                            value={formData.email} 
                                            disabled={true}
                                            onChange={(val) => {
                                                setFormData({...formData, email: val});
                                                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                                            }}
                                            placeholder="name@example.com" 
                                            error={errors.email}
                                        />
                                        <InputField 
                                            label={t('phone_number')} 
                                            icon={Phone} 
                                            value={formData.phone} 
                                            onChange={(val) => {
                                                // Allow only digits and limit to 10
                                                const cleaned = val.replace(/[^\d]/g, '').slice(0, 10);
                                                setFormData({...formData, phone: cleaned});
                                                if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                                            }}
                                            placeholder="10 digit number" 
                                            maxLength={10}
                                            error={errors.phone}
                                        />
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Region</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                                                    <Globe className="w-4 h-4" />
                                                </div>
                                                <select 
                                                    value={formData.region}
                                                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                                                    disabled={true}
                                                    className="w-full bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-white/5 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold tracking-widest text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 appearance-none disabled:opacity-50 disabled:cursor-not-allowed cursor-default"
                                                >
                                                    <option value="India">India</option>
                                                    <option value="United States">United States</option>
                                                    <option value="United Kingdom">United Kingdom</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <SectionHeader 
                                        title={t('account_security')} 
                                        subtitle={t('manage_password')} 
                                    />

                                    <div className="space-y-6">
                                        <InputField 
                                            label={t('current_password')} 
                                            icon={Lock} 
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••••••" 
                                        />
                                        <InputField 
                                            label={t('new_password')} 
                                            icon={Lock} 
                                            type={showPassword ? "text" : "password"}
                                            placeholder="MIN 8 CHARACTERS" 
                                        />
                                        <button 
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 hover:opacity-80 transition-opacity"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            {showPassword ? t('hide_passwords') : t('show_passwords')}
                                        </button>
                                    </div>

                                    <div className="h-px bg-gray-100 dark:bg-white/5" />

                                    <div className="flex items-center justify-between p-6 rounded-3xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                                <Shield className="w-5 h-5 text-orange-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider">{t('two_factor')}</h4>
                                                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">{t('enhance_safety')}</p>
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-gray-800 text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors">
                                            {t('configure')}
                                        </button>
                                    </div>

                                    <div className="h-px bg-gray-100 dark:bg-white/5" />

                                    <div className="space-y-6">
                                        {/* <div className="flex flex-col pl-1">
                                            <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-1">Logined Devices</h4>
                                            <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">Active notification sessions & sign-ins</p>
                                        </div> */}
                                        
                                        {/* <div className="space-y-4">
                                            {user?.fcmTokens && user.fcmTokens.length > 0 ? (
                                                user.fcmTokens.map((device, idx) => {
                                                    const isWeb = device.platform === 'web';
                                                    const isCurrent = device.token === localStorage.getItem('fcmToken');
                                                    const DeviceIcon = isWeb ? Monitor : Smartphone;
                                                    
                                                    return (
                                                        <div key={device._id || idx} className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 group hover:bg-gray-100/50 dark:hover:bg-white/[0.04] transition-all duration-300">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCurrent ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                                                                    <DeviceIcon className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <h5 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest">
                                                                            {isWeb ? 'Web Browser' : (device.platform || 'Unknown Device')}
                                                                        </h5>
                                                                        {isCurrent && (
                                                                            <span className="bg-emerald-500/10 text-emerald-500 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md leading-none flex items-center">
                                                                                Current
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1 leading-none">
                                                                        Registered: {new Date(device.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {!isCurrent && (
                                                                <button 
                                                                    type="button"
                                                                    className="w-8 h-8 rounded-lg bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-95 hover:scale-100 cursor-pointer shadow-sm"
                                                                    title="Remove session"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-8 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-2">
                                                        <Monitor className="w-5 h-5" />
                                                    </div>
                                                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">No active session platforms found</p>
                                                </div>
                                            )}
                                        </div> */}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'privacy' && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <SectionHeader 
                                        title={t('privacy_data')} 
                                        subtitle={t('manage_data')} 
                                    />

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between group">
                                            <div>
                                                <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider">{t('public_profile')}</h4>
                                                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">{t('allow_reviews')}</p>
                                            </div>
                                            <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full bg-primary border-2 border-transparent">
                                                <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white transition duration-200" />
                                            </div>
                                        </div>

                                        <div className="h-px bg-gray-100 dark:bg-white/5" />

                                        <div className="flex items-center justify-between group">
                                            <div>
                                                <h4 className="text-[11px] font-black text-red-500 uppercase tracking-wider">{t('delete_account')}</h4>
                                                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">{t('remove_data')}</p>
                                            </div>
                                            <button className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'preferences' && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <SectionHeader 
                                        title={t('general_preferences')} 
                                        subtitle={t('customize_experience')} 
                                    />

                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">{t('interface_language')}</label>
                                            <select 
                                                value={tempLanguage}
                                                onChange={(e) => setTempLanguage(e.target.value)}
                                                className="w-full bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-white/5 rounded-2xl px-5 py-4 text-sm font-bold tracking-widest text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-no-repeat bg-[right_1.25rem_center] bg-[length:1em_1em] cursor-pointer"
                                            >
                                                <option value="English (US)">English (US)</option>
                                                <option value="Malayalam">Malayalam</option>
                                                <option value="Hindi">Hindi (Soon)</option>
                                                <option value="Spanish">Spanish (Soon)</option>
                                            </select>
                                        </div>

                                        <div className="h-px bg-gray-100 dark:bg-white/5" />

                                        <div className="flex items-center justify-between p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                                    <Bell className="w-5 h-5 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{t('newsletter_subscription')}</h4>
                                                    <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">{t('get_weekly_recommendations')}</p>
                                                </div>
                                            </div>
                                            <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full bg-indigo-500 border-2 border-transparent">
                                                <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white transition duration-200" />
                                            </div>
                                        </div>

                                        <div className="h-px bg-gray-100 dark:bg-white/5" />

                                        <div className="flex items-center justify-between p-6 rounded-3xl bg-xynemaRose/5 border border-xynemaRose/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-xynemaRose/10 flex items-center justify-center">
                                                    <Bell className="w-5 h-5 text-xynemaRose" />
                                                </div>
                                                <div>
                                                    <h4 className="text-[11px] font-black text-xynemaRose uppercase tracking-wider">{t('push_notifications')}</h4>
                                                    <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">{t('push_notifications_desc')}</p>
                                                </div>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={handleTogglePush}
                                                disabled={isTogglingPush}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out ${formData.pushNotifications ? 'bg-xynemaRose' : 'bg-gray-200 dark:bg-gray-700'} ${isTogglingPush ? 'opacity-50 grayscale cursor-wait' : ''}`}
                                            >
                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out flex items-center justify-center ${formData.pushNotifications ? 'translate-x-5' : 'translate-x-0'}`}>
                                                    {isTogglingPush && <div className="w-2 h-2 border-2 border-xynemaRose/20 border-t-xynemaRose rounded-full animate-spin" />}
                                                </span>
                                            </button>
                                        </div>

                                        {formData.pushNotifications && (
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    console.log('[Test] Triggering test notification...');
                                                    try {
                                                        if (Notification.permission !== 'granted') {
                                                            toast.error(`Permission is ${Notification.permission}. Please allow it!`);
                                                            return;
                                                        }
                                                        const n = new Notification("Test Notification", {
                                                            body: "Your notifications are working perfectly! 🚀",
                                                            icon: "/logo.png",
                                                            requireInteraction: true // Keep on screen until clicked
                                                        });
                                                        console.log('[Test] Notification object created:', n);
                                                        toast.success('Test notification sent!');
                                                    } catch (err) {
                                                        console.error('[Test] Notification failed:', err);
                                                        toast.error('Browser blocked the notification.');
                                                    }
                                                }}
                                                className="w-full py-3 bg-gray-50 dark:bg-white/[0.03] text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] rounded-xl border border-dashed border-gray-200 dark:border-white/10 hover:border-primary/50 hover:text-primary transition-all"
                                            >
                                                Send Test Notification
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Footer Buttons */}
                            <div className="mt-16 flex flex-col sm:flex-row gap-4">
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 py-5 bg-primary text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    {isSaving ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        t('save_changes')
                                    )}
                                </button>
                                <button 
                                    onClick={() => navigate(-1)}
                                    className="px-10 py-5 bg-gray-50 dark:bg-white/[0.03] text-gray-400 dark:text-gray-500 text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl border border-gray-100 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
                                >
                                    {t('cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Toast */}
            <div className={`fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
                saveSuccess ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
            }`}>
                <div className="bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl shadow-emerald-500/20 flex items-center gap-4">
                    <Check className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-[0.2em]">{t('profile_updated')}</span>
                </div>
            </div>
        </div>
    );
};

const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-8 pl-1">
        <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase leading-none mb-2">
            {title}
        </h2>
        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
            {subtitle}
        </p>
    </div>
);

const InputField = ({ label, icon: Icon, type = "text", value = '', onChange = () => {}, placeholder, disabled = false, error, ...props }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                <Icon className="w-4 h-4" />
            </div>
            <input 
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={`w-full bg-white dark:bg-gray-800/50 border ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500/30' : 'border-gray-100 dark:border-white/5 focus:ring-primary/20 focus:border-primary/30'} rounded-2xl pl-12 pr-5 py-4 text-sm font-bold tracking-widest text-slate-800 dark:text-white outline-none focus:ring-2 transition-all disabled:opacity-50`}
                placeholder={placeholder}
                {...props}
            />
        </div>
        {error && (
            <p className="text-[10px] font-bold text-red-500 tracking-wider ml-2 animate-in fade-in slide-in-from-top-1">
                {error}
            </p>
        )}
    </div>
);

export default AccountSettingsPage;
