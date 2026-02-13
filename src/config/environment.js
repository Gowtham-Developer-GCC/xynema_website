/**
 * Environment Configuration Manager
 * Provides centralized access to all environment variables
 * Aligned with Flutter app's environment.dart pattern
 */

class Environment {
    static get apiBaseUrl() {
        return import.meta.env.VITE_API_BASE_URL;
    }

    static get googleClientId() {
        return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    }

    static get appName() {
        return import.meta.env.VITE_APP_NAME || 'Xynema';
    }

    static get environment() {
        return import.meta.env.VITE_ENV || 'DEVELOPMENT';
    }

    static get isDevelopment() {
        return this.environment === 'DEVELOPMENT' || import.meta.env.DEV;
    }

    static get isProduction() {
        return this.environment === 'PRODUCTION' || import.meta.env.PROD;
    }

    static get logLevel() {
        return import.meta.env.VITE_LOG_LEVEL || 'debug';
    }

    static get sentryDsn() {
        return import.meta.env.VITE_SENTRY_DSN || '';
    }

    // static get analyticsId() {
    //     return import.meta.env.VITE_ANALYTICS_ID || '';
    // }

    /**
     * Validate configuration on app startup
     */
    static validate() {
        const errors = [];

        if (!this.apiBaseUrl) {
            errors.push('VITE_API_BASE_URL is not configured');
        }

        if (!this.googleClientId) {
            errors.push('VITE_GOOGLE_CLIENT_ID is not configured');
        }

        if (errors.length > 0) {
            console.error('Configuration Errors:', errors);
            if (this.isProduction) {
                throw new Error('Application configuration is invalid');
            }
        }

        return errors.length === 0;
    }

    /**
     * Get all configuration as object (for debugging)
     */
    static getConfig() {
        return {
            apiBaseUrl: this.apiBaseUrl,
            googleClientId: this.googleClientId,
            appName: this.appName,
            environment: this.environment,
            isDevelopment: this.isDevelopment,
            isProduction: this.isProduction,
            logLevel: this.logLevel,
            sentryDsn: this.sentryDsn,
            // analyticsId: this.analyticsId,
        };
    }
}

export default Environment;
