import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f1115] transition-colors duration-300">
            <SEO
                title="Privacy Policy | XYNEMA"
                description="Read XYNEMA's privacy policy to understand how we protect and manage your data."
            />

            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-white dark:bg-[#151924] border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-500 hover:text-primary"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="ml-4 font-bold text-sm uppercase tracking-widest text-primary">
                            Privacy Policy
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 animate-in fade-in duration-700">
                <div className="mb-10">
                    <h1 className="text-2xl font-bold text-primary mb-6">XYNEMA PRIVACY POLICY</h1>
                    <p className="text-primary text-[13px] font-bold italic">Effective & last updated March, 2026</p>
                </div>

                <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 space-y-8 font-sans leading-relaxed">
                    <div className="space-y-4">
                        <p>
                            XYNEMA recognizes the importance of safeguarding personal information and is committed to protecting the privacy of all users who access or interact with the Platform. This Privacy Policy explains how information is collected, used, stored, and protected when users access the services provided by XYNEMA.
                        </p>
                        <p>
                            By using the Platform, you consent to the collection and use of information as described in this Privacy Policy.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Information We Collect</h2>
                        <p>
                            When users interact with the Platform, certain types of personal and technical information may be collected in order to provide services effectively.
                        </p>
                        <p>
                            <strong className="text-gray-900 dark:text-white">Personal information</strong> may include details such as the user’s name, email address, phone number, date of birth, and general location. This information is typically collected during account registration, booking processes, or when users communicate with customer support.
                        </p>
                        <p>
                            <strong className="text-gray-900 dark:text-white">Transaction information</strong> is collected whenever a user performs activities such as booking tickets, reserving venues, registering for events, or making payments through the Platform. This information helps maintain accurate booking records and ensures proper service delivery.
                        </p>
                        <p>
                            The Platform may also <strong className="text-gray-900 dark:text-white">automatically collect device and technical information</strong> including IP address, device type, operating system, browser type, and usage statistics. This data helps improve system performance, detect fraud, and enhance user experience.
                        </p>
                        <p>
                            <strong className="text-gray-900 dark:text-white">Usage data</strong> may also be collected to understand how users navigate the Platform, which features are most frequently used, and how the overall service can be improved.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. How We Use Your Information</h2>
                        <p>
                            The information collected from users is primarily used to operate and improve the Platform’s services. This includes processing bookings, confirming payments, delivering tickets, and providing customer support.
                        </p>
                        <p>
                            User information also helps the Company personalize recommendations, notify users about upcoming events, send reminders for bookings, and improve platform performance. Data may also be used to detect and prevent fraudulent transactions, technical errors, or unauthorized access.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. Communication and Notifications</h2>
                        <p>
                            By providing contact information, users agree to receive service-related communications from XYNEMA. This includes booking confirmations, payment receipts, updates regarding event changes, and security alerts. High-frequency promotional messages will include an opt-out mechanism.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. Sharing of Information</h2>
                        <p>
                            XYNEMA does not sell or rent personal information to third parties for their marketing purposes. Information is shared only in limited circumstances:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-gray-900 dark:text-white">With Event Organizers and Venue Operators</strong>: Necessary details are shared with the respective service provider to facilitate your booking and entry.</li>
                            <li><strong className="text-gray-900 dark:text-white">With Service Processors</strong>: We share data with trusted third-party partners who provide essential services such as payment processing, technical infrastructure, and communication tools.</li>
                            <li><strong className="text-gray-900 dark:text-white">For Legal and Safety Compliance</strong>: We may disclose information if required by law, court order, or government regulation, or to protect the safety and rights of XYNEMA, its users, or the public.</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. Data Security</h2>
                        <p>
                            We implement industry-standard security measures, including encryption and secure protocols, to protect personal information from unauthorized access, loss, or disclosure. While we strive to maintain the highest level of security, no method of electronic transmission or storage is 100% secure.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">6. Cookies and Tracking Technologies</h2>
                        <p>
                            XYNEMA uses cookies and similar technologies to enhance user experience, remember preferences, analyze traffic patterns, and provide personalized content. Users may manage cookie settings through their browser preferences, though some features of the Platform may not function correctly without cookies.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">7. Data Retention</h2>
                        <p>
                            Personal information is retained for as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">8. User Rights</h2>
                        <p>
                            Depending on applicable laws, users may have rights to access, correct, or delete their personal information held by XYNEMA. To exercise these rights or request account deletion, users may contact our support team.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">9. Children’s Privacy</h2>
                        <p>
                            The Platform is not intended for use by individuals under the age of 18 without parental guidance. We do not knowingly collect personal information from children without verified parental consent.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">10. International User Data</h2>
                        <p>
                            Information collected through the Platform may be stored and processed in India or any other country where XYNEMA or its service providers maintain facilities. By using the Platform, you consent to the transfer of data outside your country of residence.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">11. Updates to the Policy</h2>
                        <p>
                            This Privacy Policy may be updated periodically to reflect changes in our practices or legal requirements. The updated policy will be published on the Platform with a revised effective date. Continued use of the services signifies acceptance of the updated policy.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">12. Contact Information</h2>
                        <p>
                            For privacy-related inquiries or concerns, users may contact XYNEMA at:
                        </p>
                        <p className="font-bold text-gray-900 dark:text-white">GCCDYNAMICS PVT LTD</p>
                        <p><a href="mailto:care@xynema.in" className="text-primary hover:underline">care@xynema.in</a></p>
                    </div>
                </div>

                {/* Simple Footer Text */}
                <div className="mt-20 pt-10 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
                    XYNEMA. All Rights Reserved. © {new Date().getFullYear()}
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
