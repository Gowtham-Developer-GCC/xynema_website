import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft, Ticket } from 'lucide-react';
import SEO from '../components/SEO';
import { designSystem } from '../config/design-system';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import * as api from '../services/api';

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user: authUser, logoutUser, updateUser } = useAuth();
    const { userMovieBookings, userEventBookings, userProfile, updateUserProfileData } = useData();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: ''
    });

    // Validation Functions
    const validateName = (value) => {
        if (!value || value.trim() === '') {
            return "Name is required";
        }
        if (value.trim().length < 2) {
            return "Name must be at least 2 characters";
        }
        if (value.trim().length > 50) {
            return "Name must not exceed 50 characters";
        }
        if (!/^[a-zA-Z\s]+$/.test(value)) {
            return "Name can only contain letters and spaces";
        }
        return null;
    };

    const validatePhone = (value) => {
        if (!value || value.trim() === '') {
            return null; // Optional field
        }
        const cleanPhone = value.replace(/[^\d]/g, '');
        if (cleanPhone.length < 10) {
            return "Phone number must be at least 10 digits";
        }
        if (cleanPhone.length > 15) {
            return "Phone number must not exceed 15 digits";
        }
        if (!/^[0-9\s\-\+\(\)]+$/.test(value)) {
            return "Phone number contains invalid characters";
        }
        return null;
    };

    const validateCity = (value) => {
        if (!value || value.trim() === '') {
            return null; // Optional field
        }
        if (value.trim().length < 2) {
            return "City must be at least 2 characters";
        }
        if (value.trim().length > 50) {
            return "City must not exceed 50 characters";
        }
        if (!/^[a-zA-Z\s\-]+$/.test(value)) {
            return "City can only contain letters, spaces, and hyphens";
        }
        return null;
    };

    const validateForm = () => {
        const errors = {};

        const nameError = validateName(formData.name);
        if (nameError) errors.name = nameError;

        const phoneError = validatePhone(formData.phone);
        if (phoneError) errors.phone = phoneError;

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };


    useEffect(() => {
        // Centralized Data Fetching
        const syncUserProfile = () => {
            if (!authUser) {
                navigate('/login');
                return;
            }

            // Prefer verified profile from DataContext, fallback to AuthUser
            const currentUser = userProfile || authUser;
            setUser(currentUser);

            setFormData({
                name: currentUser.displayName || '',
                phone: currentUser.phoneNumber || ''
            });

            // If we have a user, we can stop loading
            if (currentUser) {
                setLoading(false);
            }
        };

        syncUserProfile();
    }, [authUser, userProfile, navigate]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        // Validate form first
        if (!validateForm()) {
            setErrorMsg('Please fix the errors above');
            setTimeout(() => setErrorMsg(''), 3000);
            return;
        }

        try {
            setErrorMsg('');
            setSuccessMsg('');
            setFieldErrors({});

            // Use Centralized Update Method
            const newUser = await updateUserProfileData(formData);

            // Sync AuthContext (Navbar) - ensure token is preserved
            const userToUpdate = {
                displayName: newUser.displayName,
                email: newUser.email,
                photoUrl: newUser.photoUrl,
                phoneNumber: newUser.phoneNumber,
                token: authUser?.token // Preserve existing token
            };
            updateUser(userToUpdate);

            setEditMode(false);
            setSuccessMsg('Profile updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error('Update failed:', err);
            setErrorMsg(err.message || 'Failed to update profile');
            setTimeout(() => setErrorMsg(''), 3000);
        }
    };

    const handleLogout = async () => {
        try {
            await logoutUser();
            navigate('/');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    // Combine bookings for recent bookings display (sorted by date, most recent first)
    const allUserBookings = [...(userMovieBookings || []), ...(userEventBookings || [])]
        .sort((a, b) => new Date(b.createdAt || b.bookedAt) - new Date(a.createdAt || a.bookedAt));

    if (loading) return <LoadingState />;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <SEO title="My Profile - XYNEMA" description="Manage your XYNEMA account" />

            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate("/")}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">My Profile</h1>
                    <div className="w-5" />
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
                        {/* User Info */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-xynemaRose flex items-center justify-center flex-shrink-0">
                                {user.photoUrl && user.photoUrl.trim() ? (
                                    <img
                                        src={user.photoUrl}
                                        alt="Profile"
                                        className="w-full h-full object-cover rounded-full"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextElementSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="w-full h-full bg-xynemaRose flex items-center justify-center text-white text-xl font-bold rounded-full"
                                    style={{ display: user.photoUrl && user.photoUrl.trim() ? 'none' : 'flex' }}
                                >
                                    {user.displayName?.charAt(0)?.toUpperCase() || user.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900">{user.displayName}</h2>
                                <p className="text-gray-600 text-sm mt-1">{user.email}</p>
                            </div>
                        </div>

                        {/* Edit Button */}
                        <button
                            onClick={() => {
                                setEditMode(!editMode);
                                if (!editMode) {
                                    setFormData({
                                        name: user.displayName || '',
                                        phone: user.phoneNumber || ''
                                    });
                                }
                            }}
                            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${editMode ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' : 'bg-xynemaRose text-white hover:bg-xynemaRose/80'}`}
                        >
                            {editMode ? 'Cancel' : 'Edit Profile'}
                        </button>
                    </div>

                </div>

                {/* Edit Form - Collapsible */}
                {editMode && (
                    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-6 animate-in fade-in slide-in-from-bottom-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Edit Personal Details</h3>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            {/* Name Field */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, name: e.target.value });
                                        const error = validateName(e.target.value);
                                        setFieldErrors({ ...fieldErrors, name: error });
                                    }}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-xynemaRose transition-all ${fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="Enter your full name"
                                />
                                {fieldErrors.name && <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>}
                            </div>

                            {/* Phone Field */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Phone Number</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        setFormData({ ...formData, phone: e.target.value });
                                        const error = validatePhone(e.target.value);
                                        setFieldErrors({ ...fieldErrors, phone: error });
                                    }}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-xynemaRose transition-all ${fieldErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="Enter phone number (optional)"
                                />
                                {fieldErrors.phone && <p className="text-red-600 text-xs mt-1">{fieldErrors.phone}</p>}
                            </div>

                            {/* Messages */}
                            {successMsg && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                                    ✓ {successMsg}
                                </div>
                            )}
                            {errorMsg && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    ✕ {errorMsg}
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-xynemaRose text-white rounded-lg font-semibold hover:bg-xynemaRose/80 transition-colors"
                                >
                                    Save Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditMode(false)}
                                    className="px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Recent Bookings Section */}
                {allUserBookings && allUserBookings.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Ticket className="w-5 h-5 text-xynemaRose" />
                            <h3 className="text-lg font-bold text-gray-900">Recent Bookings</h3>
                        </div>

                        <div className="space-y-3">
                            {allUserBookings.slice(0, 3).map((booking) => (
                                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{booking.movieTitle || booking.eventName}</p>
                                        <p className="text-sm text-gray-600">{booking.theaterName || booking.venue?.name} • {booking.date || booking.showDate}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{booking.seats?.length || booking.tickets?.length} ticket{(booking.seats?.length || booking.tickets?.length) !== 1 ? 's' : ''}</p>
                                        <p className="text-sm text-gray-600">₹{booking.totalAmount}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {allUserBookings.length > 3 && (
                            <button
                                className="w-full mt-4 py-2.5 text-xynemaRose font-semibold hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                View All Bookings
                            </button>
                        )}
                    </div>
                )}
                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

const LoadingState = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-xynemaRose rounded-full animate-spin" />
            <p className="text-gray-600 text-sm font-medium">Loading Profile...</p>
        </div>
    </div>
);

export default ProfilePage;