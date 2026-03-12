/**
 * Data Models - Aligned with Flutter App
 * These models handle serialization/deserialization of API responses
 */

export class Movie {
    constructor(data = {}) {
        this.id = data._id || data.id || '';
        this.title = data.MovieName || data.movieName || data.title || '';
        this.posterUrl = data.portraitPosterUrl || data.posterUrl || data.PosterUrl || '';
        this.backdropUrl = data.landscapePosterUrl || data.backdropUrl || data.BackdropUrl || '';

        // Match sample response: "Genre": ["Action", "Adventure", "Drama"]
        this.genre = Array.isArray(data.Genre)
            ? data.Genre.join(', ')
            : (data.Genre || data.genre || '');

        this.description = data.synopsis || data.description || '';
        this.trailerUrl = data.trailerUrl || null;
        this.duration = data.Duration || data.duration || 0;
        this.certification = Array.isArray(data.certification)
            ? data.certification.join(', ')
            : (data.certification || '');

        const rawLang = data.movieLanguage || data.language;
        this.language = Array.isArray(rawLang)
            ? rawLang.join(', ')
            : (rawLang || '').replace ? (rawLang || '').replace(/,/g, ', ') : (rawLang || '');
        this.releaseDate = data.releaseDate || '';
        this.slug = data.slug || '';
        this.isReleased = data.isReleased ?? false;

        this.rating = data.rating || 0;
        this.voteCount = data.voteCount || data.votes || 0;

        if (data.reviews && typeof data.reviews === 'object' && !Array.isArray(data.reviews)) {
            if (data.reviews.averageRating !== undefined) this.rating = data.reviews.averageRating;
            if (data.reviews.totalReviews !== undefined) this.voteCount = data.reviews.totalReviews;
            this.reviews = Array.isArray(data.reviews.reviews) ? data.reviews.reviews : [];
        } else {
            this.reviews = Array.isArray(data.reviews) ? data.reviews : [];
        }

        // Backward compatibility / Fallback
        if (!this.rating && data.Rating) this.rating = data.Rating;
        if (!this.voteCount && data.votes) this.voteCount = data.votes;

        this.isPromoted = data.isPromoted || data.Promoted || false;
        this.offers = Array.isArray(data.offers) ? data.offers : [];

        // Explicit cast/crew name extraction like mobile
        this.cast = this._parseCastCrew(data.cast, 'cast') || [];
        this.crew = this._parseCastCrew(data.crew, 'crew') || [];

        this.format = Array.isArray(data.format) ? data.format.map(f => f.toString()) : [];
        this.theaters = (data.availability?.theatres || data.availability?.theaters || []).map(t => new Theater(t));
        this.interestCount = data.interestCount || data.InterestCount || 0;

        // Highlights / Banners
        this.bannerImageUrl = data.bannerImageUrl || data.imageUrl || '';
        this.sectionImageUrl = data.sectionImageUrl || ''; // Do NOT fall back to bannerImageUrl — used for section banner only
        this.linkUrl = data.linkUrl || '';
        this.highlightType = data.highlightType || '';
        this.isActive = data.isActive ?? false;
        this.isBannerImageUrlActive = data.isBannerImageUrlActive ?? false;
        this.isSectionImageUrlActive = data.isSectionImageUrlActive ?? false;

        // Availability flag for Upcoming logic - Handle boolean and string 'true'
        // Default to false (Upcoming) if missing or explicitly false
        const availValue = data.availability?.isAvailable ?? data.isAvailable;
        this.isAvailable = availValue === true || availValue === 'true';

        // Also check if there are showtimes - if yes, it's definitely available
        const hasTheaters = (data.availability?.theatres?.length || 0) > 0 || (data.theaters?.length || 0) > 0;
        if (hasTheaters) {
            this.isAvailable = true;
        }
    }

    _parseCastCrew(arr, type = 'cast') {
        if (!Array.isArray(arr)) return [];
        return arr.map(e => {
            if (typeof e === 'object' && e !== null) {
                return type === 'cast' ? new CastMember(e) : new CrewMember(e);
            }
            // Fallback for old string format
            const name = String(e).split('(')[0].trim();
            const role = String(e).includes('(') ? String(e).split('(')[1].replace(')', '').trim() : '';
            return type === 'cast'
                ? new CastMember({ name, role })
                : new CrewMember({ name, role });
        });
    }

    static fromJson(json) {
        return new Movie(json);
    }
}

export class CastMember {
    constructor(data = {}) {
        this.id = data._id || data.id || '';
        this.name = data.name || '';
        this.role = data.role || '';
        this.photoUrl = data.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name || 'Cast')}&background=random&color=fff&size=256`;
    }
}

export class CrewMember {
    constructor(data = {}) {
        this.id = data._id || data.id || '';
        this.name = data.name || '';
        this.role = data.role || '';
        this.photoUrl = data.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name || 'Crew')}&background=random&color=fff&size=256`;
    }
}

export class Theater {
    constructor(data = {}) {
        this.id = data.theatreId || data._id || data.id || '';
        this.name = data.theatreName || data.theaterName || data.name || 'Unknown Theatre';
        this.city = data.city || data.location || '';
        this.address = data.address || '';
        this.coordinates = data.coordinates || { lat: 0, lng: 0 };
        this.screens = (data.screens || []).map(s => new Screen(s));
        this.amenities = data.amenities || [];
        this.contact = data.contact || {};

        // Parity properties
        this.distance = data.distance || null;
        this.rating = data.rating || 0;
        this.basePrice = data.basePrice || 0;
        this.features = data.features || (data.amenities ? data.amenities.slice(0, 3) : []);
        this.isFoodAndBeveragesAvailable = data.isFoodAndBeveragesAvailable ?? true;

        // Convenience: Flatten all shows from all screens
        this.allShows = this.screens.reduce((acc, screen) => {
            const screenShows = screen.shows.map(show => ({
                ...show,
                screenName: screen.name,
                screenType: screen.type
            }));
            return [...acc, ...screenShows];
        }, []);
    }

    static fromJson(json) {
        return new Theater(json);
    }
}

export class Screen {
    constructor(data = {}) {
        this.id = data.screenId || data._id || data.id || '';
        this.name = data.screenName || data.screenNumber || data.name || 'Screen';
        this.totalSeats = data.totalSeats || 0;
        this.type = data.screenType || data.type || '2D';
        this.facilities = data.facilities || [];
        this.shows = (data.showTimes || data.shows || []).map(s => {
            if (typeof s === 'string') {
                return new Show({
                    startTime: s,
                    format: this.type,
                    screenId: this.id,
                    showDate: data.showStartDate
                });
            }
            return new Show({ ...s, format: s.format || this.type });
        });
    }

    static fromJson(json) {
        return new Screen(json);
    }
}

export class Show {
    constructor(data = {}) {
        this.id = data.showId || data._id || data.id || '';
        this.movieId = data.movieId || data.movie?._id || '';
        this.theaterId = data.theaterId || data.theatre?._id || '';
        this.screenId = data.screenId || '';
        this.startTime = data.showTime || data.startTime || data.time || '';
        this.endTime = data.endTime || '';
        this.format = data.format || '2D';
        this.language = data.language || '';
        this.movieLanguage = Array.isArray(data.movieLanguage)
            ? data.movieLanguage.join(', ')
            : (data.movieLanguage || '');
        this.subtitles = data.subtitles || '';

        // Match Flutter logic: Extract from pricing array if direct basePrice is missing
        this.pricing = Array.isArray(data.pricing) ? data.pricing : [];
        const pricingPrice = this.pricing.length > 0 ? (this.pricing[0].basePrice || this.pricing[0].price) : 0;

        this.basePrice = (data.basePrice || data.price || pricingPrice || 0);

        this.date = data.showDate || data.date || new Date().toISOString().split('T')[0];
        this.availableSeats = data.availableSeats || 0;
        this.bookedSeats = data.bookedSeats || 0;
        this.totalSeats = data.totalSeats || (this.availableSeats + this.bookedSeats) || 0;

        // Preserve nested objects for display, properly instantiated to handle key variations
        this.movie = (data.movie && typeof data.movie === 'object') ? new Movie(data.movie) : new Movie({});
        this.theatre = (data.theatre || data.theater) && typeof (data.theatre || data.theater) === 'object'
            ? new Theater(data.theatre || data.theater)
            : new Theater({});
        this.screen = data.screen || {};
        this.isFoodAndBeveragesAvailable = data.isFoodAndBeveragesAvailable ?? true;

    }

    static fromJson(json) {
        return new Show(json);
    }
}

export class SeatPosition {
    constructor(data = {}) {
        this.row = data.row ?? data.rowIndex ?? data.r ?? 0;
        this.column = data.column ?? data.columnIndex ?? data.c ?? 0;
    }
}

export class Seat {
    constructor(data = {}) {
        this.id = data._id || data.id || '';
        this.seatNumber = data.seatNumber || data.number || '';
        this.row = data.row || data.rowLabel || '';
        this.column = data.column || '';
        this.status = data.status || 'AVAILABLE'; // AVAILABLE, BOOKED, LOCKED, SELECTED
        this.price = data.price || data.basePrice || 0;
        this.basePrice = this.price;
        this.type = data.seatType || data.type || 'normal';
        this.seatClass = data.seatClass || null; // Add this line to preserve seat class info

        this.position = new SeatPosition(data.position || {});

        // Boolean helpers matching Flutter app logic
        const statusLower = (this.status || '').toLowerCase();
        this.isBooked = data.isBooked ?? (statusLower === 'booked');
        this.isLocked = data.isLocked ?? (statusLower === 'locked');
        this.isAvailable = data.isAvailable ?? (statusLower !== 'closed' && statusLower !== 'unavailable');
    }

    static fromJson(json) {
        return new Seat(json);
    }

    toJson() {
        return {
            id: this.id,
            seatNumber: this.seatNumber,
            row: this.row,
            column: this.column,
            status: this.status,
            price: this.price,
            type: this.type,
        };
    }
}

export class FoodItem {
    constructor(data = {}) {
        this.id = data._id || data.id || '';
        this.name = data.name || '';
        this.category = data.category || 'SNACKS'; // SNACKS, BEVERAGES, COMBO
        this.description = data.description || '';
        this.price = (data.price || 0);
        this.image = data.image || 'https://placehold.co/200x200';
        this.quantity = data.quantity || 0;
        this.available = data.available !== false;
    }

    static fromJson(json) {
        return new FoodItem(json);
    }

    toJson() {
        return {
            id: this.id,
            name: this.name,
            category: this.category,
            price: this.price,
            quantity: this.quantity,
        };
    }
}

export class Booking {
    constructor(data = {}) {
        this.id = data.bookingId || data._id || data.id || '';
        this.movieId = data.movieId || '';
        this.movieTitle = data.movieTitle || 'Unknown Movie';
        this.posterUrl = data.posterUrl || 'https://placehold.co/400x600/666/FFFFFF.png?text=No%20Image';
        this.landscapePosterUrl = data.landscapePosterUrl || '';
        this.theaterName = data.theaterName || 'Unknown Theatre';
        this.city = data.city || 'N/A';
        this.date = data.date || '';
        this.time = data.time || '';
        this.screen = data.screen || '1';
        this.seats = Array.isArray(data.seats) ? data.seats : [];
        this.backendSeatIds = Array.isArray(data.backendSeatIds) ? data.backendSeatIds : [];
        this.showId = data.showId || '';
        this.sessionId = data.sessionId || '';
        this.paymentMethod = data.paymentMethod || 'upi';
        this.transactionId = data.transactionId || '';
        this.status = data.status || 'confirmed';
        this.ticketPrice = parseFloat(data.ticketPrice || 0);
        this.foodPrice = parseFloat(data.foodPrice || 0);
        this.convenienceFee = parseFloat(data.convenienceFee || 0);
        this.discount = parseFloat(data.discount || 0);
        this.tax = parseFloat(data.tax || 0);
        this.totalAmount = parseFloat(data.totalAmount || 0);
        this.foodOrders = data.foodOrders || {};
        this.duration = data.duration || 0;
        this.language = data.language || '';
        this.certification = data.certification || '';
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    static fromJson(json) {
        return new Booking(json);
    }

    static fromApiJson(json) {
        // Ultra-resilient key mapping matching Flutter app logic
        const movieData = json.movie || json.movieDetails || json.Movie || json.event || {};
        const theatreData = json.theatre || json.theatreDetails || json.theater || json.venue || movieData.venue || {};
        const screenData = json.screen || json.screenDetails || {};
        const pricing = json.pricing || json.paymentInfo || {};
        const payment = json.payment || json.transaction || {};
        const seatsList = Array.isArray(json.seats) ? json.seats : (Array.isArray(json.tickets) ? json.tickets : []);

        // Extract Movie Title
        let movieTitle = (movieData.movieName || movieData.MovieName || movieData.eventName || movieData.title || movieData.name ||
            json.movieName || json.MovieName || json.eventName || 'Unknown Movie').toString().trim();
        if (!movieTitle) movieTitle = 'Unknown Movie';

        // Extract Poster URL
        const posterUrl = (
            movieData.portraitPosterUrl || movieData.posterUrl || movieData.PosterUrl || movieData.image ||
            (Array.isArray(movieData.images) && movieData.images[0]?.url) ||
            json.posterUrl || json.PosterUrl || ''
        ).toString().trim();

        const landscapePosterUrl = (
            movieData.landscapePosterUrl ||
            (Array.isArray(movieData.images) && (movieData.images.find(img => img.type === 'landscape')?.url || movieData.images[1]?.url)) ||
            ''
        ).toString().trim();

        // Extract Theater Name
        let theaterName = (theatreData.theatreName || theatreData.theaterName || theatreData.venueName || theatreData.name ||
            json.theatreName || json.theaterName || 'Unknown Theatre').toString().trim();
        if (!theaterName || theaterName === "null") theaterName = 'Unknown Theatre';

        // Helper to normalize seat strings
        const normalizeSeat = (s) => {
            if (typeof s === 'object' && s !== null) {
                // For events, use ticket class and quantity if seatLabel is missing
                if (s.ticketClass) return `${s.ticketClass}${s.quantity > 1 ? ` x${s.quantity}` : ''}`;
                return s.seatLabel || s.label || s.number || '';
            }
            return String(s);
        };

        const seats = seatsList.map(s => normalizeSeat(s)).filter(s => s);

        // Extract Pricing
        const ticketPrice = parseFloat(pricing.subtotal || pricing.price || 0);
        const convenienceFee = parseFloat(pricing.convenienceFee || 0);
        const discount = parseFloat(pricing.discount || 0);
        const tax = parseFloat(pricing.gst || pricing.tax || 0);
        const totalAmount = parseFloat(pricing.total || pricing.totalAmount || 0);

        return new Booking({
            bookingId: (json.bookingId || json._id || '').toString(),
            movieId: (movieData._id || movieData.id || movieData.eventId || json.movieId || '').toString(),
            movieTitle,
            posterUrl,
            landscapePosterUrl,
            theaterName,
            city: (theatreData.location || theatreData.city || json.location || json.city || 'N/A').toString(),
            date: (json.showDate || json.date || movieData.showDate || '').toString(),
            time: (json.showTime || json.time || json.startTime || movieData.showTime || '').toString(),
            screen: (screenData.screenName || json.screenName || screenData.name || '1').toString(),
            seats,
            backendSeatIds: [], // Not critical for display
            showId: (json.show || json.showId || '').toString(),
            sessionId: '',
            paymentMethod: (payment.method || json.paymentMethod || 'upi').toString(),
            transactionId: (payment.transactionId || payment.txnId || json.transactionId || '').toString(),
            status: (json.status || 'confirmed').toString(),
            ticketPrice,
            foodPrice: parseFloat(pricing.foodSubtotal || 0),
            convenienceFee,
            discount,
            tax,
            totalAmount,
            foodOrders: json.foodAndBeverages || {},
            duration: movieData.duration || movieData.Duration || json.duration || 0,
            language: (movieData.language || movieData.movieLanguage || json.language || (Array.isArray(movieData.languages) ? movieData.languages[0] : '') || '').toString(),
            certification: (movieData.certification || json.certification || '').toString(),
            createdAt: (json.createdAt || '').toString(),
            isReviewed: json.isReviewed ?? false,
        });
    }

    toJson() {
        return {
            id: this.id,
            bookingId: this.id, // Ensure compatibility
            movieTitle: this.movieTitle,
            theaterName: this.theaterName,
            date: this.date,
            time: this.time,
            seats: this.seats,
            totalAmount: this.totalAmount,
            status: this.status,
            createdAt: this.createdAt,
        };
    }
}

export class User {
    constructor(data = {}) {
        const userData = data.user || data;
        this.id = userData._id || userData.id || '';
        this.displayName = userData.displayName || userData.name || '';
        this.email = userData.email || '';
        this.photoUrl = userData.photoUrl || userData.picture || userData.logoUrl || '';
        this.phoneNumber = userData.phoneNumber || userData.phone || '';
        this.token = data.token || userData.token || '';
        this.createdAt = userData.createdAt || new Date().toISOString();
    }

    static fromJson(json) {
        return new User(json);
    }

    encode() {
        return JSON.stringify(this.toJson());
    }

    static decode(str) {
        try {
            const data = JSON.parse(str);
            return new User(data);
        } catch (e) {
            return null;
        }
    }

    toJson() {
        return {
            id: this.id,
            displayName: this.displayName,
            email: this.email,
            photoUrl: this.photoUrl,
            phoneNumber: this.phoneNumber,
            token: this.token,
        };
    }
}

export class ScreenLayout {
    constructor(data = {}) {
        this.rows = data.rows ?? data.totalRows ?? data.rowCount ?? 0;
        this.columns = data.columns ?? data.totalColumns ?? data.columnCount ?? 0;
        this.seatLayout = Array.isArray(data.seatLayout) ? data.seatLayout : [];
        this.rowLabels = Array.isArray(data.rowLabels) ? data.rowLabels.map(l => String(l)) : [];
        this.columnLabels = Array.isArray(data.columnLabels) ? data.columnLabels : [];
    }
}

export class ShowLayoutResponse {
    constructor(data = {}) {
        this.show = new Show(data.show || data);

        // Match Flutter logic for finding layout either in root or nested
        const layoutRaw = data.layout ||
            data.show?.layout ||
            data.show?.screen?.layout ||
            data.show?.screen?.screenId?.layout ||
            data.show?.screen?.id?.layout ||
            {};
        this.layout = new ScreenLayout(layoutRaw);

        const seatsRaw = data.seats || [];
        this.seats = (Array.isArray(seatsRaw) ? seatsRaw : []).map(s => new Seat(s));

        // If seats is empty but seatLayout is present, attempt to flatten (like Flutter fallback)
        if (this.seats.length === 0 && this.layout.seatLayout.length > 0) {
            this.layout.seatLayout.forEach(row => {
                if (Array.isArray(row)) {
                    row.forEach(s => {
                        if (s && typeof s === 'object') {
                            const type = (s.seatType || s.type || 'normal').toString().toLowerCase();
                            const isSeat = !['path', 'aisle', 'null', 'empty'].includes(type);
                            if (isSeat) {
                                this.seats.push(new Seat(s));
                            }
                        }
                    });
                }
            });
        }
    }

    static fromJson(json) {
        return new ShowLayoutResponse(json);
    }

    toJson() {
        return {
            show: this.show.toJson(),
            seats: this.seats.map(s => s.toJson()),
        };
    }
}

export class EventTicket {
    constructor(data = {}) {
        this.id = data._id || '';
        this.className = data.className || 'Standard';
        this.price = parseFloat(data.price || 0);
        this.totalSeats = parseInt(data.totalSeats || 0);
        this.availableSeats = parseInt(data.availableSeats || 0);
        this.benefits = Array.isArray(data.benefits) ? data.benefits : [];
    }
}

export class EventShowTime {
    constructor(data = {}) {
        this.id = data._id || '';
        this.date = data.date || '';
        this.startTime = data.startTime || '';
        this.endTime = data.endTime || '';
        this.ticketClasses = (data.ticketClasses || []).map(t => new EventTicket(t));
    }
}

export class Event {
    constructor(data = {}) {
        this.id = data._id || '';
        this.name = data.heading || 'Untitled Event';
        this.slug = data.slug || '';
        this.eventType = data.eventType || 'single-day';

        // Date handling
        this.startDate = data.startDate || '';
        this.endDate = data.endDate || '';
        this.startTime = data.showTime || data.startTime || 'TBD';

        this.duration = data.duration || 0;
        this.ageGroup = data.ageGroup || 'All Ages';
        this.languages = Array.isArray(data.languages) ? data.languages : [];

        // Location mapping
        const loc = data.location || {};
        this.venue = loc.venue || 'Venue TBD';
        this.address = loc.address || '';
        this.city = loc.city || 'City TBD';
        this.state = loc.state || '';
        this.latitude = loc.coordinates?.coordinates?.[1] || null;
        this.longitude = loc.coordinates?.coordinates?.[0] || null;

        // Images mapping
        const imgs = Array.isArray(data.images) ? data.images : [];
        const allImages = imgs.map(img => img.url).filter(url => !!url);
        const primaryImg = imgs.find(img => img.isPrimary) || imgs[0];

        this.imageUrl = primaryImg?.url || (allImages.length > 0 ? allImages[0] : 'https://placehold.co/800x400');
        this.allImages = allImages;

        this.description = data.description || '';
        this.tags = Array.isArray(data.tags) ? data.tags : [];

        // Tickets mapping
        this.tickets = (data.singleDayTickets || []).map(t => new EventTicket(t));
        this.showTimes = (data.showTimes || []).map(s => new EventShowTime(s));

        // Calculate min price
        let allPrices = [];
        if (this.tickets.length > 0) {
            allPrices.push(...this.tickets.map(t => t.price));
        }
        if (this.showTimes.length > 0) {
            this.showTimes.forEach(st => {
                allPrices.push(...st.ticketClasses.map(t => t.price));
            });
        }
        this.price = allPrices.length > 0 ? Math.min(...allPrices) : 0;

        // Organizer mapping
        const org = data.organizer || {};
        this.organizerName = org.name || 'Organizer';
        this.organizerContact = org.contact || '';
        this.organizerEmail = org.email || '';

        this.status = data.status || 'published';
    }

    static fromJson(json) {
        return new Event(json);
    }
}

export class EventBooking {
    constructor(data = {}) {
        this.id = data._id || '';
        this.id = data._id || data.id || '';
        this.bookingId = data.bookingId || '';
        this.status = data.bookingStatus || data.status || '';
        this.qrCode = data.qrCode || '';
        this.bookedAt = data.bookedAt || '';
        this.isCheckedIn = data.isCheckedIn || false;

        // Event Details - Handle both nested and top-level fields
        const eventData = data.eventDetails || data.event || {};
        const venueData = data.venue || eventData.venue || eventData.location || {};

        this.eventName = data.eventName || eventData.eventName || '';
        this.eventId = data.eventId || eventData.eventId || eventData._id || '';

        // Date and Time Mapping
        this.showDate = data.showDate || eventData.showDate || '';
        this.showTime = data.showTime || eventData.showTime || '';

        // Image extraction
        const images = eventData.eventImages || eventData.images || [];
        const primaryImage = images.find(img => img.isPrimary) || images[0];
        this.imageUrl = primaryImage?.url || '';

        this.venue = {
            name: venueData.venueName || venueData.venue || venueData.name || '',
            address: venueData.venueAddress || venueData.address || '',
            city: venueData.city || ''
        };

        // Pricing and Tickets — Robust mapping for various API formats
        const pricing = data.pricing || {};
        this.totalAmount = parseFloat(data.totalPrice || data.totalAmount || pricing.totalAmount || 0);
        this.currency = data.currency || pricing.currency || 'INR';

        // Tickets - Handle both array and single ticket fields
        if (Array.isArray(data.tickets)) {
            this.tickets = data.tickets.map(t => ({
                ticketClass: t.ticketClass || '',
                quantity: t.quantity || 0,
                pricePerTicket: parseFloat(t.pricePerTicket || 0),
                totalPrice: parseFloat(t.totalPrice || 0)
            }));
        } else if (data.ticketClass || data.quantity) {
            this.tickets = [{
                ticketClass: data.ticketClass || 'Standard',
                quantity: data.quantity || 1,
                pricePerTicket: parseFloat(data.pricePerTicket || 0),
                totalPrice: parseFloat(data.totalPrice || 0)
            }];
        } else {
            this.tickets = [];
        }
    }

    static fromJson(json) {
        return new EventBooking(json);
    }
}
