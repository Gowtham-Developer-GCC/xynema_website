import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader, ChevronRight, Building2, Landmark, Waves, TowerControl as Tower, LocateFixed } from 'lucide-react';
import { getCities } from '../services/movieService';
import apiCacheManager from '../services/apiCacheManager';

const POPULAR_CITY_CONFIG = [
    { name: 'Thiruvananthapuram', icon: <div className="w-12 h-12 bg-current" style={{ maskImage: 'url(/assets/cites/mumbai.png)', WebkitMaskImage: 'url(/assets/cites/mumbai.png)', maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} /> },
    { name: 'Kollam', icon: <div className="w-12 h-12 bg-current" style={{ maskImage: 'url(/assets/cites/puducherry.png)', WebkitMaskImage: 'url(/assets/cites/puducherry.png)', maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} /> },
    { name: 'Pathanamthitta', icon: <div className="w-12 h-12 bg-current" style={{ maskImage: 'url(/assets/cites/bengaluru.png)', WebkitMaskImage: 'url(/assets/cites/bengaluru.png)', maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} /> },
    { name: 'Alappuzha', icon: <div className="w-12 h-12 bg-current" style={{ maskImage: 'url(/assets/cites/hyderabad.png)', WebkitMaskImage: 'url(/assets/cites/hyderabad.png)', maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} /> },
    { name: 'Kottayam', icon: <div className="w-12 h-12 bg-current" style={{ maskImage: 'url(/assets/cites/ahmedabad.png)', WebkitMaskImage: 'url(/assets/cites/ahmedabad.png)', maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} /> },
    { name: 'Idukki', icon: <div className="w-12 h-12 bg-current" style={{ maskImage: 'url(/assets/cites/chennai.png)', WebkitMaskImage: 'url(/assets/cites/chennai.png)', maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} /> },
    { name: 'Ernakulam', icon: <div className="w-12 h-12 bg-current" style={{ maskImage: 'url(/assets/cites/kolkata.png)', WebkitMaskImage: 'url(/assets/cites/kolkata.png)', maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} /> },
    { name: 'Thrissur', icon: <div className="w-12 h-12 bg-current" style={{ maskImage: 'url(/assets/cites/pune.png)', WebkitMaskImage: 'url(/assets/cites/pune.png)', maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} /> },
    { name: 'Kochi', icon: <div className="w-12 h-12 bg-current" style={{ maskImage: 'url(/assets/cites/kochi.png)', WebkitMaskImage: 'url(/assets/cites/kochi.png)', maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} /> },
    { name: 'Palakkad', icon: <div className="w-12 h-12 bg-current" style={{ maskImage: 'url(/assets/cites/goa.png)', WebkitMaskImage: 'url(/assets/cites/goa.png)', maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} /> },
    { name: 'Malappuram', icon: <div className="w-12 h-12 bg-current" style={{ maskImage: 'url(/assets/cites/chandigarh.png)', WebkitMaskImage: 'url(/assets/cites/chandigarh.png)', maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} /> },
    { name: 'Kozhikode', icon: <div className="w-12 h-12 bg-current" style={{ maskImage: 'url(/assets/cites/puducherry.png)', WebkitMaskImage: 'url(/assets/cites/puducherry.png)', maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} /> },
    { name: 'Kannur', icon: <div className="w-12 h-12 bg-current" style={{ maskImage: 'url(/assets/cites/puducherry.png)', WebkitMaskImage: 'url(/assets/cites/puducherry.png)', maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} /> },
    { name: 'Kasargod', icon: <div className="w-12 h-12 bg-current" style={{ maskImage: 'url(/assets/cites/puducherry.png)', WebkitMaskImage: 'url(/assets/cites/puducherry.png)', maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }} /> },

];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const CitySelectionModal = ({ isOpen, onClose, onSelect, currentCity }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [allCities, setAllCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const scrollRef = useRef(null);
    const alphabetRefs = useRef({});
    const modalRef = useRef(null);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;
            
            // Apply styles to prevent background scrolling
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
            
            // Store scroll position to restore later
            document.body.dataset.modalScrollY = scrollY;
            
            // Add a class to body for additional styling if needed
            document.body.classList.add('modal-open');
            
            return () => {
                // Restore scrolling when modal closes
                const storedScrollY = document.body.dataset.modalScrollY;
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
                
                if (storedScrollY) {
                    window.scrollTo(0, parseInt(storedScrollY));
                    delete document.body.dataset.modalScrollY;
                }
            };
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            const fetchCities = async () => {
                setLoading(true);
                try {
                    const cities = await apiCacheManager.getOrFetchCities(getCities);
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

    const popularCities = useMemo(() => {
        return POPULAR_CITY_CONFIG.map(config => ({
            ...config,
            isAvailable: allCities.some(city => city.toLowerCase() === config.name.toLowerCase())
        }));
    }, [allCities]);

    const remainingCitiesGrouped = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        const cities = allCities.length > 0 ? allCities : [];
        
        const filtered = query 
            ? cities.filter(city => city.toLowerCase().includes(query))
            : cities;

        const grouped = filtered.reduce((acc, city) => {
            const letter = city.charAt(0).toUpperCase();
            if (!acc[letter]) acc[letter] = [];
            acc[letter].push(city);
            return acc;
        }, {});

        // Sort letters and cities within letters
        return Object.keys(grouped).sort().reduce((acc, letter) => {
            acc[letter] = grouped[letter].sort();
            return acc;
        }, {});
    }, [searchQuery, allCities]);

    const scrollToLetter = (letter) => {
        const element = alphabetRefs.current[letter];
        if (element && scrollRef.current) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setIsDetecting(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    // Use OpenStreetMap Nominatim for free reverse geocoding
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    
                    const addr = data.address || {};
                    const detectedCity = addr.city || addr.town || addr.village || addr.suburb || addr.municipality;
                    const detectedDistrict = addr.state_district || addr.county || addr.district;
                    
                    // Priority 1: Match the specific city/town
                    if (detectedCity) {
                        const matchedCity = allCities.find(c => c.toLowerCase() === detectedCity.toLowerCase());
                        if (matchedCity) {
                            onSelect(matchedCity);
                            return;
                        }
                    }

                    // Priority 2: Match the district/county (e.g., Kalamassery -> Ernakulam/Kochi)
                    if (detectedDistrict) {
                        // Note: Some APIs return "Ernakulam District", we clean it
                        const cleanDistrict = detectedDistrict.replace(/ district/gi, '').trim();
                        const matchedCity = allCities.find(c => c.toLowerCase() === cleanDistrict.toLowerCase());
                        
                        // Special mapping for Kochi/Ernakulam since they are often interchangeable
                        const isKochiArea = cleanDistrict.toLowerCase().includes('ernakulam') || cleanDistrict.toLowerCase().includes('kochi');
                        const kochiCity = allCities.find(c => c.toLowerCase() === 'kochi');
                        
                        if (matchedCity) {
                            onSelect(matchedCity);
                            return;
                        } else if (isKochiArea && kochiCity) {
                            onSelect(kochiCity);
                            return;
                        }
                    }

                    // Priority 3: Final fallback - check the full display name string
                    const partiallyMatchedCity = allCities.find(c => data.display_name.toLowerCase().includes(c.toLowerCase()));
                    if (partiallyMatchedCity) {
                        onSelect(partiallyMatchedCity);
                    } else {
                        alert(`Detected ${detectedCity || detectedDistrict || 'location'}, but it's not a supported city yet.`);
                    }
                } catch (error) {
                    console.error("Location detection failed:", error);
                    alert("Error identifying your city.");
                } finally {
                    setIsDetecting(false);
                }
            },
            (error) => {
                const msg = error.code === 1 ? "Permission denied. Please enable location access." : "Location unavailable.";
                alert(msg);
                setIsDetecting(false);
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    };

    const handleClose = () => {
        if (currentCity) {
            onClose();
        }
    };

    const handleSelect = (city) => {
        onSelect(city);
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-4"
            ref={modalRef}
            data-city-modal="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={handleClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-[800px] bg-white md:rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 flex flex-col h-full md:h-auto md:max-h-[90vh]">
                
                {/* Search Header */}
                <div className="px-6 md:px-10 pt-8 pb-4">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-800">Select Location</h2>
                        {currentCity && (
                            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        )}
                    </div>

                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="Search city, area or locality"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                            autoFocus
                        />
                    </div>

                    <button 
                        onClick={handleDetectLocation}
                        disabled={isDetecting}
                        className="flex items-center gap-2 text-primary font-medium text-sm hover:opacity-80 transition-opacity mb-6 disabled:opacity-50"
                    >
                        {isDetecting ? (
                            <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                            <LocateFixed className="w-4 h-4" />
                        )}
                        <span>{isDetecting ? "Detecting..." : "Use Current Location"}</span>
                    </button>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-10 pb-10">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-gray-400">Loading cities...</p>
                        </div>
                    ) : (
                        <>
                            {/* Popular Cities */}
                            {!searchQuery && popularCities.length > 0 && (
                                <div className="mb-10">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Popular Cities</h3>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-y-8 gap-x-4">
                                        {popularCities.map((city) => (
                                            <button
                                                key={city.name}
                                                onClick={() => city.isAvailable && handleSelect(city.name)}
                                                disabled={!city.isAvailable}
                                                className={`flex flex-col items-center group transition-transform ${city.isAvailable ? 'active:scale-95 cursor-pointer' : 'cursor-default'}`}
                                            >
                                                <div className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-2xl mb-3 transition-all duration-300 
                                                    ${city.isAvailable 
                                                        ? (currentCity === city.name ? 'border-primary bg-primary/5 text-primary' : 'border-gray-50 bg-gray-50/50 text-gray-400 group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary/70')
                                                        : 'border-transparent bg-gray-50/30 text-gray-300 grayscale opacity-100'}
                                                `}>
                                                    {city.icon}
                                                </div>
                                                <span className={`text-[11px] md:text-xs font-semibold text-center transition-colors 
                                                    ${city.isAvailable 
                                                        ? (currentCity === city.name ? 'text-primary' : 'text-gray-600 group-hover:text-gray-900')
                                                        : 'text-gray-300'}
                                                `}>{city.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* All Cities Section */}
                            <div className="space-y-8">
                                <div className="flex flex-col gap-6">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">All Cities</h3>
                                    
                                    {/* Alpha Index */}
                                    {!searchQuery && (
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-bold text-primary/60 border-b border-gray-100 pb-4">
                                            {ALPHABET.map(letter => (
                                                <button 
                                                    key={letter} 
                                                    onClick={() => scrollToLetter(letter)}
                                                    className={`hover:text-primary transition-colors ${remainingCitiesGrouped[letter] ? 'opacity-100' : 'opacity-30 cursor-default'}`}
                                                    disabled={!remainingCitiesGrouped[letter]}
                                                >
                                                    {letter}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
                                    {Object.entries(remainingCitiesGrouped).map(([letter, cities]) => (
                                        <div key={letter} ref={el => alphabetRefs.current[letter] = el} className="contents md:block">
                                            {!searchQuery && (
                                                <div className="hidden md:block text-xs font-bold text-gray-300 mb-3 border-b border-gray-50 pb-1">{letter}</div>
                                            )}
                                            <div className="contents md:flex md:flex-col md:gap-2">
                                                {cities.map(city => (
                                                    <button
                                                        key={city}
                                                        onClick={() => handleSelect(city)}
                                                        className={`text-left py-2 text-[13px] font-medium transition-colors hover:text-primary ${currentCity === city ? 'text-primary' : 'text-gray-600'}`}
                                                    >
                                                        {city}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {Object.keys(remainingCitiesGrouped).length === 0 && (
                                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-gray-500 font-medium">Oh no! We couldn't find matches for "{searchQuery}"</p>
                                        <p className="text-xs text-gray-400 mt-2">Try searching for a different city or check spelling</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #CBD5E1;
                }
            `}</style>
        </div>
    );
};

export default CitySelectionModal;