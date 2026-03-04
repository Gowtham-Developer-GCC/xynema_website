import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUpcomingMovies, getNotNowMovies, addMovieReview, toggleInterest, getHighlightsMovies } from '../services/movieService';
import { getFoodItems } from '../services/storeService';
import { getUserBookings, getBookingDetails } from '../services/bookingService';
import { getEventBookings, getEvents } from '../services/eventService';
import { getUserProfile, updateUserProfile } from '../services/userService';
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
    const [movies, setMovies] = useState([]);
    const [latestMovies, setLatestMovies] = useState([]);
    const [highlightsMovies, setHighlightsMovies] = useState([]);
    const [theaters, setTheaters] = useState([]);
    const [foodItems, setFoodItems] = useState([]);
    const [userMovieBookings, setUserMovieBookings] = useState([]);
    const [userEventBookings, setUserEventBookings] = useState([]);
    const [userBookings, setUserBookings] = useState([]);
    const [events, setEvents] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [interestedMovieIds, setInterestedMovieIds] = useState(new Set());
    const [initialInterestedMovieIds, setInitialInterestedMovieIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        pages: 1
    });

    /**
     * Refresh all data from API with caching
     */
    const refreshData = useCallback(async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const [movieData, foodData, latestData, eventData, highlightsData] = await Promise.all([
                // Use cache for movies unless page is not 1
                page === 1 ? apiCacheManager.getOrFetchMovies(selectedCity,
                    () => getUpcomingMovies(selectedCity, page)
                ) : getUpcomingMovies(selectedCity, page),

                // Food items cache
                apiCacheManager.getOrExecute('food_items',
                    () => getFoodItems(),
                    1800 // 30 minutes
                ),

                // Latest movies cache
                apiCacheManager.getOrExecute('latest_movies',
                    () => getNotNowMovies(),
                    1800 // 30 minutes
                ),
                // Events cache
                apiCacheManager.getOrFetchEvents(selectedCity,
                    () => getEvents(selectedCity)
                ),
                // Highlights cache
                apiCacheManager.getOrExecute('highlights_movies',
                    () => getHighlightsMovies(),
                    1800 // 30 minutes
                ),
            ]);

            // Parse movie and theater data
            const moviesList = (movieData.movies || []).map(m => new Movie(m));
            const latestList = (Array.isArray(latestData) ? latestData : []).map(m => new Movie(m));
            const highlightsList = (Array.isArray(highlightsData) ? highlightsData : []).map(m => new Movie(m));
            const theatersList = (movieData.theaters || []).map(t => new Theater(t));
            const foodList = Array.isArray(foodData) ? foodData : [];

            setMovies(moviesList);
            setLatestMovies(latestList);
            setHighlightsMovies(highlightsList);
            setTheaters(theatersList);
            setEvents(eventData || []);
            setFoodItems(foodList);
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
     * FOR RATING
     * 
     */

    /**
     * Fetch user's personal bookings
     * Separated into movie and event bookings with caching
     */
    const fetchUserBookings = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            // Use cache manager to prevent duplicate requests
            const [movieBookings, eventBookings] = await Promise.all([
                apiCacheManager.getOrFetchMovieBookings(() => getUserBookings()),
                apiCacheManager.getOrFetchEventBookings(() => getEventBookings())
            ]);

            // Ensure bookings are arrays before spreading
            const movieBookingsArray = Array.isArray(movieBookings) ? movieBookings : [];
            const eventBookingsArray = Array.isArray(eventBookings) ? eventBookings : [];

            setUserMovieBookings(movieBookingsArray);
            setUserEventBookings(eventBookingsArray);

            // Keep combined list for backward compatibility
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
            setInitialInterestedMovieIds(new Set(interestSet)); // Capture initial state for offset calculation
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

        // 1. Update UI immediately
        setInterestedMovieIds(newSet);

        // 2. Persist to localStorage
        localStorage.setItem('interested_movies', JSON.stringify(Array.from(newSet)));

        // 3. API Sync (Optimistic)
        try {
            await toggleInterest(movieId, !isCurrentlyInterested);
            return true;
        } catch (err) {
            console.error('Interest sync failed:', err);
            // Revert on failure? Flutter keeps it optimistic, let's stick to that for now
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
     * Fetch user profile - OPTIMIZED with caching
     * Only fetch from API if we don't have fresh profile data
     */
    const fetchUserProfile = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            // Use cache manager to prevent duplicate profile fetches
            const profile = await apiCacheManager.getOrFetchProfile(() =>
                getUserProfile()
            );

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
     * Ensures token is preserved and cache is invalidated
     */
    const updateUserProfileData = useCallback(async (formData) => {
        try {
            const currentUser = userProfile;
            const updatedUserData = await updateUserProfile(formData);

            // Preserve token from current user (API response typically doesn't include token)
            if (currentUser && currentUser.token) {
                updatedUserData.token = currentUser.token;
            }

            // Invalidate profile cache so next fetch gets fresh data
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
            fetchUserBookings();
            fetchUserProfile();
        } else {
            setUserMovieBookings([]);
            setUserEventBookings([]);
            setUserBookings([]);
            setUserProfile(null);
        }
    }, [isAuthenticated, fetchUserBookings, fetchUserProfile]);


    /**
     *END FOR RATING
     * 
     */


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
            setMovies([]); // Clear movies to trigger skeleton
            setTheaters([]); // Clear theaters
            refreshData(1);
        }
    }, [selectedCity, refreshData]);

    /**
     * Get movie by ID
     */
    const getMovieById = useCallback(
        id => {
            return movies.find(m => m.id === id) || latestMovies.find(m => m.id === id);
        },
        [movies, latestMovies]
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
        // State
        movies,
        latestMovies,
        highlightsMovies,
        theaters,
        events,
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

        // Methods
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

        // Interest Logic
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
