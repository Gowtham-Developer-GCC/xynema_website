import React from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotFoundState = ({
    title = "Content Not Found",
    message = "We couldn't find what you're looking for.",
    buttonText = "Back to Home",
    linkTo = "/"
}) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6 bg-white">
            <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 mb-2">
                <Search className="w-10 h-10 text-gray-300" />
            </div>

            <div className="max-w-md space-y-3">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
                <p className="text-gray-500 font-medium">{message}</p>
            </div>

            <Link
                to={linkTo}
                className="inline-block px-8 py-3.5 rounded-xl bg-xynemaRose text-white font-bold text-sm shadow-xl shadow-xynemaRose/20 hover:bg-primary transition-colors active:scale-95"
            >
                {buttonText}
            </Link>
        </div>
    );
};

export default NotFoundState;
