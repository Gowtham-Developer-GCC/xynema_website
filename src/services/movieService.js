import api, { safeApiCall } from './api';
import { ENDPOINTS } from './endpoints';
import { Movie, Theater } from '../models/index.js';

export const getCities = async () => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.MOVIES.CITIES);
        if (response.data.success) {
            return response.data.data || [];
        }
        return [];
    });
};

export const getNotNowMovies = async () => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.MOVIES.LATEST);
        if (response.data.success) {
            const resultData = response.data.data;
            if (Array.isArray(resultData)) {
                return resultData.map(m => new Movie(m));
            }
        }
        return [];
    });
};

export const addMovieReview = async (bookingId, reviewData) => {
    return safeApiCall(async () => {
        const response = await api.post(ENDPOINTS.MOVIES.ADD_REVIEW(bookingId), reviewData);
        return response.data;
    });
};

export const toggleInterest = async (movieId, interested) => {
    return safeApiCall(async () => {
        const response = await api.post(ENDPOINTS.MOVIES.INTEREST(movieId), { interested });
        return response.data;
    });
};

export const getUpcomingMovies = async (city) => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.MOVIES.UPCOMING, { params: { city } });
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

export const getTheatersForMovie = async (movieId, city, date) => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.MOVIES.THEATRES(movieId), {
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

export const getTheatersByMovie = async (movieId) => {
    const city = localStorage.getItem('selected_city');
    if (!city) return { success: false, message: 'No city selected' };
    const date = new Date().toISOString().split('T')[0];
    const data = await getTheatersForMovie(movieId, city, date);
    return {
        success: true,
        data: data
    };
};

export const getShows = async (movieId, theaterId) => {
    return { success: true, data: [] };
};

export const getHighlightsMovies = async () => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.MOVIES.HIGHLIGHTS);
        if (response.data.success) {
            const resultData = response.data.data;
            if (Array.isArray(resultData)) {
                return resultData.map(m => new Movie(m));
            }
        }
        return [];
    });
};

export const movieService = {
    getCities,
    getNotNowMovies,
    getHighlightsMovies,
    addMovieReview,
    toggleInterest,
    getUpcomingMovies,
};
