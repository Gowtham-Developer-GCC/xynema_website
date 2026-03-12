import { memo } from 'react';
import { Link } from 'react-router-dom';
import { optimizeImage } from '../utils/helpers';

const StoreCard = memo(({ item }) => {
    return (
        <div className="bg-white dark:bg-[#1a1c23] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col h-full transition-all duration-300 group cursor-pointer">
            <Link to={`/store/${item.id}`} className="block w-full">
                <div className="relative aspect-square overflow-hidden bg-white">
                    <img
                        src={optimizeImage(item.imageUrl, { width: 600, quality: 95 }) || 'https://via.placeholder.com/600x600?text=No+Image'}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 ease-in-out"
                    />
                </div>
            </Link>
            <div className="p-5 flex flex-col flex-grow bg-white dark:bg-[#1a1c23] border-t border-gray-50 dark:border-gray-800">
                <Link to={`/store/${item.id}`} className="mb-2 block">
                    <h3 className="font-bold text-gray-900 dark:text-white text-[1.05rem] leading-snug truncate transition-colors font-display uppercase group-hover:text-primary">
                        {item.name}
                    </h3>
                </Link>
                <div className="mt-auto flex items-end justify-between pt-2">
                    <div className="flex flex-col">
                        <span className="font-bold text-primary dark:text-primary text-lg">
                            ₹{item.price.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-black text-[#6B7280] dark:text-gray-500 mt-0.5 uppercase tracking-widest font-display">
                            onwards
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm group-hover:border-primary/20 transition-colors">
                        <div className="space-y-1">
                            <div className="w-3.5 h-[2px] bg-primary/60 rounded-full"></div>
                            <div className="w-2.5 h-[2px] bg-primary/60 rounded-full"></div>
                            <div className="w-3.5 h-[2px] bg-primary/60 rounded-full"></div>
                        </div>
                        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight font-display">{item.sellers} sellers</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default StoreCard;
