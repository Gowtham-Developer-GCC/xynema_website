import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, X, Loader, ChevronRight } from 'lucide-react';
import { getCities } from '../services/movieService';

const CitySelectionModal = ({ isOpen, onClose, onSelect, currentCity }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [allCities, setAllCities] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchCities = async () => {
                setLoading(true);
                try {
                    const cities = await getCities();
                    setAllCities(cities);
                } catch (error) {
                    console.error('Failed to fetch cities:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchCities();
        }
    }, [isOpen]);

    const filteredCities = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        const cities = allCities.length > 0 ? allCities : [];
        if (!query) return cities;
        return cities.filter(city => city.toLowerCase().includes(query));
    }, [searchQuery, allCities]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 sm:px-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-500"
                onClick={() => currentCity && onClose()}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 flex flex-col max-h-[85vh] border border-gray-100">

                {/* Header Section */}
                <div className="p-8 pb-4 bg-white z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Select Location</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Cinematic experiences near you</p>
                        </div>
                        {currentCity && (
                            <button
                                onClick={onClose}
                                className="p-2.5 bg-gray-50 rounded-full text-gray-400 hover:text-xynemaRose hover:bg-xynemaRose/10 transition-all active:scale-90"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <div className="space-y-5">
                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-300 group-focus-within:text-xynemaRose transition-colors" />
                            <input
                                type="text"
                                placeholder="Search for your city..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-xynemaRose/40 focus:ring-4 focus:ring-xynemaRose/5 transition-all shadow-sm"
                                autoFocus
                            />
                        </div>
                        {/* 
                        <div className="flex items-center justify-between px-1">
                            <button className="flex items-center gap-2 text-xynemaRose text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity">
                                <div className="p-1.5 bg-xynemaRose/10 rounded-lg">
                                    <MapPin className="w-3 h-3" />
                                </div>
                                <span>Detect My Location</span>
                            </button>
                        </div> */}
                    </div>
                </div>

                {/* Cities Grid Section */}
                <div className="overflow-y-auto p-8 pt-2 custom-scrollbar flex-1 bg-white">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-12 space-y-4">
                            <Loader className="w-8 h-8 animate-spin text-xynemaRose" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fetching Cities...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {!searchQuery && (
                                <div className="flex items-center gap-4">
                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Available Cities</h3>
                                    <div className="h-[1px] w-full bg-gray-100" />
                                </div>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {filteredCities.map((city) => (
                                    <button
                                        key={city}
                                        onClick={() => onSelect(city)}
                                        className={`group relative flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border-2
                                            ${currentCity === city
                                                ? 'bg-xynemaRose border-xynemaRose text-white shadow-lg shadow-xynemaRose/20'
                                                : 'bg-white border-gray-50 hover:border-xynemaRose/30 hover:bg-gray-50 text-gray-700'}
                                        `}
                                    >
                                        <span className="text-sm font-bold uppercase tracking-tight truncate">{city}</span>
                                        <ChevronRight className={`w-4 h-4 transition-all duration-300 
                                            ${currentCity === city ? 'opacity-100' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}
                                        `} />
                                    </button>
                                ))}
                            </div>

                            {filteredCities.length === 0 && (
                                <div className="text-center py-12 px-6 bg-gray-50 rounded-[28px] border-2 border-dashed border-gray-100">
                                    <p className="text-sm font-bold text-gray-400">No cities found matching "{searchQuery}"</p>
                                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">Try another search term</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #F1F5F9;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #E2E8F0;
                }
            `}</style>
        </div>
    );
};

export default CitySelectionModal;
