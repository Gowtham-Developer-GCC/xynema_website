import { memo } from 'react';
import { Link } from 'react-router-dom';
import { optimizeImage } from '../utils/helpers';

const StoreCard = memo(({ item }) => {
    return (
        <div className="bg-white dark:bg-[#1a1c23] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:-translate-y-2 group cursor-pointer">
            <Link to={`/store/${item.id}`} className="block w-full">
                <div className="relative aspect-square overflow-hidden bg-[#f9f9f9] dark:bg-gray-900/50 p-6 flex items-center justify-center">
                    <img
                        src={optimizeImage(item.imageUrl, { width: 500, quality: 85 }) || 'https://via.placeholder.com/500x500?text=No+Image'}
                        alt={item.name}
                        loading="lazy"
                        className="max-w-full max-h-full object-contain transition-transform duration-700 ease-in-out group-hover:scale-110 drop-shadow-xl"
                    />
                </div>
            </Link>
            <div className="p-5 flex flex-col flex-grow bg-white dark:bg-[#1a1c23] border-t border-gray-50 dark:border-gray-800">
                <Link to={`/store/${item.id}`} className="mb-2 block">
                    <h3 className="font-bold text-gray-800 dark:text-white text-base md:text-[17px] leading-snug truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.name}
                    </h3>
                </Link>
                <div className="mt-auto flex items-end justify-between pt-2">
                    <div className="flex flex-col">
                        <span className="font-black text-gray-900 dark:text-gray-100 text-xl tracking-tight">
                            ₹{item.price.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-widest">
                            onwards
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50/80 dark:bg-gray-800/80 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="space-y-1 opacity-60">
                            <div className="w-3.5 h-[2px] bg-gray-600 dark:bg-gray-400 rounded-full"></div>
                            <div className="w-2.5 h-[2px] bg-gray-600 dark:bg-gray-400 rounded-full"></div>
                            <div className="w-3.5 h-[2px] bg-gray-600 dark:bg-gray-400 rounded-full"></div>
                        </div>
                        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight">{item.sellers} sellers</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default StoreCard;
