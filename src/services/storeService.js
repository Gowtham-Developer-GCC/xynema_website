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
        id: "store-1",
        name: "Black Shirt",
        price: 1499,
        sellers: 6,
        imageUrl: "https://www.richlook.in/cdn/shop/files/R203194_1_1800x1800.jpg?v=1765006151"
    },
    {
        id: "store-2",
        name: "Tree Poster Frame",
        price: 5599,
        sellers: 2,
        imageUrl: "https://m.media-amazon.com/images/I/715gVnLjQfL.jpg"
    },
    {
        id: "store-3",
        name: "Avengers toy set",
        price: 499,
        sellers: 4,
        imageUrl: "https://crazygifts.in/cdn/shop/files/WhatsAppImage2022-10-28at6.46.03PM.jpg?v=1721040882&width=1445"
    },
    {
        id: "store-4",
        name: "Dhurandhar Leather Jacket",
        price: 2599,
        sellers: 1,
        imageUrl: "https://img.freepik.com/premium-photo/brown-leather-jacket-isolated-grey-background-mockup-image_985688-10938.jpg?semt=ais_hybrid&w=740&q=80"
    },
    {
        id: "store-5",
        name: "Master JD Bracelet",
        price: 8999,
        sellers: 1,
        imageUrl: "https://www.vdmjewellery.co.za/wp-content/uploads/2024/11/vhj.jpg"
    }
    ];
};

export const getMovieMerchandise = async (movieId) => {
    // Mock mapping movie IDs to merchandise
    const movieMerch = {
        'master': [
            { id: 'st-m1', name: 'Master "JD" Black T-Shirt', price: 699, sellers: 4, imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=95&w=800' },
            { id: 'st-m2', name: 'JD Signature Bracelet', price: 299, sellers: 2, imageUrl: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=95&w=800' },
            { id: 'st-m3', name: 'Kutti Story Notebook', price: 199, sellers: 5, imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be208389bf?auto=format&fit=crop&q=95&w=800' }
        ],
        'kalki': [
            { id: 'st-k1', name: 'Bujji : Remote control', price: 599, sellers: 3, imageUrl: 'https://images.unsplash.com/photo-1594787317554-d41133390779?auto=format&fit=crop&q=95&w=800' },
            { id: 'st-k2', name: 'Futuristic space glass', price: 399, sellers: 3, imageUrl: 'https://images.unsplash.com/photo-1511499767390-a8a197599624?auto=format&fit=crop&q=95&w=800' },
            { id: 'st-k3', name: 'Kalki printed Tshirt', price: 599, sellers: 3, imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=95&w=800' }
        ]
    };

    return movieMerch[movieId?.toLowerCase()] || await getMerchandise();
};
