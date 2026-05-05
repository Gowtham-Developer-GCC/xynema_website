// ─────────────────────────────────────────────────────────────────
// parkService.js — Mock data for Amusement Parks (to be replaced with real API)
// ─────────────────────────────────────────────────────────────────

export const MOCK_PARKS = [
    {
        id: 'wonderla',
        slug: 'wonderla',
        name: 'Ullaasam @ Wonderla',
        shortName: 'Wonderla',
        type: 'Amusement Park',
        city: 'Kochi',
        location: 'Pallikkara, NH-17, Pallikkara P.O, Kochi, 683565',
        mapUrl: 'https://maps.google.com/?q=Wonderla+Kochi',
        rating: 4.6,
        reviewCount: 3241,
        price: 1299,
        originalPrice: 1599,
        discount: 20,
        openingHours: '10:00 AM – 6:00 PM',
        bestFor: 'Families & Kids',
        topTime: '10 yrs+',
        bestSeason: 'Monsoon - June',
        description: "Wonderla Kochi is a premier destination for thrill-seekers, seamlessly merging an stunning rides with captivating freshness. Covering over 58 acres, The park features world-class themed zones, such as the iconic 'Techno City' and the serene 'Lakeside Retreat'. Our main attraction: The Typhoon, a famous for its gravity-drops, providing an experience to all for the entertainment complex.",
        safetyText: 'Exhibits may not be shown',
        facilities: ['Changing Rooms', 'First Aid', 'Locker', 'Cafeteria'],
        images: [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Wonderla_Kochi_Entrance.jpg/1280px-Wonderla_Kochi_Entrance.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Wonderla_Kochi.JPG/1280px-Wonderla_Kochi.JPG',
        ],
        posterImage: 'https://images.unsplash.com/photo-1640622659439-5f82e1e42e37?w=800&q=80',
        bannerImage: 'https://images.unsplash.com/photo-1593642703055-4b72a547b589?w=1200&q=80',
        cardImage: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=600&q=80',
        topRides: [
            { name: 'Pendulum', image: 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?w=400&q=80', description: 'Soar over 120ft int to a horizontal offering mind-blowing aerial views' },
            { name: 'Techno', image: 'https://images.unsplash.com/photo-1567372234453-d7b500e6f3b2?w=400&q=80', description: 'Soar over 120ft int to a horizontal offering mind-blowing aerial views' },
            { name: 'Rain Ride', image: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=400&q=80', description: 'Soar over 120ft int to a horizontal offering mind-blowing aerial views' },
        ],
        gallery: [
            'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&q=80',
        ],
        storeItems: [
            { name: "Men's Mickey Slim Shirt", price: 799, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=80', reviews: 12 },
            { name: "Men's Blue Mickey Shirt 2019", price: 1250, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200&q=80', reviews: 18 },
            { name: "Multicolour Women Dress by Disney", price: 1190, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&q=80', reviews: 9 },
            { name: "Minnie", price: 799, image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=200&q=80', reviews: 5 },
        ],
        ticketTypes: [
            { id: 'adult', label: 'Adults', price: 1599, min: 0, description: '' },
            { id: 'student', label: 'Students (with ID cards)', price: 1199, min: 0, description: '' },
            { id: 'child', label: 'Children (below 15)', price: 999, min: 0, description: '' },
        ],
    },
    {
        id: 'funtura',
        slug: 'funtura',
        name: 'Funtura',
        shortName: 'Funtura',
        type: 'Indoor Theme Park',
        city: 'Kochi',
        location: 'Lulu Mall, Kochi, Kerala',
        mapUrl: 'https://maps.google.com/?q=Funtura+Kochi+Lulu+Mall',
        rating: 4.3,
        reviewCount: 1872,
        price: 1199,
        originalPrice: null,
        discount: null,
        openingHours: '11:00 AM – 9:00 PM',
        bestFor: 'Children',
        topTime: '3 yrs+',
        bestSeason: 'Year Round',
        description: 'Funtura is an indoor amusement park located inside LuLu Mall Kochi, offering a world of fun and excitement for kids and families. With over 35 rides and attractions, it is the perfect destination for a fun-filled day out.',
        safetyText: 'Exhibits may not be shown',
        facilities: ['Changing Rooms', 'First Aid', 'Locker', 'Cafeteria'],
        images: [],
        posterImage: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=800&q=80',
        bannerImage: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=80',
        cardImage: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&q=80',
        topRides: [
            { name: 'Mini Train', image: 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?w=400&q=80', description: 'Enjoy a fun train ride through the park' },
            { name: 'Bumper Cars', image: 'https://images.unsplash.com/photo-1567372234453-d7b500e6f3b2?w=400&q=80', description: 'Experience the thrill of bumper cars' },
            { name: 'Carousel', image: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=400&q=80', description: 'Classic merry-go-round fun' },
        ],
        gallery: [
            'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&q=80',
        ],
        storeItems: [],
        ticketTypes: [
            { id: 'adult', label: 'Adults', price: 1199, min: 0, description: '' },
            { id: 'child', label: 'Children (below 12)', price: 899, min: 0, description: '' },
        ],
    },
    {
        id: 'imagicaa',
        slug: 'imagicaa',
        name: 'Snow storm in Silver storm',
        shortName: 'Imagicaa',
        type: 'Water & Theme Park',
        city: 'Kochi',
        location: 'Silver Storm, Athirappilly, Thrissur, Kerala',
        mapUrl: 'https://maps.google.com/?q=Silver+Storm+Water+Theme+Park',
        rating: 4.4,
        reviewCount: 2109,
        price: 1299,
        originalPrice: null,
        discount: null,
        openingHours: '10:00 AM – 5:30 PM',
        bestFor: 'Water Lovers',
        topTime: 'All Ages',
        bestSeason: 'Summer',
        description: 'Silver Storm Water Theme Park in Athirappilly is one of Kerala\'s premier water parks, located near the famous Athirappilly waterfalls. The park offers thrilling water rides, wave pools, and family-friendly attractions.',
        safetyText: 'Exhibits may not be shown',
        facilities: ['Changing Rooms', 'First Aid', 'Locker', 'Cafeteria'],
        images: [],
        posterImage: 'https://images.unsplash.com/photo-1593478380930-8d3e6e3c9032?w=800&q=80',
        bannerImage: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1200&q=80',
        cardImage: 'https://images.unsplash.com/photo-1593478380930-8d3e6e3c9032?w=600&q=80',
        topRides: [
            { name: 'Wave Pool', image: 'https://images.unsplash.com/photo-1593478380930-8d3e6e3c9032?w=400&q=80', description: 'Enjoy the massive wave pool' },
            { name: 'Lazy River', image: 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?w=400&q=80', description: 'Relax on the lazy river' },
            { name: 'Speed Slides', image: 'https://images.unsplash.com/photo-1567372234453-d7b500e6f3b2?w=400&q=80', description: 'High-speed water slides' },
        ],
        gallery: [
            'https://images.unsplash.com/photo-1593478380930-8d3e6e3c9032?w=400&q=80',
        ],
        storeItems: [],
        ticketTypes: [
            { id: 'adult', label: 'Adults', price: 1299, min: 0, description: '' },
            { id: 'child', label: 'Children (below 12)', price: 999, min: 0, description: '' },
        ],
    },
    {
        id: 'waveland',
        slug: 'waveland',
        name: 'Wave land – The wavy land',
        shortName: 'Wave Land',
        type: 'Water Park',
        city: 'Kochi',
        location: 'Pallivasal, Munnar, Kerala',
        mapUrl: 'https://maps.google.com/?q=Wave+Land+Munnar',
        rating: 4.5,
        reviewCount: 1456,
        price: 1258,
        originalPrice: 1799,
        discount: 30,
        openingHours: '10:00 AM – 6:00 PM',
        bestFor: 'Families',
        topTime: 'All Ages',
        bestSeason: 'Summer – June',
        description: 'Wave Land is a world-class water and amusement park nestled in the beautiful hills of Munnar. With breathtaking views and exhilarating rides, it offers an unforgettable experience for the whole family.',
        safetyText: 'Exhibits may not be shown',
        facilities: ['Changing Rooms', 'First Aid', 'Locker', 'Cafeteria'],
        images: [],
        posterImage: 'https://images.unsplash.com/photo-1560009141-8f4b5ad25c21?w=800&q=80',
        bannerImage: 'https://images.unsplash.com/photo-1560009141-8f4b5ad25c21?w=1200&q=80',
        cardImage: 'https://images.unsplash.com/photo-1560009141-8f4b5ad25c21?w=600&q=80',
        topRides: [
            { name: 'Wave Rider', image: 'https://images.unsplash.com/photo-1560009141-8f4b5ad25c21?w=400&q=80', description: 'Ride the artificial waves' },
            { name: 'Aqua Loop', image: 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?w=400&q=80', description: 'Loop-the-loop water slide' },
            { name: 'Kids Zone', image: 'https://images.unsplash.com/photo-1567372234453-d7b500e6f3b2?w=400&q=80', description: 'Safe zone for little ones' },
        ],
        gallery: [
            'https://images.unsplash.com/photo-1560009141-8f4b5ad25c21?w=400&q=80',
        ],
        storeItems: [],
        ticketTypes: [
            { id: 'adult', label: 'Adults', price: 1258, min: 0, description: '' },
            { id: 'student', label: 'Students (with ID cards)', price: 999, min: 0, description: '' },
            { id: 'child', label: 'Children (below 12)', price: 799, min: 0, description: '' },
        ],
    },
];

// Simulate async API call
export const getAllParks = async () => {
    await new Promise(r => setTimeout(r, 200));
    return MOCK_PARKS;
};

export const getParkBySlug = async (slug) => {
    await new Promise(r => setTimeout(r, 150));
    return MOCK_PARKS.find(p => p.slug === slug) || null;
};

// Parks the user has "visited" — shown in "Visit again" row
// In a real app this would come from user booking history
export const getVisitedParks = async () => {
    await new Promise(r => setTimeout(r, 100));
    return MOCK_PARKS.slice(0, 2);
};
