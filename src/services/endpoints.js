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
        DETAILS: (slug) => `/movies/movie/${slug}`,
    },

    // Events
    EVENTS: {
        LIST: '/movies/events',
        DETAILS: (eventId) => `/movies/events/${eventId}`,
        SIMILAR: (eventId) => `/movies/similar-events/${eventId}`,
        ENQUIRY: '/events/enquiry',
        INTEREST: (eventId) => `/movies/interest/event/${eventId}`,
    },

    // Booking & Seats
    BOOKING: {
        SHOWS: {
            AVAILABLE_SEATS: (showId) => `/booking/shows/${showId}/available-seats`,
            LOCK_SEATS: (showId) => `/booking/shows/${showId}/lock-seats`,
            RELEASE_SEATS: (showId) => `/booking/shows/${showId}/release-seats`,
            CREATE_ORDER: (showId) => `/booking/shows/${showId}/create-order`,
            CONFIRM: (showId) => `/booking/shows/${showId}/confirm-booking`,
            APPLY_COUPON: (showId) => `/booking/shows/${showId}/apply-coupon`,
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
        CREATE_ORDER: (reservationId) => `/event-booking/create-order/${reservationId}`,
        CONFIRM: (eventId, reservationId) => `/event-booking/confirm/${reservationId}`,
    },

    // User Profile
    USER: {
        PROFILE: '/user/profile',
        UPDATE: '/user/profile-update',
        GOOGLE_LOGIN: '/user/google',
        PHONE_LOGIN: '/user/phone-login',
        VERIFY_OTP: '/user/verify-phone-otp',
        LOGOUT: '/user/logout',
        COUPONS: '/user/coupons',
        DELETE_ACCOUNT: '/user/delete-account',
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
        CREATE_ORDER: '/customer-turf/create-order',
        CONFIRM: '/customer-turf/confirm-booking',
        CANCEL: '/customer-turf/cancel-reservation',
        MY_BOOKINGS: '/customer-turf/my-bookings',
        BOOKING_DETAILS: (bookingId) => `/customer-turf/booking/${bookingId}`,
        SIMILAR: (turfId) => `/customer-turf/similar-turfs/${turfId}`,
        INTEREST: (turfId) => `/movies/interest/turf/${turfId}`,
    },

    // Parks
    PARKS: {
        LIST: '/customer-activity/activity-parks',
        DETAILS: (parkId) => `/customer-activity/activity-park/${parkId}`,
        AVAILABILITY: (parkId) => `/customer-activity/activity-parks/${parkId}/availability`,
        RESERVE: '/customer-activity/activity-parks/reserve-ticket',
        CANCEL_RESERVE: '/customer-activity/activity-parks/cancel-reserve',
        CREATE_ORDER: (reservationId) => `/customer-activity/activity-parks/create-order/${reservationId}`,
        CONFIRM: (reservationId) => `/customer-activity/activity-parks/confirm-booking/${reservationId}`,
        BOOKING_DETAILS: (bookingId) => `/customer-activity/activity-parks/bookings/${bookingId}`,
        MY_BOOKINGS: '/customer-activity/activity-parks/mybookings',
    },

    CANCELLATION: {
        MOVIES: {
            GET_POLICY: (bookingId) => `/cancellation/booking/${bookingId}/get-policy`,
            CANCEL: (bookingId) => `/booking/cancel-booking/${bookingId}`,
        },
        TURF: {
            GET_POLICY: (turfId) => `/customer-turf/booking/${turfId}/get-policy`,
            CANCEL: (bookingId) => `/customer-turf/cancel-booking/${bookingId}/cancel`
        }
    }
};
