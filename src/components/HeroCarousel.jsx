import { memo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { optimizeImage } from '../utils/helpers';

const HeroCarousel = memo(({ movies, isMobile }) => {
    if (!movies?.length) return null;

    return (
        <section className="w-full relative px-0 sm:px-2">
            <style>
                {`
                .hero-swiper {
                    padding-bottom: 3rem !important; /* Space for pagination */
                }
                .hero-swiper .swiper-pagination-bullet {
                    width: 8px;
                    height: 8px;
                    background: #cbd5e1;
                    opacity: 1;
                    border-radius: 4px;
                    transition: all 0.3s ease;
                }
                .hero-swiper .swiper-pagination-bullet-active {
                    width: 64px;
                    background: #FD4960;
                }
                .dark .hero-swiper .swiper-pagination-bullet {
                    background: #475569;
                }
                .dark .hero-swiper .swiper-pagination-bullet-active {
                    background: #94a3b8;
                }
                `}
            </style>
            <Swiper
                modules={[Pagination, Autoplay, Navigation]}
                spaceBetween={12}
                slidesPerView={1}
                loop={movies.length > 1}
                speed={800}
                grabCursor={true}
                autoplay={{
                    delay: 1500,
                    disableOnInteraction: false,
                }}
                pagination={{
                    clickable: true,
                    dynamicBullets: false,
                }}
                watchSlidesProgress={true}
                observer={true}
                observeParents={true}
                breakpoints={{
                    320: { slidesPerView: 1, spaceBetween: 10 },
                    640: { slidesPerView: 1, spaceBetween: 16 },
                    1024: { slidesPerView: 1, spaceBetween: 24 },
                }}
                className={`hero-swiper w-full max-w-[1800px] mx-auto ${isMobile ? 'aspect-[5/2]' : 'aspect-[21/4]'}`}
            >
                {movies.map((movie, index) => {
                    const linkUrl = movie.linkUrl || (movie.slug || movie.id ? `/movie/${movie.slug || movie.id}` : '#');
                    const mobileImg = movie.mobileBannerImage?.url || movie.mobileBannerImage;
                    const desktopImg = movie.bannerImageUrl?.url || movie.bannerImageUrl;
                    const imageUrl = isMobile ? (mobileImg || desktopImg) : desktopImg;

                    return (
                        <SwiperSlide key={`${movie.id || index}-${index}`} className="!h-auto">
                            <div className="w-full aspect-[5/2] md:aspect-[21/4] sm:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
                                <a
                                    href={linkUrl}
                                    className="block w-full h-full cursor-pointer"
                                    onClick={(e) => {
                                        if (linkUrl === '#') e.preventDefault();
                                    }}
                                >
                                    <img
                                        src={optimizeImage(imageUrl, { width: 1400, quality: 85 }) || 'https://via.placeholder.com/1400x400?text=No+Image'}
                                        alt={movie.title || "Banner"}
                                        className="w-full h-full object-cover object-center"
                                        loading="eager"
                                        fetchpriority="high"
                                    />
                                </a>
                            </div>
                        </SwiperSlide>
                    );
                })}
            </Swiper>
        </section>
    );
});

HeroCarousel.displayName = 'HeroCarousel';

export default HeroCarousel;
