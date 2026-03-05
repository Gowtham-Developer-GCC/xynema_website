import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, ArrowLeft, User, MessageSquare, ThumbsUp, ThumbsDown, Share2, ChevronRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import LoadingScreen from '../components/LoadingScreen';
import SEO from '../components/SEO';

const AllReviewsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { movies, latestMovies, loading: contextLoading } = useData();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!contextLoading) {
            const allAvailableMovies = [...(movies || []), ...(latestMovies || [])];
            const foundMovie = allAvailableMovies.find(m =>
                String(m.id) === String(id) || String(m._id) === String(id)
            );

            if (foundMovie) {
                setMovie(foundMovie);
                setLoading(false);
            } else {
                setError('Movie not found');
                setLoading(false);
            }
        }
    }, [id, movies, latestMovies, contextLoading]);

    if (loading) return <LoadingScreen message="Fetching reviews..." />;
    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <p className="text-red-500 font-bold mb-4">{error}</p>
            <button onClick={() => navigate(-1)} className="text-xynemaRose flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
        </div>
    );

    const reviews = movie?.reviews || [];

    return (
        <div className="min-h-screen bg-white pb-20">
            <SEO title={`Reviews - ${movie?.title}`} description={`Read what others have to say about ${movie?.title}`} />
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="w-12 shrink-0 -ml-2">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-50 rounded-full transition-colors flex items-center justify-center"
                            >
                                <ArrowLeft className="w-6 h-6 text-gray-900" />
                            </button>
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight">Ratings & Reviews</h1>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{movie?.title}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">

                {/* Reviews List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center">
                            <div className="w-12 shrink-0 flex items-center justify-start ml-0">
                                <MessageSquare className="w-5 h-5 text-xynemaRose" />
                            </div>
                            All User Reviews ({reviews.length})
                        </h2>
                    </div>

                    {reviews.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-6">
                            {reviews.map((review, idx) => (
                                <div key={idx} className="p-5 rounded-2xl border-2 border-black/10 hover:border-black transition-all">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden shrink-0">
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${review.user?.name || 'User'}&background=random&color=fff`}
                                                        alt="User"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm tracking-tight">{review.user?.name || 'Verified User'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                <span className="text-sm font-black text-gray-900">{review.rating}/10</span>
                                            </div>
                                        </div>
                                        <p className="text-black text-sm leading-relaxed font-medium">
                                            {review.comment || "Great movie, definitely worth watching!"}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-end pt-3 border-t border-gray-50 mt-3">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified Guest'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-12 border border-gray-100 border-dashed text-center">
                            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No reviews found for this movie</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AllReviewsPage;
