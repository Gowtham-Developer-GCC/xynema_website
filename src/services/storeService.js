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
            title: '"Galaxy Runners" Premium T-Shirt',
            imageUrl: 'https://picsum.photos/seed/merch1/300/300',
            price: '₹799',
            category: 'Apparel',
            amazonUrl: 'https://www.amazon.in/',
        },
        {
            id: 'm2',
            title: 'Interstellar Cinema Cap',
            imageUrl: 'https://picsum.photos/seed/merch2/300/300',
            price: '₹449',
            category: 'Accessories',
            amazonUrl: 'https://www.amazon.in/',
        },
        {
            id: 'm3',
            title: 'Collector Edition Movie Poster',
            imageUrl: 'https://picsum.photos/seed/merch3/300/300',
            price: '₹299',
            category: 'Collectibles',
            amazonUrl: 'https://www.amazon.in/',
        }
    ];
};
