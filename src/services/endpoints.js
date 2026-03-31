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
        SIMILAR: (movieId) => `/movies/similar-movies/${movieId}`,
        BROWSE_CINEMAS: '/movies/browse-movies',
        THEATER_DETAILS: (theaterId) => `/movies/browse-movies/${theaterId}`,
    },

    // Events
    EVENTS: {
        LIST: '/movies/events',
        DETAILS: (eventId) => `/movies/events/${eventId}`,
        SIMILAR: (eventId) => `/movies/similar-events/${eventId}`,
        ENQUIRY: '/events/enquiry',
    },

    // Booking & Seats
    BOOKING: {
        SHOWS: {
            AVAILABLE_SEATS: (showId) => `/booking/shows/${showId}/available-seats`,
            LOCK_SEATS: (showId) => `/booking/shows/${showId}/lock-seats`,
            RELEASE_SEATS: (showId) => `/booking/shows/${showId}/release-seats`,
            CONFIRM: (showId) => `/booking/shows/${showId}/confirm-booking`,
            FOOD_AND_BEVERAGES: (theaterId) => `/booking/food&beverages/${theaterId}/food-and-beverages`,
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
    },

    // Turfs
    TURFS: {
        AVAILABLE: '/customer-turf/available-turfs',
        DETAILS: (turfId) => `/customer-turf/available-turf/${turfId}`,
        SLOTS: (courtId) => `/customer-turf/available-slots/${courtId}`,
        RESERVE: '/customer-turf/reserve-slot',
        CONFIRM: '/customer-turf/confirm-booking',
        CANCEL: '/customer-turf/cancel-reservation',
        MY_BOOKINGS: '/customer-turf/my-bookings',
        BOOKING_DETAILS: (bookingId) => `/customer-turf/booking/${bookingId}`,
        SIMILAR: (turfId) => `/customer-turf/similar-turfs/${turfId}`
    }
};
