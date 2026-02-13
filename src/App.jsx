import React, { useState, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import { DataProvider } from './context/DataContext';
import ErrorBoundary from './components/ErrorBoundary';
import SEO from './components/SEO';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import ScrollToTop from './components/ScrollToTop';
import bookingSessionManager from './utils/bookingSessionManager';

// Lazy load enhanced pages
const HomePage = lazy(() => import('./pages/HomePage'));
const MoviesPage = lazy(() => import('./pages/MoviesPage'));
const MovieDetailsPage = lazy(() => import('./pages/MovieDetailsPage'));
const TheaterSelectionPage = lazy(() => import('./pages/TheaterSelectionPage'));
const SeatSelectionPage = lazy(() => import('./pages/SeatSelectionPage'));
const FoodSelectionPage = lazy(() => import('./pages/FoodSelectionPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage'));
const BookingDetailsPage = lazy(() => import('./pages/BookingDetailsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const EventDetailsPage = lazy(() => import('./pages/EventDetailsPage'));
const EventBookingSummaryPage = lazy(() => import('./pages/EventBookingSummaryPage'));
const StorePage = lazy(() => import('./pages/StorePage'));
const BookingSummaryPage = lazy(() => import('./pages/BookingSummaryPage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'));
const TheaterDetailsPage = lazy(() => import('./pages/TheaterDetailsPage'));
const EventBookingDetailsPage = lazy(() => import('./pages/EventBookingDetailsPage'));
const MyEventBookingsPage = lazy(() => import('./pages/MyEventBookingsPage'));
const UpcomingMoviesPage = lazy(() => import('./pages/UpcomingMoviesPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const AllReviewsPage = lazy(() => import('./pages/AllReviewsPage'));
const Footer = lazy(() => import('./components/Footer'));
const LoginModal = lazy(() => import('./components/LoginModal'));
const CitySelectionModal = lazy(() => import('./components/CitySelectionModal'));
const NotFoundState = lazy(() => import('./components/NotFoundState'));
const PageLoader = () => <LoadingSpinner message="Loading your Cinema" />;

function BookingFlowGuard() {
    const location = useLocation();

    useEffect(() => {
        const currentPath = location.pathname;
        const isBookingRoute = /\/movie\/[^/]+\/[^/]+\/(seats|food|summary|payment)/.test(currentPath);

        if (!isBookingRoute) {
            const sessionInfo = bookingSessionManager.getSessionInfo();
            if (sessionInfo) {
                bookingSessionManager.clearSession();
            }
        }
    }, [location.pathname]);

    return null;
}

export default function App() {
    const [selectedCity, setSelectedCity] = useState(() => {
        return localStorage.getItem('selected_city') || "";
    });
    const [isCityModalManualOpen, setIsCityModalManualOpen] = useState(false);

    const handleCityChange = (city) => {
        setSelectedCity(city);
        localStorage.setItem('selected_city', city);
        setIsCityModalManualOpen(false);
    };

    return (
        <HelmetProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <ScrollToTop />
                <BookingFlowGuard />
                <DataProvider selectedCity={selectedCity}>
                    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
                        <SEO />
                        <Navbar
                            selectedCity={selectedCity}
                            setSelectedCity={handleCityChange}
                            openCityModal={() => setIsCityModalManualOpen(true)}
                        />
                        <Suspense fallback={null}>
                            <LoginModal />
                        </Suspense>

                        <Suspense fallback={null}>
                            <CitySelectionModal
                                isOpen={!selectedCity || isCityModalManualOpen}
                                onClose={() => setIsCityModalManualOpen(false)}
                                onSelect={handleCityChange}
                                currentCity={selectedCity}
                            />
                        </Suspense>

                        <main className="flex-grow">
                            <ErrorBoundary>
                                <Suspense fallback={<PageLoader />}>
                                    <Routes>
                                        <Route path="/" element={<HomePage selectedCity={selectedCity} />} />
                                        <Route path="/movies" element={<MoviesPage selectedCity={selectedCity} />} />
                                        <Route path="/upcoming-movies" element={<UpcomingMoviesPage />} />
                                        <Route path="/movie/:slug" element={<MovieDetailsPage />} />
                                        <Route path="/movie/:slug/reviews" element={<AllReviewsPage />} />
                                        <Route path="/movie/:slug/theaters" element={<TheaterSelectionPage selectedCity={selectedCity} />} />
                                        
                                        <Route path="/movie/:slug/:theaterSlug/seats" element={<ProtectedRoute><SeatSelectionPage /></ProtectedRoute>} />
                                        <Route path="/movie/:slug/:theaterSlug/food" element={<ProtectedRoute><FoodSelectionPage /></ProtectedRoute>} />
                                        <Route path="/movie/:slug/:theaterSlug/summary" element={<ProtectedRoute><BookingSummaryPage /></ProtectedRoute>} />
                                        <Route path="/movie/:slug/:theaterSlug/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
                    
                                        {/* Protected Account Routes */}
                                        <Route path="/bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
                                        <Route path="/events-bookings" element={<ProtectedRoute><MyEventBookingsPage /></ProtectedRoute>} />
                                        <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetailsPage /></ProtectedRoute>} />
                                        <Route path="/event-bookings/:id" element={<ProtectedRoute><EventBookingDetailsPage /></ProtectedRoute>} />
                                        <Route path="/events/booking-summary" element={<ProtectedRoute><EventBookingSummaryPage /></ProtectedRoute>} />
                                        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                                        <Route path="/events" element={<ExplorePage initialTab="public_events" />} />
                                        <Route path="/private-events" element={<ExplorePage initialTab="private_events" />} />
                                        <Route path="/explore" element={<ExplorePage initialTab="public_events" />} />
                                        <Route path="/event/:slug" element={<EventDetailsPage />} />
                                        <Route path="/store" element={<StorePage />} />
                                        <Route path="/privacy" element={<PrivacyPolicy />} />
                                        <Route path="/terms" element={<TermsOfUse />} />
                                        <Route path="/theater/:slug" element={<TheaterDetailsPage />} />
                                        <Route path="/favorites" element={<FavoritesPage />} />
                                        <Route path="/*" element={<NotFoundState title="Page Not Found" message="We couldn't find the page you're looking for." />} />
                                    </Routes>
                                </Suspense>
                            </ErrorBoundary>
                        </main>
                        <Suspense fallback={<div className="h-20 bg-slate-900" />}>
                            <Footer />
                        </Suspense>
                    </div>
                </DataProvider>
            </Router>
        </HelmetProvider>
    );
}
