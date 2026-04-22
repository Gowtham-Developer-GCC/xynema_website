import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
    'English (US)': {
        // Navbar
        movies: 'Movies',
        events: 'Events',
        sports: 'Sports',
        stream: 'Stream',
        for_you: 'For You',
        search_placeholder: 'Search for Movies, Events, and more...',
        login: 'Login',
        sign_up: 'Sign Up',
        select_city: 'Select City',

        // Account Settings
        account_settings: 'Account & Settings',
        profile_info: 'Profile Info',
        security: 'Security',
        preferences: 'Preferences',
        privacy: 'Privacy',
        quick_settings: 'Quick Settings',
        dark_mode: 'Dark Mode',
        general_preferences: 'General Preferences',
        customize_experience: 'Customize your experience within the app',
        interface_language: 'Interface Language',
        newsletter_subscription: 'Newsletter Subscription',
        get_weekly_recommendations: 'Get weekly movie recommendations',
        save_changes: 'Save Changes',
        cancel: 'Cancel',
        personal_info: 'Personal Information',
        update_profile: 'Update your basic profile and contact details',
        full_name: 'Full Name',
        email_address: 'Email Address',
        phone_number: 'Phone Number',
        region: 'Region',
        account_security: 'Account Security',
        manage_password: 'Manage your password and authentication methods',
        current_password: 'Current Password',
        new_password: 'New Password',
        show_passwords: 'Show Passwords',
        hide_passwords: 'Hide Passwords',
        two_factor: 'Two-Factor Authentication',
        enhance_safety: 'Enhance your account safety',
        configure: 'Configure',
        privacy_data: 'Privacy & Data',
        manage_data: 'Manage how your data is used and shared',
        public_profile: 'Public Profile',
        allow_reviews: 'Allow others to see your reviews',
        delete_account: 'Delete Account',
        remove_data: 'Permanently remove your Xynema data',
        profile_updated: 'Profile Updated',

        // Footer
        about_us: 'About Us',
        help_center: 'Help Center',
        terms_policies: 'Terms & Policies',
        terms_service: 'Terms of Service',
        privacy_policy: 'Privacy Policy',
        refund_policy: 'Refund Policy',
        copyright: '© 2026 Xynema. All rights reserved.',
        made_with: 'Made with',
        in_india: 'in India',
        accept_payments: 'We accept:',
        download_app: 'Download App',
        now_showing: 'Now Showing',
        coming_soon: 'Coming Soon',
        public_events: 'Public Events',
        private_hosting: 'Private Hosting',
        company: 'Company',
        care_email: 'care@xynema.in',
        support_call: '0484-4531182',

        // HomePage
        recommended_for_you: 'Recommended for you',
        trending_events: 'Trending events',
        official_merchandise: 'Official merchandise',
        visit_store: 'Visit Store',
        loading_movies: 'Finding the best movies for you...',

        // Sidebar & Extra
        my_tickets: 'My tickets',
        payment_methods: 'Payment methods',
        offers_promos: 'Offers & Promos',
        notifications: 'Notifications',
        logout: 'Log out',
        welcome: 'Welcome!',
        footer_tagline: 'Your ultimate destination for booking movie tickets, discovering events, and streaming premium content.'
    },
    'Malayalam': {
        // Navbar
        movies: 'സിനിമകൾ',
        events: 'പരിപാടികൾ',
        sports: 'കായികം',
        stream: 'സ്ട്രീം',
        for_you: 'നിങ്ങൾക്കായി',
        search_placeholder: 'സിനിമകൾ, പരിപാടികൾ എന്നിവ തിരയുക...',
        login: 'ലോഗിൻ',
        sign_up: 'സൈൻ അപ്പ്',
        select_city: 'നഗരം തിരഞ്ഞെടുക്കുക',

        // Account Settings
        account_settings: 'അക്കൗണ്ട് & ക്രമീകരണങ്ങൾ',
        profile_info: 'പ്രൊഫൈൽ വിവരം',
        security: 'സുരക്ഷ',
        preferences: 'മുൻഗണനകൾ',
        privacy: 'സ്വകാര്യത',
        quick_settings: 'ദ്രുത ക്രമീകരണങ്ങൾ',
        dark_mode: 'ഡാർക്ക് മോഡ്',
        general_preferences: 'പൊതുവായ മുൻഗണനകൾ',
        customize_experience: 'ആപ്പിനുള്ളിലെ നിങ്ങളുടെ അനുഭവം ഇഷ്ടാനുസൃതമാക്കുക',
        interface_language: 'ഭാഷ',
        newsletter_subscription: 'വാർത്താക്കുറിപ്പ് സബ്‌സ്‌ക്രിപ്‌ഷൻ',
        get_weekly_recommendations: 'പ്രതിവാര സിനിമ ശുപാർശകൾ നേടുക',
        save_changes: 'മാറ്റങ്ങൾ സംരക്ഷിക്കുക',
        cancel: 'റദ്ദാക്കുക',
        personal_info: 'വ്യക്തിഗത വിവരങ്ങൾ',
        update_profile: 'നിങ്ങളുടെ അടിസ്ഥാന പ്രൊഫൈലും കോൺടാക്റ്റ് വിശദാംശങ്ങളും അപ്‌ഡേറ്റ് ചെയ്യുക',
        full_name: 'മുഴുവൻ പേര്',
        email_address: 'ഇമെയിൽ वിലാസം',
        phone_number: 'ഫോൺ നമ്പർ',
        region: 'പ്രദേശം',
        account_security: 'അക്കൗണ്ട് സുരക്ഷ',
        manage_password: 'നിങ്ങളുടെ പാസ്‌വേഡും പ്രാമാണീകരണ രീതികളും നിയന്ത്രിക്കുക',
        current_password: 'നിലവിലെ പാസ്‌വേഡ്',
        new_password: 'പുതിയ പാസ്‌വേഡ്',
        show_passwords: 'പാസ്‌വേഡുകൾ കാണിക്കുക',
        hide_passwords: 'പാസ്‌വേഡുകൾ മറയ്ക്കുക',
        two_factor: 'ടു-ഫാക്ടർ ഓതന്റിക്കേഷൻ',
        enhance_safety: 'നിങ്ങളുടെ അക്കൗണ്ട് സുരക്ഷ മെച്ചപ്പെടുത്തുക',
        configure: 'കോൺഫിഗർ ചെയ്യുക',
        privacy_data: 'സ്വകാര്യത & ഡാറ്റ',
        manage_data: 'നിങ്ങളുടെ ഡാറ്റ എങ്ങനെ ഉപയോഗിക്കുന്നുവെന്നും പങ്കിടുന്നുവെന്നും നിയന്ത്രിക്കുക',
        public_profile: 'പബ്ലിക് പ്രൊഫൈൽ',
        allow_reviews: 'മറ്റുള്ളവരെ നിങ്ങളുടെ റിവ്യൂകൾ കാണാൻ അനുവദിക്കുക',
        delete_account: 'അക്കൗണ്ട് ഇല്ലാതാക്കുക',
        remove_data: 'നിങ്ങളുടെ Xynema ഡാറ്റ ശാശ്വതമായി നീക്കം ചെയ്യുക',
        profile_updated: 'പ്രൊഫൈൽ അപ്ഡേറ്റ് ചെയ്തു',

        // Footer
        about_us: 'ഞങ്ങളെക്കുറിച്ച്',
        help_center: 'സഹായ കേന്ദ്രം',
        terms_policies: 'നിബന്ധനകളും നയങ്ങളും',
        terms_service: 'സേവന നിബന്ധനകൾ',
        privacy_policy: 'സ്വകാര്യതാ നയം',
        refund_policy: 'റീഫണ്ട് നയം',
        copyright: '© 2026 Xynema. എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം.',
        made_with: 'നിർമ്മിച്ചത്',
        in_india: 'ഇന്ത്യയിൽ',
        accept_payments: 'ഞങ്ങൾ സ്വീകരിക്കുന്നു:',
        download_app: 'ആപ്പ് ഡൗൺലോഡ് ചെയ്യുക',
        now_showing: 'ഇപ്പോൾ പ്രദർശിപ്പിക്കുന്നു',
        coming_soon: 'ഉടൻ വരുന്നു',
        public_events: 'പൊതു പരിപാടികൾ',
        private_hosting: 'സ്വകാര്യ ഹോസ്റ്റിംഗ്',
        company: 'കമ്പനി',
        care_email: 'care@xynema.in',
        support_call: '0484-4531182',

        // HomePage
        recommended_for_you: 'നിങ്ങൾക്കായി ശുപാർശ ചെയ്യുന്നത്',
        trending_events: 'ട്രെൻഡിംഗ് പരിപാടികൾ',
        official_merchandise: 'ഔദ്യോഗിക മർച്ചൻഡൈസ്',
        visit_store: 'സ്റ്റോർ സന്ദർശിക്കുക',
        loading_movies: 'നിങ്ങൾക്കായി മികച്ച സിനിമകൾ കണ്ടെത്തുന്നു...',

        // Sidebar & Extra
        my_tickets: 'എന്റെ ടിക്കറ്റുകൾ',
        payment_methods: 'പേയ്‌മെന്റ് രീതികൾ',
        offers_promos: 'ഓഫറുകളും പ്രൊമോകളും',
        notifications: 'അറിയിപ്പുകൾ',
        logout: 'ലോഗൗട്ട്',
        welcome: 'സ്വാഗതം!',
        footer_tagline: 'സിനിമ ടിക്കറ്റുകൾ ബുക്ക് ചെയ്യാനും പരിപാടികൾ കണ്ടെത്താനും പ്രീമിയം ഉള്ളടക്കം സ്ട്രീം ചെയ്യാനുമുള്ള നിങ്ങളുടെ ആത്യന്തിക ലക്ഷ്യസ്ഥാനം.'
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('app_language') || 'English (US)';
    });

    useEffect(() => {
        localStorage.setItem('app_language', language);
        // Force document title or other global updates if needed
    }, [language]);

    const t = (key) => {
        return translations[language]?.[key] || translations['English (US)'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
