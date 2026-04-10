import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, Waves, MapPin, Calendar, Clock, Star, Info, Shield, Filter } from 'lucide-react';
import SEO from '../components/SEO';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import { useData } from '../context/DataContext';
import SportCard from '../components/SportCard';

const SwimmingPage = () => {
    const navigate = useNavigate();
    const { selectedCity, turfs, loading: dataLoading, error: dataError, refreshData } = useData();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState(null);

    // Sync context error to local error
    useEffect(() => {
        if (dataError) setError(dataError);
    }, [dataError]);

    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        poolType: 'All', // 'Indoor', 'Outdoor', 'Olympic'
        city: 'All'
    });

    // Filter Logic - Specialized for Swimming
    const swimmingVenues = useMemo(() => {
        // Filter turfs that have 'Swimming' or 'Pool' in tags or name
        let filtered = turfs.filter(t => 
            (t.tags || []).some(tag => tag.toLowerCase().includes('swimming') || tag.toLowerCase().includes('pool')) ||
            (t.name || "").toLowerCase().includes('swimming') ||
            (t.name || "").toLowerCase().includes('pool')
        );

        if (searchQuery.trim()) {
            filtered = filtered.filter(e =>
                (e.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (e.venue || "").toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filters.city !== 'All') {
            filtered = filtered.filter(e => e.city === filters.city);
        }

        return filtered;
    }, [turfs, searchQuery, filters]);

    if (dataLoading && turfs.length === 0) return <LoadingScreen message="Finding Pools & Swimming Centers" />;
    if (error) return <ErrorState error={error} onRetry={() => refreshData(1)} title="Connection Interrupted" />;

    return (
        <div className="min-h-screen bg-[#F0F7FF] dark:bg-[#0a0c10] transition-colors duration-300">
            <SEO
                title="Swimming - Pools & Centers | XYNEMA"
                description="Find the best swimming pools and aquatic centers near you. Book slots and enjoy a refreshing dip."
            />

            {/* Premium Hero Banner for Swimming */}
            <div className="relative h-[250px] md:h-[350px] overflow-hidden">
                <div className="absolute inset-0">
                    <img 
                        src="https://images.unsplash.com/photo-1530549387074-d56216278ff1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80" 
                        alt="Swimming Pool" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-transparent" />
                </div>
                
                <div className="relative z-10 w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto h-full flex flex-col justify-center px-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-400/30 backdrop-blur-md rounded-lg border border-white/20">
                            <Waves className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-blue-100 font-bold uppercase tracking-widest text-[10px]">Aquatics Category</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase mb-4">
                        Dive Into <span className="text-blue-400">Excellence</span>
                    </h1>
                    <p className="text-blue-100/80 max-w-lg text-sm md:text-base font-medium">
                        Discover premium swimming facilities, olympic-sized pools, and private aquatic centers. Book your lane in seconds.
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
                <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex-1 min-w-[300px] relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search swimming pools..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2">
                             <Filter className="w-4 h-4 text-gray-400 mr-2" />
                             <select 
                                value={filters.city}
                                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                                className="bg-transparent text-sm font-bold outline-none cursor-pointer"
                             >
                                 <option value="All">All Cities</option>
                                 <option value="Mumbai">Mumbai</option>
                                 <option value="Bangalore">Bangalore</option>
                                 <option value="Delhi">Delhi</option>
                             </select>
                        </div>
                    </div>
                </div>
            </div>

            <main className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3 uppercase">
                            Available Pools
                            <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full">{swimmingVenues.length}</span>
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium">Find your perfect swim spot in {selectedCity || 'your city'}</p>
                    </div>
                </div>

                {swimmingVenues.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {swimmingVenues.map((venue) => (
                            <SportCard key={venue.id} event={venue} />
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center bg-white dark:bg-[#1a1c23] rounded-[40px] border border-dashed border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Waves className="w-12 h-12 text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight dark:text-gray-100 uppercase">No Pools Found</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium max-w-xs mx-auto">We couldn't find any swimming venues matching your criteria in this area.</p>
                        <button 
                            onClick={() => {setSearchQuery(''); setFilters({ poolType: 'All', city: 'All' });}} 
                            className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black tracking-widest uppercase shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                        >
                            Reset Explore
                        </button>
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
                    <div className="p-8 bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                        <Shield className="w-10 h-10 text-blue-500 mb-6" />
                        <h4 className="font-black text-lg mb-2 uppercase tracking-tight">Clean & Safe</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">All pools on our platform follow strict pH matching and hygiene standards for your safety.</p>
                    </div>
                    <div className="p-8 bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                        <Calendar className="w-10 h-10 text-blue-500 mb-6" />
                        <h4 className="font-black text-lg mb-2 uppercase tracking-tight">Flexible Slots</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Book by the hour or get monthly passes at discounted rates for your regular training.</p>
                    </div>
                    <div className="p-8 bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                        <Star className="w-10 h-10 text-blue-500 mb-6" />
                        <h4 className="font-black text-lg mb-2 uppercase tracking-tight">Pro Trainers</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Access certified coaches at selected venues to help you master your strokes.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SwimmingPage;
