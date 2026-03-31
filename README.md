# 🎬 Xynema - Movie Booking Web Application

A production-ready React web application for movie ticket booking, fully synchronized with the Flutter mobile app. Both applications share the same API endpoints, data models, and business logic.

## ✨ Features

### 🎫 Movie Booking System
- Browse upcoming movies by city
- View theater availability and showtimes
- Interactive seat selection with real-time availability
- Seat locking mechanism for temporary reservation
- Multiple language and format support

### 🍿 Food & Concessions
- Browse available food items
- Add food items to booking
- Concession pricing and discounts

### 💳 Payment Integration
- Secure payment processing
- Multiple payment methods (UPI, Cards, Digital Wallets)
- Payment verification and confirmation
- Transaction tracking

### 👤 User Management
- Google OAuth authentication
- User profile management
- Booking history and details
- Ticket management (digital tickets with QR codes)

### 🔒 Security
- JWT-based authentication
- Automatic token refresh
- Protected routes with authentication checks
- Secure API communication

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm 8+
- Backend API server running

### Installation

```bash
# 1. Navigate to website directory
cd website

# 2. Install dependencies
npm install

# 3. Setup environment configuration
cp .env.development .env.production
# Edit .env.production with your production URLs
```

### Development

```bash
npm run dev
```
Starts development server at `http://localhost:5173`

### Production Build

```bash
npm run build    # Create optimized production bundle
npm run preview  # Test production build locally
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.jsx      # Navigation bar
│   ├── Footer.jsx      # Footer component
│   ├── LoginModal.jsx  # Authentication modal
│   ├── ErrorBoundary.jsx
│   ├── ProtectedRoute.jsx
│   └── SEO.jsx         # Meta tags for SEO
├── context/            # React Context providers
│   ├── AuthContext.jsx # Authentication state
│   └── DataContext.jsx # Global app data
├── pages/              # Page components
│   ├── HomePage.jsx
│   ├── MovieDetailsPage.jsx
│   ├── TheaterSelectionPage.jsx
│   ├── SeatSelectionPage.jsx
│   ├── FoodSelectionPage.jsx
│   ├── PaymentPage.jsx
│   ├── MyBookingsPage.jsx
│   ├── ProfilePage.jsx
│   ├── ExplorePage.jsx
│   ├── StorePage.jsx
│   ├── PrivacyPolicy.jsx
│   └── TermsOfUse.jsx
├── services/           # API communication
│   ├── api.js         # Complete API service
│   └── authEvents.js  # Auth event system
├── models/             # Data models (aligned with Flutter)
│   └── index.js       # Movie, Theater, Seat, Booking, User, etc.
├── hooks/              # Custom React hooks
│   └── index.js       # useFetch, useMovies, useSeats, useBooking, etc.
├── utils/              # Utility functions
│   └── helpers.js     # Validators, formatters, error handlers
├── config/             # Configuration management
│   └── environment.js  # Environment variables handler
├── App.jsx             # Main app component with routing
├── main.jsx            # React entry point
└── index.css           # Global styles (Tailwind CSS)
```

## 🔌 API Integration

All APIs align with the backend and Flutter app:

```javascript
// Cities & Movies
getCities()                                    // List available cities
getUpcomingMovies(city)                       // Movies by city
getTheatersForMovie(movieId, city, date)      // Theaters for specific movie

// Seat Management
getShowSeats(showId)                          // Get available seats
lockSeats(showId, seatIds)                    // Lock seats temporarily
releaseSeats(showId, seatIds)                 // Release locked seats

// Booking
confirmBooking(showId, bookingData)           // Confirm and create booking
getUserBookings()                             // Get user's bookings
getBookingDetails(bookingId)                  // Get specific booking

// Food
getFoodItems()                                // Get available food items

// Authentication
loginWithGoogle(idToken)                      // Google OAuth login
logout()                                      // Logout user

// User
getUserProfile()                              // Get profile info
updateUserProfile(profileData)                // Update profile

// Payment
initiatePayment(bookingData)                  // Start payment process
verifyPayment(paymentData)                    // Verify payment completion
```

## 📊 Data Models

All models in `src/models/index.js` match Flutter app structure:

```javascript
// Movie model
Movie {
  id, title, posterUrl, genre, description,
  trailerUrl, duration, certification, language,
  releaseDate, cast, crew, format, theaters
}

// Theater model
Theater {
  id, name, city, address, coordinates,
  screens, amenities, contact
}

// Seat model
Seat {
  id, seatNumber, row, column, status,
  price, type
}

// Booking model
Booking {
  id, movieTitle, posterUrl, theaterName, city,
  date, time, screen, seats, backendSeatIds,
  showId, sessionId, paymentMethod, transactionId,
  status, ticketPrice, foodPrice, convenienceFee,
  discount, tax, totalAmount, foodOrders
}

// User model
User {
  id, displayName, email, photoUrl,
  phoneNumber, token
}
```

## 🪝 Custom Hooks

Pre-built hooks for common operations:

```javascript
// Generic data fetching with loading/error states
useFetch(asyncFunction, dependencies)

// Movie data management
useMovies(city)

// Seat selection and locking
useSeats(showId)

// Booking state management
useBooking()

// Form state with validation
useForm(initialValues, onSubmit, validate)

// Debounced search
useDebouncedSearch(searchFunction, delay)

// Local storage persistence
useLocalStorage(key, initialValue)

// Pagination
usePagination(items, itemsPerPage)
```

## 🛠️ Utility Functions

Comprehensive utilities in `src/utils/helpers.js`:

### Validators
```javascript
validators.isValidEmail(email)
validators.isValidPhone(phone)
validators.isStrongPassword(password)
validators.isValidCardNumber(cardNumber)
validators.isValidCVV(cvv)
validators.isValidExpiryDate(expiry)
validators.isValidDate(dateString)
```

### Formatters
```javascript
utils.formatDate(dateString)
utils.formatTime(dateString)
utils.formatCurrency(amount, currency)
utils.formatPhone(phone)
utils.formatDuration(seconds)
```

### Helpers
```javascript
utils.debounce(func, delay)
utils.throttle(func, limit)
utils.deepCopy(obj)
utils.generateUUID()
utils.isEmpty(obj)
utils.safeJsonParse(jsonString)
utils.sleep(ms)
```

### Error Handling
```javascript
errorHandler.getUserMessage(error)
errorHandler.getStatusCode(error)
errorHandler.isNetworkError(error)
errorHandler.isTimeout(error)
errorHandler.logError(error, context)
```

## 🔑 Authentication Flow

1. User clicks "Sign in with Google"
2. Google OAuth callback returns ID token
3. Token sent to backend `/user/google` endpoint
4. Backend validates token and returns user + JWT token
5. User object stored in localStorage
6. JWT token automatically injected in API requests
7. 401 responses trigger auto-logout
8. Protected routes require authentication

## 📱 Responsive Design

- Mobile-first Tailwind CSS framework
- Fully responsive layouts
- Touch-friendly interface for mobile devices
- Optimized performance for all screen sizes

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir dist
```

### Docker
```bash
docker build -t movie-app-web .
docker run -p 80:80 movie-app-web
```

See [PRODUCTION_GUIDE.md](./PRODUCTION_GUIDE.md) for detailed deployment instructions.

## 🧪 Testing

```bash
# Unit tests
npm run test

# Test with UI
npm run test:ui

# Coverage report
npm run test:coverage
```

## 📊 Performance

- ⚡ Code splitting for faster initial load
- 📦 Lazy-loaded page components
- 🎯 Optimized bundle size (~250KB gzipped)
- 🔄 Request caching with axios interceptors
- ⏱️ Debounced user input handling

## 🔒 Security Features

- JWT-based authentication
- Secure API token handling
- Automatic token expiration handling
- HTTPS-only in production
- Input validation and sanitization
- Protected routes with role-based access
- CORS configuration for API

## 📝 Environment Variables

### Development
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_GOOGLE_CLIENT_ID=your-dev-client-id
VITE_ENV=DEVELOPMENT
VITE_LOG_LEVEL=debug
```

### Production
```
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_GOOGLE_CLIENT_ID=your-prod-client-id
VITE_ENV=PRODUCTION
VITE_LOG_LEVEL=error
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ANALYTICS_ID=your-analytics-id
```

## 🐛 Debugging

### Development Mode
```bash
npm run dev
```
- Console logging enabled
- Source maps available
- React DevTools support
- Network requests visible

### Production Mode
- Console logs removed
- No source maps (unless explicitly enabled)
- Error tracking with Sentry (optional)
- Analytics integration (optional)

## 📚 Documentation

- [PRODUCTION_GUIDE.md](./PRODUCTION_GUIDE.md) - Complete production setup and deployment guide
- [API Reference](../API_REFERENCE.md) - Backend API documentation
- [Flutter App](../lib) - Mobile app source code

## 🔄 Synchronization with Flutter App

Both web and mobile apps:
- ✅ Use identical API endpoints
- ✅ Parse responses identically
- ✅ Follow same authentication flow
- ✅ Handle errors consistently
- ✅ Share business logic patterns

## 🤝 Contributing

When adding features:
1. Create feature branch from `main`
2. Implement feature with tests
3. Ensure lint passes: `npm run lint`
4. Submit pull request with description

## 📞 Support

For issues or questions:
1. Check this README
2. Review [PRODUCTION_GUIDE.md](./PRODUCTION_GUIDE.md)
3. Check backend API documentation
4. Review browser console for errors

## 📄 License

This project is private and proprietary.

## 🎯 Project Status

✅ **Production Ready**

### Completed Features
- Complete API integration
- Full authentication system
- Movie browsing and details
- Theater and show selection
- Seat selection and locking
- Food selection and ordering
- Payment integration ready
- User profile management
- Booking history and details
- Responsive design

### Planned Features
- Push notifications
- Offline support (PWA)
- Advanced search filters
- Recommendation engine
- Social sharing features
- Review and ratings system

---

**Ready for production deployment!** 🚀

For detailed production setup, see [PRODUCTION_GUIDE.md](./PRODUCTION_GUIDE.md)
# xynema_website
# xynema-website
