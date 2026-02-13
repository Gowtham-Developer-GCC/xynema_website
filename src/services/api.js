import axios from 'axios';
import { emitUnauthorized } from './authEvents';
import {
    Movie,
    Theater,
    Show,
    Seat,
    FoodItem,
    Booking,
    User,
    ShowLayoutResponse,
    Event,
    EventBooking,
} from '../models/index.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Axios instance with base configuration
 * Handles all HTTP requests with automatic auth token injection
 */
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
    timeout: 15000, // Matching Flutter's 15s timeout
});

/**
 * Global API Utility: safeApiCall
 * Matches Flutter's ApiUtils.safeApiCall logic
 */
export const safeApiCall = async (apiCall, retries = 3) => {
    // console.log('API Call:', apiCall);
    try {
        const response = await apiCall();
        return response;
    } catch (error) {
        // Handle Timeout, Network Errors (Socket Exception equivalent)
        const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.message === 'Network Error';

        if (isNetworkError && retries > 0) {
            console.warn(`[API] Network issue detected. Retrying... (${retries} attempts left)`);
            // Exponential backoff or simple delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            return safeApiCall(apiCall, retries - 1);
        }

        console.error('[API Error]', error);
        throw error;
    }
};

// ============= Local Storage Helpers =============
/**
 * Retrieve stored user from localStorage
 */
export const getStoredUser = () => {
    try {
        const userStr = localStorage.getItem('auth_user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error('Error parsing stored user:', e);
        return null;
    }
};

/**
 * Store user in localStorage
 */
export const storeUser = (user) => {
    try {
        localStorage.setItem('auth_user', JSON.stringify(user));
    } catch (e) {
        console.error('Error storing user:', e);
    }
};

/**
 * Remove user from localStorage
 */
export const removeUser = () => {
    try {
        localStorage.removeItem('auth_user');
    } catch (e) {
        console.error('Error removing user:', e);
    }
};

// ============= Interceptors =============
/**
 * Request interceptor - Add authorization header
 */
api.interceptors.request.use(
    (config) => {
        const user = getStoredUser();
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response interceptor - Handle errors and unauthorized access
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLogoutRequest = error.config?.url?.includes('/user/logout');

        if (error.response?.status === 401 && !isLogoutRequest) {
            removeUser();
            emitUnauthorized();
        }
        return Promise.reject(error);
    }
);

// ============= Cities & Movies API =============
/**
 * Get list of all cities with available movies
 */
export const getCities = async () => {
    return safeApiCall(async () => {
        const response = await api.get('/movies/cities');
        if (response.data.success) {
            return response.data.data || [];
        }
        return [];
    });
};

/**
 * Get latest movies (Upcoming/Latest)
 */
export const getNotNowMovies = async () => {
    return safeApiCall(async () => {
        const response = await api.get('/movies/latest-movies');
        if (response.data.success) {
            const resultData = response.data.data;
            if (Array.isArray(resultData)) {
                return resultData.map(m => new Movie(m));
            }
        }
        return [];
    });
};

/**
 * Add a review for a movie
 */
export const addMovieReview = async (bookingId, reviewData) => {
    return safeApiCall(async () => {
        const response = await api.post(`/movies/add-review/${bookingId}`, reviewData);
        return response.data;
    });
};

/**
 * Toggle interest for an upcoming movie
 */
export const toggleInterest = async (movieId, interested) => {
    return safeApiCall(async () => {
        const response = await api.post(`/movies/interest/${movieId}`, { interested });
        return response.data;
    });
};

/**
 * Get upcoming movies by city with theater information
 * Returns movies and unique theaters
 */
export const getUpcomingMovies = async (city) => {
    return safeApiCall(async () => {
        const response = await api.get(`/movies/upcomingmovies?city=${city}`);
        if (response.data.success) {
            const resultData = response.data.data;
            const movies = [];
            const uniqueTheatersMap = new Map();

            if (Array.isArray(resultData)) {
                resultData.forEach(movieJson => {
                    movies.push(new Movie(movieJson));
                    if (movieJson.availability?.theatres) {
                        movieJson.availability.theatres.forEach(theatreJson => {
                            const theatre = new Theater(theatreJson);
                            if (!uniqueTheatersMap.has(theatre.id)) {
                                uniqueTheatersMap.set(theatre.id, theatre);
                            }
                        });
                    }
                });
            } else if (resultData && typeof resultData === 'object') {
                if (resultData.movies) {
                    resultData.movies.forEach(m => movies.push(new Movie(m)));
                }
                const theaterList = resultData.theatres || resultData.theaters;
                if (theaterList) {
                    theaterList.forEach(t => {
                        const theatre = new Theater(t);
                        if (!uniqueTheatersMap.has(theatre.id)) {
                            uniqueTheatersMap.set(theatre.id, theatre);
                        }
                    });
                }
            }
            return {
                movies: movies,
                theaters: Array.from(uniqueTheatersMap.values()),
                pagination: response.data.pagination || {}
            };
        }
        return { movies: [], theaters: [], pagination: {} };
    });
};


/**
 * Grouped movie services for cleaner imports
 */
export const movieService = {
    getCities,
    getNotNowMovies,
    addMovieReview,
    toggleInterest,
    getUpcomingMovies,
};

/**
 * Get theaters available for a specific movie on a given date and city
 */
export const getTheatersForMovie = async (movieId, city, date) => {
    return safeApiCall(async () => {
        const response = await api.get(`/movies/${movieId}/theatres`, {
            params: { city, date },
        });
        if (response.data.success) {
            const data = response.data.data;
            if (Array.isArray(data)) {
                return data.map(t => new Theater(t));
            } else if (data?.theatres || data?.theaters) {
                return (data.theatres || data.theaters).map(t => new Theater(t));
            }
        }
        return [];
    });
};

/**
 * Alias for getTheatersForMovie used by pages
 */
export const getTheatersByMovie = async (movieId) => {
    // Default to stored city and today's date if not provided
    const city = localStorage.getItem('selected_city');
    if (!city) return { success: false, message: 'No city selected' };
    const date = new Date().toISOString().split('T')[0];
    const data = await getTheatersForMovie(movieId, city, date);
    return {
        success: true,
        data: data
    };
};

/**
 * Get shows for a specific movie in a specific theater
 * @deprecated - Use embedded data in theater objects instead
 */
export const getShows = async (movieId, theaterId) => {
    return { success: true, data: [] };
};

// ============= Booking & Seats API =============
/**
 * Get available seats for a show
 */
export const getShowSeats = async (showId) => {
    return safeApiCall(async () => {
        const response = await api.get(`/booking/shows/${showId}/available-seats`);
        const data = response.data.data || response.data;
        return new ShowLayoutResponse(data);
    });
};

/**
 * Alias for getShowSeats used by pages
 */
export const getSeats = async (showId) => {
    const response = await getShowSeats(showId);
    return {
        success: true,
        data: response
    };
};

/**
 * Lock seats for a show (reserve temporarily)
 */
export const lockSeats = async (showId, seatIds) => {
    // console.log(`[API] lockSeats: showId=${showId}, seats=${seatIds.join(',')}`);
    return safeApiCall(async () => {
        const response = await api.post(`/booking/shows/${showId}/lock-seats`, { seatIds });
        if (response.data.success) {
            const sessionId = response.data.data?.sessionId || null;
            // console.log(`[API] lockSeats success: sessionId=${sessionId}`);
            return sessionId;
        }
        console.warn(`[API] lockSeats failed:`, response.data);
        throw new Error(response.data.message || 'Failed to lock seats');
    });
};

/**
 * Release locked seats
 */
export const releaseSeats = async (showId, seatIds) => {
    return safeApiCall(async () => {
        try {
            const response = await api.post(`/booking/shows/${showId}/release-seats`, { seatIds });
            // console.log(`[API] releaseSeats success:`, response.data);
            return response.data.success || false;
        } catch (error) {
            console.error(`[API] releaseSeats failed:`, error);
            return false;
        }
    });
};


/**
 * Confirm a booking after payment
 */
export const confirmBooking = async (showId, bookingData) => {
    try {
        const response = await api.post(`/booking/shows/${showId}/confirm-booking`, {
            ...bookingData,
            platform: 'web'
        }, {
            timeout: 60000 // 60s timeout for booking confirmation
        });

        if (response.status === 200 || response.status === 201) {
            // console.log('[API] confirmBooking success:', response.data);
            return response.data;
        }
        return null;
    } catch (error) {
        console.error('[API] confirmBooking failed:', error);
        throw error;
    }
};

// ============= Food & Store API =============
/**
 * Get available food items
 * Returns static mock data as backend endpoint is not available
 */
export const getFoodItems = async () => {
    return [
        new FoodItem({
            id: 'f1',
            name: 'Classic Salted Popcorn',
            category: 'SNACKS',
            description: 'Large tub of freshly popped buttery salted popcorn.',
            price: 240,
            image: '🍿',
            available: true
        }),
        new FoodItem({
            id: 'f2',
            name: 'Caramel Popcorn',
            category: 'SNACKS',
            description: 'Sweet and crunchy popcorn coated in premium caramel.',
            price: 280,
            image: '🍯',
            available: true
        }),
        new FoodItem({
            id: 'f3',
            name: 'Cheese Nachos',
            category: 'SNACKS',
            description: 'Crispy corn tortillas served with warm liquid cheese and jalapeños.',
            price: 260,
            image: '🌮',
            available: true
        }),
        new FoodItem({
            id: 'f4',
            name: 'Coca Cola (500ml)',
            category: 'BEVERAGES',
            description: 'Ice-cold refreshing classic cola.',
            price: 120,
            image: '🥤',
            available: true
        }),
        new FoodItem({
            id: 'f5',
            name: 'Pepsi Black (500ml)',
            category: 'BEVERAGES',
            description: 'Zero sugar Pepsi with bold taste.',
            price: 120,
            image: '🥤',
            available: true
        }),
        new FoodItem({
            id: 'f6',
            name: 'Cold Coffee',
            category: 'BEVERAGES',
            description: 'Creamy and chilled whipped coffee.',
            price: 180,
            image: '🧋',
            available: true
        }),
        new FoodItem({
            id: 'f7',
            name: 'Couple Combo',
            category: 'COMBO',
            description: '2 Large Popcorns + 2 Large Drinks + 1 Nachos.',
            price: 650,
            image: '💑',
            available: true
        }),
        new FoodItem({
            id: 'f8',
            name: 'Solo Meal',
            category: 'COMBO',
            description: '1 Regular Popcorn + 1 Regular Drink.',
            price: 320,
            image: '🍱',
            available: true
        })
    ];
};

/**
 * Get merchandise/store items
 * Returns static mock data as backend endpoint is not available
 */
export const getMerchandise = async () => {
    return [
        {
            id: 'm1',
            title: '"Galaxy Runners" Premium T-Shirt',
            imageUrl: 'https://picsum.photos/seed/merch1/300/300',
            price: '₹799',
            category: 'Apparel',
            amazonUrl: 'https://www.amazon.in/',
        },
        {
            id: 'm2',
            title: 'Interstellar Cinema Cap',
            imageUrl: 'https://picsum.photos/seed/merch2/300/300',
            price: '₹449',
            category: 'Accessories',
            amazonUrl: 'https://www.amazon.in/',
        },
        {
            id: 'm3',
            title: 'Collector Edition Movie Poster',
            imageUrl: 'https://picsum.photos/seed/merch3/300/300',
            price: '₹299',
            category: 'Collectibles',
            amazonUrl: 'https://www.amazon.in/',
        }
    ];
};

/**
 * Get events from backend with Ticketmaster fallback (Parity with EventService.dart)
 */
export const getEvents = async () => {
    return safeApiCall(async () => {
        try {
            // 1. Fetch from Custom Backend
            const response = await api.get('/events/get-events');
            if (response.data.success && response.data.data) {
                return response.data.data.map(e => new Event(e));
            }
            return [];
        } catch (error) {
            console.error('Error fetching backend events:', error);

            // 2. Fallback to Ticketmaster (Commented out as per user request)
            /*
            try {
                const TICKERMASTER_KEY = "S85omYDoKnZaxHkMC1EyGbciUTOGA05L";
                const BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";
                const tmResponse = await axios.get(`${BASE_URL}?apikey=${TICKERMASTER_KEY}&countryCode=IN&classificationName=music,sports`);

                if (tmResponse.data?._embedded?.events) {
                    return tmResponse.data._embedded.events.map(event => new Event({
                        id: event.id,
                        name: event.name,
                        date: event.dates?.start?.localDate,
                        imageUrl: event.images?.[0]?.url,
                        venue: event._embedded?.venues?.[0]?.name,
                        ticketUrl: event.url,
                        type: 'External'
                    }));
                }
            } catch (tmError) {
                console.error('Ticketmaster fallback failed:', tmError);
            }
            */

            return [];
        }
    });
};

// ============= User & Bookings API =============
/**
 * Get all bookings for the current user
 */
export const getUserBookings = async (page = 1) => {
    return safeApiCall(async () => {
        const response = await api.get(`/booking/my-bookings?page=${page}`);
        if (response.data.success) {
            const data = response.data.data;
            const bookings = data?.bookings || [];
            return {
                bookings: Array.isArray(bookings) ? bookings.map(b => Booking.fromApiJson(b)) : [],
                totalPages: data?.totalPages || 1,
                currentPage: data?.currentPage || 1,
                total: data?.total || 0
            };
        }
        return { bookings: [], totalPages: 1, currentPage: 1, total: 0 };
    });
};

/**
 * Get details of a specific booking
 */
export const getBookingDetails = async (bookingId) => {
    return safeApiCall(async () => {
        const response = await api.get(`/booking/mybookings/${bookingId}`);
        if (response.data.success) {
            const booking = response.data.data?.booking || response.data.data;
            return booking ? Booking.fromApiJson(booking) : null;
        }
        return null;
    });
};

/**
 * Get all event bookings for the current user
 */
export const getEventBookings = async () => {
    return safeApiCall(async () => {
        const response = await api.get('/event-booking/bookings');
        if (response.data.success) {
            const bookings = response.data.data || [];
            return Array.isArray(bookings)
                ? bookings.map(b => EventBooking.fromJson(b))
                : [];
        }
        return [];
    });
};

/**
 * Get details of a specific event booking
 */
export const getEventBookingDetails = async (bookingId) => {
    return safeApiCall(async () => {
        const response = await api.get(`/event-booking/bookings/${bookingId}`);
        if (response.data.success) {
            return response.data.data;
        }
        return null;
    });
};

/**
 * Reserve tickets for an event
 */
export const reserveEventTickets = async (eventId, tickets, showDate = null, showTime = null) => {
    return safeApiCall(async () => {
        const body = { tickets };
        if (showDate) body.showDate = showDate;
        if (showTime) body.showTime = showTime;

        const response = await api.post(`/event-booking/${eventId}/reserve`, body);
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to reserve tickets');
    });
};

/**
 * Confirm event booking
 */
export const confirmEventBooking = async (reservationId, bookingData) => {
    return safeApiCall(async () => {
        const response = await api.post(`/event-booking/confirm/${reservationId}`, {
            ...bookingData,
            source: 'web'
        });
        if (response.data.success) {
            return response.data;
        }
        throw new Error(response.data.message || 'Failed to confirm booking');
    });
};

/**
 * Get user profile information
 */
export const getUserProfile = async () => {
    return safeApiCall(async () => {
        const response = await api.get('/user/profile');
        if (response.data.success) {
            const userData = response.data.data;
            return new User(userData);
        }
        return null;
    });
};

/**
 * Alias for getUserProfile used by pages
 */
export const getUser = async (userId) => {
    return getUserProfile();
};

/**
 * Update user profile
 */
export const updateUserProfile = async (profileData) => {
    return safeApiCall(async () => {
        const response = await api.put('/user/profile-update', profileData);
        if (response.data.success) {
            const userData = response.data.data;
            return new User(userData);
        }
        throw new Error(response.data.message || 'Failed to update profile');
    });
};

// ============= Authentication API =============
/**
 * Login with Google OAuth token
 */
export const loginWithGoogle = async (idToken) => {
    return safeApiCall(async () => {
        const response = await api.post('/user/google', { idToken });
        // console.log(response.data);
        if (response.data.success) {
            const initialUser = new User(response.data.data);

            // 1. Store initial user to set the Token (essential for getUserProfile)
            storeUser(initialUser.toJson());

            try {
                // 2. Fetch Full Profile immediately
                const fullProfile = await getUserProfile();

                if (fullProfile) {
                    // 3. Merge Token (Profile endpoint typically doesn't return token)
                    fullProfile.token = initialUser.token;

                    // 4. Update Storage with Full Profile
                    storeUser(fullProfile.toJson());

                    return {
                        success: true,
                        data: fullProfile,
                        user: fullProfile,
                        token: fullProfile.token,
                    };
                }
            } catch (error) {
                console.warn('Failed to fetch full profile after login, proceeding with basic info:', error);
            }

            return {
                success: true,
                data: initialUser,
                user: initialUser,
                token: initialUser.token,
            };
        }
        throw new Error(response.data.message || 'Google login failed');
    });
};

/**
 * Logout user
 */
export const logout = async () => {
    try {
        await api.post('/user/logout');
    } catch (error) {
        console.error('Error logging out:', error);
    } finally {
        removeUser();
    }
};

// ============= Payment API =============
/**
 * Initialize payment for a booking
 */
export const initiatePayment = async (bookingData) => {
    return safeApiCall(async () => {
        const response = await api.post('/payment/initiate', bookingData);
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to initiate payment');
    });
};

/**
 * Verify payment and confirm booking
 */
export const verifyPayment = async (paymentData) => {
    return safeApiCall(async () => {
        const response = await api.post('/payment/verify', paymentData);
        if (response.data.success) {
            return new Booking(response.data.data);
        }
        throw new Error(response.data.message || 'Payment verification failed');
    });
};

// ============= Offers & Promotions API =============
/**
 * Get available offers and promotions
 */
export const getOffers = async () => {
    try {
        const response = await api.get('/offers');
        if (response.data.success) {
            return response.data.data || [];
        }
        return [];
    } catch (error) {
        console.error('Error fetching offers:', error);
        return [];
    }
};

// ============= Error Handler =============
export const handleApiError = (error) => {
    if (error.response) {
        // Server responded with error status
        return {
            status: error.response.status,
            message: error.response.data?.message || 'An error occurred',
            data: error.response.data,
        };
    } else if (error.request) {
        // Request made but no response
        return {
            status: 0,
            message: 'No response from server',
            data: null,
        };
    }
    // Error in request setup
    return {
        status: -1,
        message: error.message || 'Unknown error',
        data: null,
    };
};

export default api;
