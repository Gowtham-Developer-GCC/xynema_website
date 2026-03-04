import { FoodItem } from '../models/index.js';

export const getFoodItems = async () => {
    return [
        new FoodItem({
            id: 'f1',
            name: 'Classic Salted Popcorn',
            category: 'SNACKS',
            description: 'Large tub of freshly popped buttery salted popcorn.',
            price: 240,
            image: '🍿',
            available: true
        }),
        new FoodItem({
            id: 'f2',
            name: 'Caramel Popcorn',
            category: 'SNACKS',
            description: 'Sweet and crunchy popcorn coated in premium caramel.',
            price: 280,
            image: '🍯',
            available: true
        }),
        new FoodItem({
            id: 'f3',
            name: 'Cheese Nachos',
            category: 'SNACKS',
            description: 'Crispy corn tortillas served with warm liquid cheese and jalapeños.',
            price: 260,
            image: '🌮',
            available: true
        }),
        new FoodItem({
            id: 'f4',
            name: 'Coca Cola (500ml)',
            category: 'BEVERAGES',
            description: 'Ice-cold refreshing classic cola.',
            price: 120,
            image: '🥤',
            available: true
        }),
        new FoodItem({
            id: 'f5',
            name: 'Pepsi Black (500ml)',
            category: 'BEVERAGES',
            description: 'Zero sugar Pepsi with bold taste.',
            price: 120,
            image: '🥤',
            available: true
        }),
        new FoodItem({
            id: 'f6',
            name: 'Cold Coffee',
            category: 'BEVERAGES',
            description: 'Creamy and chilled whipped coffee.',
            price: 180,
            image: '🧋',
            available: true
        }),
        new FoodItem({
            id: 'f7',
            name: 'Couple Combo',
            category: 'COMBO',
            description: '2 Large Popcorns + 2 Large Drinks + 1 Nachos.',
            price: 650,
            image: '💑',
            available: true
        }),
        new FoodItem({
            id: 'f8',
            name: 'Solo Meal',
            category: 'COMBO',
            description: '1 Regular Popcorn + 1 Regular Drink.',
            price: 320,
            image: '🍱',
            available: true
        })
    ];
};

export const getMerchandise = async () => {
    return [
        {
            id: 'm1',
            name: '"Galaxy Runners" Premium T-Shirt',
            imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600',
            price: 799,
            category: 'Apparel',
            sellers: 3,
        },
        {
            id: 'm2',
            name: 'Interstellar Cinema Cap',
            imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=600',
            price: 449,
            category: 'Accessories',
            sellers: 5,
        },
        {
            id: 'm3',
            name: 'Collector Edition Movie Poster',
            imageUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7ea?auto=format&fit=crop&q=80&w=600',
            price: 299,
            category: 'Collectibles',
            sellers: 2,
        }
    ];
};

export const getMovieMerchandise = async (movieId) => {
    // Mock mapping movie IDs to merchandise
    const movieMerch = {
        'master': [
            { id: 'st-m1', name: 'Master "JD" Black T-Shirt', price: 699, sellers: 4, imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=600' },
            { id: 'st-m2', name: 'JD Signature Bracelet', price: 299, sellers: 2, imageUrl: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=600' },
            { id: 'st-m3', name: 'Kutti Story Notebook', price: 199, sellers: 5, imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be208389bf?auto=format&fit=crop&q=80&w=600' }
        ],
        'kalki': [
            { id: 'st-k1', name: 'Bujji : Remote control', price: 599, sellers: 3, imageUrl: 'https://images.unsplash.com/photo-1594787317554-d41133390779?auto=format&fit=crop&q=80&w=600' },
            { id: 'st-k2', name: 'Futuristic space glass', price: 399, sellers: 3, imageUrl: 'https://images.unsplash.com/photo-1511499767390-a8a197599624?auto=format&fit=crop&q=80&w=600' },
            { id: 'st-k3', name: 'Kalki printed Tshirt', price: 599, sellers: 3, imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600' }
        ]
    };

    return movieMerch[movieId?.toLowerCase()] || await getMerchandise();
};
