import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, Star, Heart, Info, ChevronRight, Building2, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import { getTheatersByCity } from '../services/movieService';
import { useData } from '../context/DataContext';

const CinemasListPage = () => {
    const { selectedCity } = useData();
    const navigate = useNavigate();
    const [theaters, setTheaters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchTheaters = async () => {
            try {
                setLoading(true);
                const data = await getTheatersByCity(selectedCity);
                setTheaters(data || []);

                // Debug: Log max show end date per theater
                (data || []).forEach(t => {
                    console.log(`🎬 Theater: "${t.name}" (${t.id}) → maxShowEndDate: ${t.maxShowEndDate || 'No shows'}`);
                });
            } catch (err) {
                console.error('Failed to fetch theaters:', err);
                setError('Could not load cinemas. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        if (selectedCity) {
            fetchTheaters();
        }
    }, [selectedCity]);

    const filteredTheaters = useMemo(() => {
        return theaters.filter(t => 
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (t.address && t.address.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [theaters, searchQuery]);

    if (loading) return <LoadingScreen message="Finding nearby cinemas..." />;
    if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-[#0f1115] transition-colors duration-300">
            <SEO 
                title={`Cinemas in ${selectedCity} - XYNEMA`}
                description={`Find movie theaters and cinemas in ${selectedCity}. View showtimes and book tickets online.`}
            />

            {/* Header Section */}
            <div className="bg-white dark:bg-[#1a1d24] border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                                <ChevronRight className="w-4 h-4" />
                                <span className="text-gray-900 dark:text-gray-100 font-medium">Cinemas</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-display">
                                Cinemas in <span className="text-primary">{selectedCity}</span>
                            </h1>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by cinema or area"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 dark:text-gray-100 transition-all font-medium"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                
                {filteredTheaters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTheaters.map((theater) => (
                            <TheaterCard key={theater.id} theater={theater} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1a1d24] rounded-2xl border border-dashed border-gray-300 dark:border-gray-800">
                        <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
                        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">No cinemas found</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-xs">
                            We couldn't find any cinemas matching "{searchQuery}" in {selectedCity}.
                        </p>
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="mt-6 text-primary font-bold hover:underline"
                        >
                            Clear search
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const TheaterCard = ({ theater }) => {
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(false);

    const handleCardClick = () => {
        const slug = theater.slug || theater.id;
        navigate(`/theater/${slug}`, {
            state: { 
                theater,
                maxShowEndDate: theater.maxShowEndDate 
            }
        });
    };

    const toggleFavorite = (e) => {
        e.stopPropagation();
        setIsFavorite(!isFavorite);
    };

    return (
        <div 
            onClick={handleCardClick}
            className="group bg-white dark:bg-[#1a1d24] rounded-xl border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all duration-300 cursor-pointer relative"
        >
            <div className="flex gap-4">
                {/* Heart Icon on Left */}
                <button 
                    onClick={toggleFavorite}
                    className="shrink-0 mt-1 hover:scale-110 transition-transform"
                >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-primary text-primary' : 'text-gray-300 dark:text-gray-600'}`} />
                </button>

                <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-2 overflow-hidden">
                        <h3 className="text-base font-bold text-gray-800 dark:text-white group-hover:text-primary transition-colors truncate uppercase tracking-tight line-clamp-2">
                            {theater.name}
                        </h3>
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed font-medium">
                        {theater.address || `Premier Cinema in ${theater.city}`}
                    </p>

                    <div className="mt-4 flex items-center gap-3">
                        {theater.rating > 0 && (
                            <div className="flex items-center gap-1 text-[10px] font-black text-green-600 uppercase tracking-widest">
                                <Star className="w-3 h-3 fill-current" />
                                {theater.rating}
                            </div>
                        )}
                        <div className="flex items-center gap-1 text-[10px] font-black text-primary/60 dark:text-primary/40 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            View Details <ChevronRight className="w-3 h-3" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CinemasListPage;
