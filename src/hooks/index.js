/**
 * Custom React Hooks
 * Reusable logic for common operations across the application
 */

import { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import {
    getUpcomingMovies,
    getTheatersForMovie,
    getShowSeats,
    lockSeats,
    releaseSeats,
    getUserBookings,
    confirmBooking,
} from '../services/api';
import { errorHandler } from '../utils/helpers';

/**
 * Hook for managing async data fetching with loading and error states
 */
export function useFetch(asyncFunction, deps = []) {
    const [state, dispatch] = useReducer(
        (state, action) => {
            switch (action.type) {
                case 'LOADING':
                    return { loading: true, data: null, error: null };
                case 'SUCCESS':
                    return { loading: false, data: action.payload, error: null };
                case 'ERROR':
                    return { loading: false, data: null, error: action.payload };
                default:
                    return state;
            }
        },
        { loading: true, data: null, error: null }
    );

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            dispatch({ type: 'LOADING' });
            try {
                const result = await asyncFunction();
                if (isMounted) {
                    dispatch({ type: 'SUCCESS', payload: result });
                }
            } catch (error) {
                if (isMounted) {
                    dispatch({ type: 'ERROR', payload: errorHandler.getUserMessage(error) });
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, deps);

    return state;
}

/**
 * Hook for managing movie data fetching
 */
export function useMovies(city) {
    const [movies, setMovies] = useState([]);
    const [theaters, setTheaters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshMovies = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getUpcomingMovies(city);
            setMovies(data.movies || []);
            setTheaters(data.theaters || []);
        } catch (err) {
            setError(errorHandler.getUserMessage(err));
        } finally {
            setLoading(false);
        }
    }, [city]);

    useEffect(() => {
        if (city) {
            refreshMovies();
        }
    }, [city, refreshMovies]);

    return { movies, theaters, loading, error, refreshMovies };
}

/**
 * Hook for managing seat selection and locking
 */
export function useSeats(showId) {
    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const lockedSeatsRef = useRef([]);

    // Fetch seats
    useEffect(() => {
        const fetchSeats = async () => {
            try {
                setLoading(true);
                const data = await getShowSeats(showId);
                setSeats(data.seats || []);
            } catch (err) {
                setError(errorHandler.getUserMessage(err));
            } finally {
                setLoading(false);
            }
        };

        if (showId) {
            fetchSeats();
        }
    }, [showId]);

    // Lock seats when selected
    const toggleSeat = useCallback((seatId) => {
        setSelectedSeats(prev => {
            const updated = prev.includes(seatId)
                ? prev.filter(id => id !== seatId)
                : [...prev, seatId];
            return updated;
        });
    }, []);

    const lockSelectedSeats = useCallback(async () => {
        if (selectedSeats.length === 0) {
            setError('Please select at least one seat');
            return null;
        }

        try {
            const id = await lockSeats(showId, selectedSeats);
            setSessionId(id);
            lockedSeatsRef.current = [...selectedSeats];
            return id;
        } catch (err) {
            setError(errorHandler.getUserMessage(err));
            throw err;
        }
    }, [showId, selectedSeats]);

    const releaseLock = useCallback(async () => {
        if (lockedSeatsRef.current.length > 0) {
            try {
                await releaseSeats(showId, lockedSeatsRef.current);
                lockedSeatsRef.current = [];
            } catch (err) {
                console.error('Error releasing seats:', err);
            }
        }
    }, [showId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            releaseLock();
        };
    }, [releaseLock]);

    return {
        seats,
        selectedSeats,
        sessionId,
        loading,
        error,
        toggleSeat,
        lockSelectedSeats,
        releaseLock,
    };
}

/**
 * Hook for managing booking state
 */
export function useBooking() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getUserBookings();
            setBookings(data || []);
        } catch (err) {
            setError(errorHandler.getUserMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    const createBooking = useCallback(async (showId, bookingData) => {
        try {
            setLoading(true);
            setError(null);
            const booking = await confirmBooking(showId, bookingData);
            setBookings(prev => [...prev, booking]);
            return booking;
        } catch (err) {
            const message = errorHandler.getUserMessage(err);
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    return {
        bookings,
        loading,
        error,
        fetchBookings,
        createBooking,
    };
}

/**
 * Hook for handling form state with validation
 */
export function useForm(initialValues, onSubmit, validate) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = useCallback(e => {
        const { name, value, type, checked } = e.target;
        setValues(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }, []);

    const handleBlur = useCallback(e => {
        const { name } = e.target;
        setTouched(prev => ({
            ...prev,
            [name]: true,
        }));
    }, []);

    const handleSubmit = useCallback(
        async e => {
            e.preventDefault();
            const newErrors = validate ? validate(values) : {};
            setErrors(newErrors);

            if (Object.keys(newErrors).length === 0) {
                try {
                    setIsSubmitting(true);
                    await onSubmit(values);
                } catch (error) {
                    console.error('Form submission error:', error);
                } finally {
                    setIsSubmitting(false);
                }
            }
        },
        [values, onSubmit, validate]
    );

    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
    }, [initialValues]);

    const setFieldValue = useCallback((name, value) => {
        setValues(prev => ({
            ...prev,
            [name]: value,
        }));
    }, []);

    const setFieldError = useCallback((name, error) => {
        setErrors(prev => ({
            ...prev,
            [name]: error,
        }));
    }, []);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        handleChange,
        handleBlur,
        handleSubmit,
        resetForm,
        setFieldValue,
        setFieldError,
    };
}

/**
 * Hook for debounced search
 */
export function useDebouncedSearch(searchFunction, delay = 500) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const timeoutRef = useRef(null);

    const search = useCallback(
        q => {
            setQuery(q);
            setLoading(true);

            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(async () => {
                try {
                    const data = await searchFunction(q);
                    setResults(data);
                } catch (error) {
                    console.error('Search error:', error);
                    setResults([]);
                } finally {
                    setLoading(false);
                }
            }, delay);
        },
        [searchFunction, delay]
    );

    useEffect(() => {
        return () => clearTimeout(timeoutRef.current);
    }, []);

    return { query, results, loading, search };
}

/**
 * Hook for managing local storage
 */
export function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return initialValue;
        }
    });

    const setValue = useCallback(
        value => {
            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            } catch (error) {
                console.error('Error writing to localStorage:', error);
            }
        },
        [key, storedValue]
    );

    return [storedValue, setValue];
}

/**
 * Hook for managing pagination
 */
export function usePagination(items, itemsPerPage = 10) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);

    const goToPage = useCallback(
        page => {
            const pageNumber = Math.max(1, Math.min(page, totalPages));
            setCurrentPage(pageNumber);
        },
        [totalPages]
    );

    const nextPage = useCallback(() => {
        goToPage(currentPage + 1);
    }, [currentPage, goToPage]);

    const prevPage = useCallback(() => {
        goToPage(currentPage - 1);
    }, [currentPage, goToPage]);

    return {
        currentPage,
        totalPages,
        currentItems,
        goToPage,
        nextPage,
        prevPage,
        itemsPerPage,
    };
}
