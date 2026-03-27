import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUpcomingMovies, getNowShowingMovies, getNotNowMovies, addMovieReview, toggleInterest, getHighlightsMovies } from '../services/movieService';
import { getFoodItems } from '../services/storeService';
import { getUserBookings, getBookingDetails } from '../services/bookingService';
import { getEventBookings, getEvents } from '../services/eventService';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { getAvailableTurfs } from '../services/turfService';
import * as api from '../services/api';
import { useAuth } from './AuthContext';
import { errorHandler } from '../utils/helpers';
import { Movie, FoodItem, Theater, User } from '../models/index.js';
import apiCacheManager from '../services/apiCacheManager';

const DataContext = createContext();

/**
 * Hook to use data context
 */
export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

/**
 * Data Provider Component
 * Manages global application data (movies, food items, etc.)
 */
export const DataProvider = ({ children, selectedCity }) => {
    const { isAuthenticated } = useAuth();
    const [movies, setMovies] = useState(() => {
        const cached = apiCacheManager.get(`movies_${selectedCity}`);
        return cached?.movies ? cached.movies.map(m => new Movie(m)) : [];
    });
    const [latestMovies, setLatestMovies] = useState(() => {
        const cached = apiCacheManager.get('latest_movies');
        return Array.isArray(cached) ? cached.map(m => new Movie(m)) : [];
    });
    const [upcomingMovies, setUpcomingMovies] = useState(() => {
        const cached = apiCacheManager.get('upcoming_movies_global');
        return Array.isArray(cached) ? cached.map(m => new Movie(m)) : [];
    });
    const [highlightsMovies, setHighlightsMovies] = useState(() => {
        const cached = apiCacheManager.get('highlights_movies');
        return Array.isArray(cached) ? cached.map(m => new Movie(m)) : [];
    });
    const [theaters, setTheaters] = useState(() => {
        const cached = apiCacheManager.get(`movies_${selectedCity}`);
        return cached?.theaters ? cached.theaters.map(t => new Theater(t)) : [];
    });
    const [foodItems, setFoodItems] = useState(() => {
        const cached = apiCacheManager.get('food_items');
        return Array.isArray(cached) ? cached : [];
    });
    const [events, setEvents] = useState(() => {
        const cached = apiCacheManager.get(`events_${selectedCity || 'all'}`);
        return Array.isArray(cached) ? cached : [];
    });
    const [turfs, setTurfs] = useState(() => {
        const cached = apiCacheManager.get(`turfs_${selectedCity || 'all'}`);
        return Array.isArray(cached) ? cached : [];
    });

    const [userMovieBookings, setUserMovieBookings] = useState([]);
    const [userEventBookings, setUserEventBookings] = useState([]);
    const [userBookings, setUserBookings] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [interestedMovieIds, setInterestedMovieIds] = useState(new Set());
    const [initialInterestedMovieIds, setInitialInterestedMovieIds] = useState(new Set());
    const [loading, setLoading] = useState(!movies.length); // Only show initial loading if no cache
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [pagination, setPagination] = useState(() => {
        const cached = apiCacheManager.get(`movies_${selectedCity}`);
        return cached?.pagination || { total: 0, page: 1, pages: 1 };
    });
    
    // Track previous city to avoid redundant clears
    const prevCityRef = React.useRef(selectedCity);

    /**
     * Refresh all data from API with caching
     */
    const refreshData = useCallback(async (page = 1) => {
        // SWR: Only show loader if we have NO data at all
        const hasData = movies.length > 0;
        if (!hasData) setLoading(true);
        
        setError(null);
        try {
            // SWR: Force a background revalidation for page 1
            const shouldRevalidate = page === 1;

            const [movieData, foodData, upcomingData, latestData, eventData, highlightsData, turfData] = await Promise.all([
                // Now Showing (based on city)
                page === 1 ? apiCacheManager.getOrFetchMovies(selectedCity,
                    () => getNowShowingMovies(selectedCity, page),
                    shouldRevalidate
                ) : getNowShowingMovies(selectedCity, page),

                // Food items
                apiCacheManager.getOrExecute('food_items',
                    () => getFoodItems(),
                    1800,
                    shouldRevalidate
                ),

                // Upcoming movies
                apiCacheManager.getOrFetchUpcomingMovies(null,
                    () => getUpcomingMovies(),
                    shouldRevalidate
                ),

                // Latest movies
                apiCacheManager.getOrExecute('latest_movies',
                    () => getNotNowMovies(selectedCity),
                    1800,
                    shouldRevalidate
                ),
                // Events
                apiCacheManager.getOrFetchEvents(selectedCity,
                    () => getEvents(selectedCity),
                    shouldRevalidate
                ),
                // Highlights
                apiCacheManager.getOrExecute('highlights_movies',
                    () => getHighlightsMovies(),
                    1800,
                    shouldRevalidate
                ),
                // Turfs
                apiCacheManager.getOrFetchTurfs(selectedCity,
                    () => getAvailableTurfs({ city: selectedCity }),
                    shouldRevalidate
                ),
            ]);

            // Parse movie and theater data
            const moviesList = (movieData.movies || []).map(m => new Movie(m));
            const upcomingList = (Array.isArray(upcomingData) ? upcomingData : []).map(m => new Movie(m));
            const latestList = (Array.isArray(latestData) ? latestData : []).map(m => new Movie(m));
            const highlightsList = (Array.isArray(highlightsData) ? highlightsData : []).map(m => new Movie(m));
            const theatersList = (movieData.theaters || []).map(t => new Theater(t));
            const foodList = Array.isArray(foodData) ? foodData : [];

            setMovies(moviesList);
            setUpcomingMovies(upcomingList);
            setLatestMovies(latestList);
            setHighlightsMovies(highlightsList);
            setTheaters(theatersList);
            setEvents(eventData || []);
            setFoodItems(foodList);
            setTurfs(turfData || []);
            setPagination(movieData.pagination || { total: 0, page: 1, pages: 1 });
            setLastUpdated(new Date());
        } catch (err) {
            const message = errorHandler.getUserMessage(err);
            setError(message);
            console.error('Data refresh error:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedCity]);

    /**
     * Fetch user's personal bookings
     */
    const fetchUserBookings = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const [movieBookings, eventBookings] = await Promise.all([
                apiCacheManager.getOrFetchMovieBookings(1, () => getUserBookings()),
                apiCacheManager.getOrFetchEventBookings(1, () => getEventBookings())
            ]);

            const movieBookingsArray = movieBookings?.bookings || (Array.isArray(movieBookings) ? movieBookings : []);
            const eventBookingsArray = eventBookings?.bookings || (Array.isArray(eventBookings) ? eventBookings : []);

            setUserMovieBookings(movieBookingsArray);
            setUserEventBookings(eventBookingsArray);
            setUserBookings([...movieBookingsArray, ...eventBookingsArray]);
        } catch (err) {
            console.error('Error fetching user bookings:', err);
            setUserMovieBookings([]);
            setUserEventBookings([]);
            setUserBookings([]);
        }
    }, [isAuthenticated]);

    /**
     * Interest Tracking Logic
     */
    useEffect(() => {
        try {
            const cached = JSON.parse(localStorage.getItem('interested_movies') || '[]');
            const interestSet = new Set(cached);
            setInterestedMovieIds(interestSet);
            setInitialInterestedMovieIds(new Set(interestSet));
        } catch (e) {
            console.error('Error loading interests:', e);
        }
    }, []);

    const toggleInterestOptimistic = useCallback(async (movieId) => {
        if (!isAuthenticated) return false;

        const isCurrentlyInterested = interestedMovieIds.has(movieId);
        const newSet = new Set(interestedMovieIds);

        if (isCurrentlyInterested) {
            newSet.delete(movieId);
        } else {
            newSet.add(movieId);
        }

        setInterestedMovieIds(newSet);
        localStorage.setItem('interested_movies', JSON.stringify(Array.from(newSet)));

        try {
            await toggleInterest(movieId, !isCurrentlyInterested);
            return true;
        } catch (err) {
            console.error('Interest sync failed:', err);
            return false;
        }
    }, [interestedMovieIds, isAuthenticated]);

    const getInterestOffset = useCallback((movieId) => {
        const wasInterested = initialInterestedMovieIds.has(movieId);
        const isInterested = interestedMovieIds.has(movieId);

        if (isInterested && !wasInterested) return 1;
        if (!isInterested && wasInterested) return -1;
        return 0;
    }, [interestedMovieIds, initialInterestedMovieIds]);

    /**
     * Fetch user profile
     */
    const fetchUserProfile = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const profile = await apiCacheManager.getOrFetchProfile(() => getUserProfile());
            if (profile) {
                const standardizedUser = new User(profile);
                setUserProfile(standardizedUser);
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
        }
    }, [isAuthenticated]);

    /**
     * Update user profile
     */
    const updateUserProfileData = useCallback(async (formData) => {
        try {
            const currentUser = userProfile;
            const updatedUserData = await updateUserProfile(formData);
            if (currentUser && currentUser.token) {
                updatedUserData.token = currentUser.token;
            }
            apiCacheManager.invalidate('user_profile');
            setUserProfile(updatedUserData);
            return updatedUserData;
        } catch (err) {
            console.error('Error updating profile:', err);
            throw err;
        }
    }, [userProfile]);

    /**
     * Effect to fetch user data on login
     */
    useEffect(() => {
        if (isAuthenticated) {
            // Only fetch small profile data upfront
            fetchUserProfile();
        } else {
            setUserMovieBookings([]);
            setUserEventBookings([]);
            setUserBookings([]);
            setUserProfile(null);
        }
    }, [isAuthenticated, fetchUserProfile]);

    /**
     * Pagination Methods
     */
    const nextPage = useCallback(() => {
        if (pagination.page < pagination.pages) {
            refreshData(pagination.page + 1);
        }
    }, [pagination, refreshData]);

    const prevPage = useCallback(() => {
        if (pagination.page > 1) {
            refreshData(pagination.page - 1);
        }
    }, [pagination, refreshData]);

    const goToPage = useCallback((page) => {
        if (page >= 1 && page <= pagination.pages) {
            refreshData(page);
        }
    }, [pagination, refreshData]);

    /**
     * Refresh data when city changes
     */
    useEffect(() => {
        if (selectedCity) {
            // Only clear state and show loading if the city actually CHANGED
            if (prevCityRef.current !== selectedCity) {
                setMovies([]);
                setTheaters([]);
                setEvents([]);
                setTurfs([]);
                setLoading(true);
            }
            
            refreshData(1);
            prevCityRef.current = selectedCity;
        }
    }, [selectedCity, refreshData]);

    /**
     * Get movie by ID or Slug
     */
    const getMovieById = useCallback(
        idOrSlug => {
            const allAvailableMovies = [...movies, ...latestMovies, ...upcomingMovies];
            return allAvailableMovies.find(m => {
                const idMatch = String(m.id) === String(idOrSlug) || String(m._id) === String(idOrSlug);
                const slugMatch = m.slug && m.slug.toLowerCase() === String(idOrSlug).toLowerCase();
                return idMatch || slugMatch;
            });
        },
        [movies, latestMovies, upcomingMovies]
    );

    /**
     * Search movies by title or genre
     */
    const searchMovies = useCallback(
        query => {
            const lowerQuery = query.toLowerCase();
            return movies.filter(
                m =>
                    m.title.toLowerCase().includes(lowerQuery) ||
                    m.genre.toLowerCase().includes(lowerQuery)
            );
        },
        [movies]
    );

    /**
     * Search theaters by name or city
     */
    const searchTheaters = useCallback(
        query => {
            const lowerQuery = query.toLowerCase();
            return theaters.filter(
                t =>
                    t.name.toLowerCase().includes(lowerQuery) ||
                    t.city.toLowerCase().includes(lowerQuery)
            );
        },
        [theaters]
    );

    /**
     * Filter movies by language
     */
    const filterByLanguage = useCallback(
        language => {
            return movies.filter(m => m.language === language);
        },
        [movies]
    );

    /**
     * Get all available languages
     */
    const getAvailableLanguages = useCallback(() => {
        const languages = new Set(movies.map(m => m.language).filter(Boolean));
        return Array.from(languages);
    }, [movies]);

    /**
     * Get all available genres
     */
    const getAvailableGenres = useCallback(() => {
        const genres = new Set();
        movies.forEach(m => {
            m.genre.split(',').forEach(g => {
                genres.add(g.trim());
            });
        });
        return Array.from(genres);
    }, [movies]);

    /**
     * Get food item by ID
     */
    const getFoodItemById = useCallback(
        id => {
            return foodItems.find(f => f.id === id);
        },
        [foodItems]
    );

    /**
     * Filter food items by category
     */
    const filterFoodByCategory = useCallback(
        category => {
            return foodItems.filter(f => f.category === category);
        },
        [foodItems]
    );

    /**
     * Get available food categories
     */
    const getFoodCategories = useCallback(() => {
        const categories = new Set(foodItems.map(f => f.category).filter(Boolean));
        return Array.from(categories);
    }, [foodItems]);

    const value = {
        movies,
        latestMovies,
        upcomingMovies,
        highlightsMovies,
        theaters,
        events,
        turfs,
        foodItems,
        loading,
        error,
        lastUpdated,
        selectedCity,
        userMovieBookings,
        userEventBookings,
        userBookings,
        userProfile,
        pagination,
        refreshData,
        fetchUserBookings,
        fetchUserProfile,
        updateUserProfileData,
        nextPage,
        prevPage,
        goToPage,
        getMovieById,
        searchMovies,
        searchTheaters,
        filterByLanguage,
        getAvailableLanguages,
        getAvailableGenres,
        getFoodItemById,
        filterFoodByCategory,
        getFoodCategories,
        interestedMovieIds,
        toggleInterestOptimistic,
        getInterestOffset
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
