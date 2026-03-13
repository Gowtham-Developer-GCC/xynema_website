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

export const getNotNowMovies = async (city) => {
    return safeApiCall(async () => {
        // Hits /movies/upcomingmovies which actually has Streaming/Latest data
        const response = await api.get(ENDPOINTS.MOVIES.UPCOMING, { params: { city } });
        if (response.data.success) {
            const resultData = response.data.data || response.data.latestMovies || response.data.movies;
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

// This actually fetches Now Showing movies (movies tied to theaters in a city)
export const getNowShowingMovies = async (city, page = 1) => {
    return safeApiCall(async () => {
        // Hits /movies/upcomingmovies which actually has Now Showing data with theaters
        const response = await api.get(ENDPOINTS.MOVIES.UPCOMING, { params: { city, page } });
        if (response.data.success) {
            const resultData = response.data.data || response.data.movies;
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

// This fetches true Upcoming movies
export const getUpcomingMovies = async () => {
    return safeApiCall(async () => {
        // Hits /movies/latest-movies which actually has Global Upcoming data
        const response = await api.get(ENDPOINTS.MOVIES.LATEST);
        if (response.data.success) {
            const resultData = response.data.data || response.data.movies;
            if (Array.isArray(resultData)) {
                return resultData.map(m => new Movie(m));
            }
        }
        return [];
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

export const getSimilarMovies = async (movieId) => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.MOVIES.SIMILAR(movieId));
        if (response.data.success) {
            const resultData = response.data.data;
            if (Array.isArray(resultData)) {
                return resultData.map(m => new Movie(m));
            }
        }
        return [];
    });
};

export const getTheatersByCity = async (city) => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.MOVIES.BROWSE_CINEMAS, { params: { city } });
        if (response.data.success) {
            const resultData = response.data.data;
            if (Array.isArray(resultData)) {
                return resultData.map(t => new Theater(t));
            }
        }
        return [];
    });
};

export const getTheaterDetails = async (theaterId, date) => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.MOVIES.THEATER_DETAILS(theaterId), {
            params: { date }
        });

        let body = response.data;
        if (Array.isArray(body)) body = body[0] || {};

        if (body.success) {
            let theaterData = body.data;

            // If data is an array (movies list), we need to reconstruct the Theater object
            if (Array.isArray(theaterData)) {
                // Pick theater info from the first show if available
                const firstMovie = theaterData[0];
                const firstShow = firstMovie?.shows?.[0];
                const theatreInfo = firstShow?.theatre || {};

                return new Theater({
                    ...theatreInfo,
                    theaterId: theaterId,
                    movies: theaterData, // The list of movies with shows
                    summary: body.summary,
                    filters: body.filters
                });
            }

            return theaterData ? new Theater(theaterData) : null;
        }
        return null;
    });
};

export const movieService = {
    getCities,
    getNotNowMovies,
    getHighlightsMovies,
    addMovieReview,
    toggleInterest,
    getNowShowingMovies,
    getUpcomingMovies,
    getSimilarMovies,
    getTheatersByCity,
    getTheaterDetails,
};
