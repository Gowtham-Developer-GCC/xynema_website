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
            <div className="p-3 sm:p-5 flex flex-col flex-grow bg-white dark:bg-[#1a1c23] border-t border-gray-50 dark:border-gray-800">
                <Link to={`/store/${item.id}`} className="mb-2 block">
                    <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-[1.05rem] leading-snug truncate transition-colors font-roboto group-hover:text-primary">
                        {item.name}
                    </h3>
                </Link>
                <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                    <div className="flex flex-col min-w-0 flex-shrink">
                        <span className="font-black text-primary dark:text-primary text-[14px] sm:text-lg truncate">
                            ₹{item.price.toLocaleString()}
                        </span>
                        <span className="text-[8px] sm:text-[10px] font-black text-[#6B7280] dark:text-gray-500 mt-0.5 tracking-widest font-roboto uppercase truncate">
                            onwards
                        </span>
                    </div>
                    <div className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm group-active:scale-95 transition-all duration-300">
                        <span className="text-[9px] sm:text-[12px] font-bold text-white group-hover:text-white font-roboto transition-colors duration-300 whitespace-nowrap">Buy Now</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default StoreCard;
