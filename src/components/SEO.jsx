import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, image, url, type = 'website' }) => {
    const siteTitle = 'Xynema - Premium Movie & Events';
    const siteDescription = 'Experience pure cinema with Xynema. Book tickets for the latest movies and events with our premium light theme experience.';
    const siteUrl = window.location.origin;
    const siteImage = `${siteUrl}/og-image.jpg`; // Placeholder for social sharing image

    const seoTitle = title ? `${title} | Xynema` : siteTitle;
    const seoDescription = description || siteDescription;
    const seoImage = image || siteImage;
    const seoUrl = url || window.location.href;

    return (
        <Helmet>
            {/* Standard Meta Tags */}
            <title>{seoTitle}</title>
            <meta name="description" content={seoDescription} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={seoUrl} />
            <meta property="og:title" content={seoTitle} />
            <meta property="og:description" content={seoDescription} />
            <meta property="og:image" content={seoImage} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={seoUrl} />
            <meta name="twitter:title" content={seoTitle} />
            <meta name="twitter:description" content={seoDescription} />
            <meta name="twitter:image" content={seoImage} />

            {/* Additional Meta Tags */}
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
            <meta name="theme-color" content="#00296b" />
        </Helmet>
    );
};

export default SEO;
