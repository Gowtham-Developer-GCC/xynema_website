export const ENDPOINTS = {
    // Movies & Cities
    MOVIES: {
        CITIES: '/movies/cities',
        LATEST: '/movies/latest-movies',
        HIGHLIGHTS: '/movies/highlights',
        UPCOMING: '/movies/upcomingmovies',
        ADD_REVIEW: (bookingId) => `/movies/add-review/${bookingId}`,
        INTEREST: (movieId) => `/movies/interest/${movieId}`,
        THEATRES: (movieId) => `/movies/${movieId}/theatres`,
    },

    // Events
    EVENTS: {
        LIST: '/movies/events',
        ENQUIRY: '/events/enquiry',
    },

    // Booking & Seats
    BOOKING: {
        SHOWS: {
            AVAILABLE_SEATS: (showId) => `/booking/shows/${showId}/available-seats`,
            LOCK_SEATS: (showId) => `/booking/shows/${showId}/lock-seats`,
            RELEASE_SEATS: (showId) => `/booking/shows/${showId}/release-seats`,
            CONFIRM: (showId) => `/booking/shows/${showId}/confirm-booking`,
        },
        MY_BOOKINGS: '/booking/my-bookings',
        BOOKING_DETAILS: (bookingId) => `/booking/mybookings/${bookingId}`,
    },

    // Event Bookings
    EVENT_BOOKING: {
        LIST: '/event-booking/bookings',
        DETAILS: (bookingId) => `/event-booking/bookings/${bookingId}`,
        RESERVE: (eventId) => `/event-booking/${eventId}/reserve`,
        CONFIRM: (reservationId) => `/event-booking/confirm/${reservationId}`,
    },

    // User Profile
    USER: {
        PROFILE: '/user/profile',
        UPDATE: '/user/profile-update',
        GOOGLE_LOGIN: '/user/google',
        LOGOUT: '/user/logout',
    },

    // Payment
    PAYMENT: {
        INITIATE: '/payment/initiate',
        VERIFY: '/payment/verify',
    },

    // Offers
    OFFERS: {
        LIST: '/offers',
    }
};
