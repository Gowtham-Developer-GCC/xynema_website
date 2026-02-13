/**
 * SEO & Meta Tags Configuration
 * Enterprise-grade SEO implementation
 */

export const seoConfig = {
  // Default meta tags
  defaults: {
    title: 'Xynema - Premium Movie Booking Platform',
    description: 'Book premium movie tickets with ease. Explore upcoming movies, select your seats, and enjoy cinema experiences like never before.',
    keywords: 'movie booking, cinema tickets, online movie reservation, movie theater',
    image: 'https://xynema.com/og-image.png',
    url: 'https://xynema.com',
  },

  // Page-specific SEO
  pages: {
    home: {
      title: 'Xynema - Premium Movie Booking Platform',
      description: 'Discover and book the latest movies at your favorite theaters.',
      keywords: 'movie booking, cinema, tickets, showtimes',
      canonical: 'https://xynema.com',
    },
    movies: {
      title: 'Upcoming Movies - Xynema',
      description: 'Browse upcoming movies and make your reservation today.',
      keywords: 'upcoming movies, new releases, movie showtimes',
      canonical: 'https://xynema.com/movies',
    },
    booking: {
      title: 'Book Movie Tickets - Xynema',
      description: 'Select your movie, theater, time, and seats. Complete booking in minutes.',
      keywords: 'book tickets, seat selection, movie reservation',
      noindex: false,
    },
    profile: {
      title: 'My Profile - Xynema',
      description: 'Manage your account and view booking history.',
      noindex: true,
    },
  },

  // Open Graph Configuration
  openGraph: {
    type: 'website',
    siteName: 'Xynema',
    locale: 'en_US',
  },

  // Twitter Card Configuration
  twitterCard: {
    card: 'summary_large_image',
    creator: '@xynema',
    site: '@xynema',
  },

  // JSON-LD Schema
  schema: {
    organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Xynema',
      url: 'https://xynema.com',
      logo: 'https://xynema.com/logo.png',
      sameAs: [
        'https://twitter.com/xynema',
        'https://facebook.com/xynema',
        'https://instagram.com/xynema',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        telephone: '+1-800-123-4567',
        email: 'support@xynema.com',
      },
    },

    webSite: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      url: 'https://xynema.com',
      name: 'Xynema',
      searchAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://xynema.com/search?q={search_term_string}',
        },
        query: 'required name=search_term_string',
      },
    },

    movie: {
      '@context': 'https://schema.org',
      '@type': 'Movie',
      // Dynamic properties to be filled
      name: '',
      description: '',
      image: '',
      offers: {
        '@type': 'AggregateOffer',
        availability: 'https://schema.org/InStock',
      },
    },

    breadcrumb: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      // Dynamic items
      itemListElement: [],
    },
  },

  // Robots Configuration
  robots: {
    development: 'noindex, nofollow',
    production: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  },

  // Sitemap Configuration
  sitemapPaths: [
    '/',
    '/explore',
    '/store',
    '/privacy',
    '/terms',
    '/bookings',
    '/profile',
  ],

  // Robots.txt Configuration
  robotsTxt: `
    User-agent: *
    Allow: /
    Disallow: /admin
    Disallow: /api
    Disallow: /private
    
    Sitemap: https://xynema.com/sitemap.xml
    
    User-agent: Googlebot
    Allow: /
    
    User-agent: Bingbot
    Allow: /
  `,
};

/**
 * Generate Meta Tags for Page
 */
export const generateMetaTags = (pageConfig) => {
  const config = { ...seoConfig.defaults, ...pageConfig };

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    canonical: config.canonical || seoConfig.defaults.url,
    ogType: config.ogType || seoConfig.openGraph.type,
    ogTitle: config.ogTitle || config.title,
    ogDescription: config.ogDescription || config.description,
    ogImage: config.ogImage || config.image,
    ogUrl: config.ogUrl || seoConfig.defaults.url,
    twitterCard: seoConfig.twitterCard.card,
    twitterCreator: seoConfig.twitterCard.creator,
    robots: process.env.VITE_ENV === 'PRODUCTION'
      ? seoConfig.robots.production
      : seoConfig.robots.development,
  };
};

/**
 * Structured Data Helper
 */
export const getStructuredData = (type, data = {}) => {
  const baseSchema = seoConfig.schema[type];
  
  if (!baseSchema) {
    console.warn(`Schema type "${type}" not found`);
    return null;
  }

  return {
    ...baseSchema,
    ...data,
  };
};

/**
 * Generate Breadcrumb Schema
 */
export const generateBreadcrumb = (items) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

/**
 * SEO Utilities
 */
export const seoUtils = {
  /**
   * Sanitize text for meta tags
   */
  sanitizeText: (text, maxLength = 160) => {
    if (!text) return '';
    const clean = text
      .replace(/<[^>]*>/g, '')
      .replace(/&[a-z]+;/gi, '')
      .trim();
    return clean.length > maxLength
      ? clean.substring(0, maxLength - 3) + '...'
      : clean;
  },

  /**
   * Generate slug from text
   */
  generateSlug: (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  },

  /**
   * Check SEO score
   */
  checkSEOScore: (pageConfig) => {
    let score = 0;
    const issues = [];

    if (pageConfig.title && pageConfig.title.length >= 30 && pageConfig.title.length <= 60) {
      score += 20;
    } else {
      issues.push('Title length should be 30-60 characters');
    }

    if (pageConfig.description && pageConfig.description.length >= 120 && pageConfig.description.length <= 160) {
      score += 20;
    } else {
      issues.push('Meta description should be 120-160 characters');
    }

    if (pageConfig.keywords) {
      score += 15;
    } else {
      issues.push('Keywords should be defined');
    }

    if (pageConfig.image) {
      score += 15;
    } else {
      issues.push('OG image should be provided');
    }

    if (pageConfig.canonical) {
      score += 10;
    }

    if (pageConfig.structuredData) {
      score += 20;
    } else {
      issues.push('Structured data (JSON-LD) should be included');
    }

    return { score, issues, passed: score >= 80 };
  },

  /**
   * Generate meta tag HTML string
   */
  generateMetaTagHTML: (config) => {
    const tags = [];

    tags.push(`<title>${config.title}</title>`);
    tags.push(`<meta name="description" content="${config.description}">`);
    tags.push(`<meta name="keywords" content="${config.keywords}">`);
    tags.push(`<meta name="robots" content="${config.robots}">`);
    tags.push(`<link rel="canonical" href="${config.canonical}">`);

    // Open Graph
    tags.push(`<meta property="og:type" content="${config.ogType}">`);
    tags.push(`<meta property="og:title" content="${config.ogTitle}">`);
    tags.push(`<meta property="og:description" content="${config.ogDescription}">`);
    tags.push(`<meta property="og:image" content="${config.ogImage}">`);
    tags.push(`<meta property="og:url" content="${config.ogUrl}">`);

    // Twitter Card
    tags.push(`<meta name="twitter:card" content="${config.twitterCard}">`);
    tags.push(`<meta name="twitter:creator" content="${config.twitterCreator}">`);

    return tags.join('\n');
  },
};

export default {
  seoConfig,
  generateMetaTags,
  getStructuredData,
  generateBreadcrumb,
  seoUtils,
};
