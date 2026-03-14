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
                    <p className="text-primary text-[13px] font-bold italic">Last Updated: March, 2026</p>
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

                    <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-6 space-y-3">
                        <h2 className="text-lg font-bold text-primary">DPDP Act 2023 Compliance Notice</h2>
                        <p className="text-sm font-medium">
                            XYNEMA (GCCDYNAMICS PVT LTD) is a Data Fiduciary under the Digital Personal Data Protection Act, 2023 (DPDP Act) and Rules, 2025.
                        </p>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                            <li><strong>Data Collected</strong>: Name, email, phone, payment details, device ID, location (approximate).</li>
                            <li><strong>Purposes</strong>: Booking processing, payments, fraud prevention, personalization (opt-in), legal compliance.</li>
                            <li><strong>Rights</strong>: Access, correction, erasure, restriction, portability, objection—withdraw consent anytime.</li>
                            <li><strong>Retention</strong>: 7 years post-transaction or legal minimum.</li>
                            <li><strong>Transfers</strong>: Within India; international only with safeguards.</li>
                        </ul>
                        <p className="text-sm">Process requests at <a href="mailto:care@xynema.in" className="text-primary font-bold">care@xynema.in</a> (response: 30 days).</p>
                        <p className="text-xs italic">Users may nominate another individual to exercise data rights in case of death or incapacity as permitted under the Digital Personal Data Protection Act, 2023.</p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Information We Collect</h2>
                        <p>
                            When users interact with the Platform, certain types of personal and technical information may be collected in order to provide services effectively.
                        </p>
                        <p>
                            <strong>Personal information</strong> may include details such as the user’s name, email address, phone number, date of birth, and general location. This information is typically collected during account registration, booking processes, or when users communicate with customer support.
                        </p>
                        <p>
                            <strong>Transaction information</strong> is collected whenever a user performs activities such as booking tickets, reserving venues, registering for events, or making payments through the Platform. This information helps maintain accurate booking records and ensures proper service delivery.
                        </p>
                        <p>
                            The Platform may also <strong>automatically collect device and technical information</strong> including IP address, device type, operating system, browser type, and usage statistics. This data helps improve system performance, detect fraud, and enhance user experience.
                        </p>
                        <p>
                            <strong>Usage data</strong> may also be collected to understand how users navigate the Platform, which features are most frequently used, and how the overall service can be improved.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. How We Use Your Information</h2>
                        <p>
                            The information collected from users is primarily used to operate and improve the Platform’s services. This includes processing bookings, confirming payments, delivering tickets, and providing customer support.
                        </p>
                        <p>
                            User information also helps the Company personalize recommendations, notify users about upcoming events, send reminders for bookings, and improve platform performance. Data may also be used to detect suspicious activity, prevent fraud, and ensure compliance with applicable laws and regulations.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. Communication with Users</h2>
                        <p>
                            Users may receive communications related to their activity on the Platform. These communications may include booking confirmations, event reminders, service updates, and customer support responses.
                        </p>
                        <p>
                            From time to time, users may also receive promotional messages or marketing offers related to events, activities, or services available on the Platform. Users may opt out of receiving promotional communications through the settings available in their account or by contacting the support team.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. Sharing of Information</h2>
                        <p>
                            In order to provide services effectively, XYNEMA may share limited information with trusted third parties.
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Service Providers</strong>: Event organizers receive necessary booking details to manage event entry, while venue operators receive reservation details to confirm bookings.</li>
                            <li><strong>Payment Processors</strong>: Processors receive transaction information required to complete financial payments securely.</li>
                            <li><strong>Legal and Safety</strong>: In certain circumstances, information may be shared with regulatory authorities, law enforcement agencies, or legal bodies when required by applicable law or legal processes.</li>
                        </ul>
                        <p>
                            XYNEMA does not sell, rent, or trade user personal data to third parties for commercial purposes.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. Data Security</h2>
                        <p>
                            The Company implements reasonable administrative, technical, and physical safeguards to protect user information from unauthorized access, disclosure, or misuse. Security measures may include encrypted transactions, secure server infrastructure, restricted internal access controls, and periodic security monitoring. Despite these safeguards, users acknowledge that no digital system can be completely immune to security risks.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">6. Cookies and Tracking Technologies</h2>
                        <p>
                            The Platform may use cookies and similar technologies to improve user experience. Cookies help remember login sessions, store user preferences, analyze traffic patterns, and optimize system performance. Users may choose to disable cookies through their browser settings. However, certain features of the Platform may not function properly if cookies are disabled.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">7. Data Retention</h2>
                        <p>
                            User data is retained only for as long as necessary to provide services, fulfill legal obligations, resolve disputes, and enforce agreements. When personal information is no longer required for operational or legal purposes, reasonable steps will be taken to securely delete or anonymize the data.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">8. User Rights and Control (DPDP Act)</h2>
                        <p>
                            As a Data Principal under the DPDP Act, you have various rights:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Right to Access</strong>: View your personal data processed by us.</li>
                            <li><strong>Right to Correction</strong>: Update or correct inaccurate or incomplete data.</li>
                            <li><strong>Right to Erasure</strong>: Request deletion of your data (subject to legal holds).</li>
                            <li><strong>Right to Restriction/Objection</strong>: Limit or object to specific processing activities.</li>
                            <li><strong>Right to Portability</strong>: Receive your data in a machine-readable format.</li>
                        </ul>
                        <p>
                            Submit your requests via the dashboard or at <a href="mailto:care@xynema.in" className="text-primary font-bold">care@xynema.in</a>. We will respond within 30 days. You may appeal to the Data Protection Board at <a href="https://dpb.gov.in" target="_blank" rel="noopener noreferrer" className="text-primary">dpb.gov.in</a>.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">9. Children's Privacy</h2>
                        <p>
                            The Platform is not intended for children under the age of thirteen. No data from children under 18 is collected without verifiable parental consent (e.g., OTP to parent phone). If discovered, data is erased immediately. Parents may contact <a href="mailto:care@xynema.in" className="text-primary">care@xynema.in</a> to manage child data.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">10. International Users</h2>
                        <p>
                            If XYNEMA expands its services beyond India, user data may be processed or stored in jurisdictions outside the user’s country. In such cases, the Company will implement appropriate safeguards to ensure that personal information continues to be protected in accordance with applicable privacy laws.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">11. Updates to this Privacy Policy</h2>
                        <p>
                            This Privacy Policy may be updated from time to time to reflect operational, legal, or technological changes. Any revised version will be published on the Platform with the updated date. Continued use constitutes acceptance of the revised policy.
                        </p>
                    </div>

                    <div className="space-y-4 font-bold border-t border-gray-100 dark:border-gray-800 pt-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">12. Contact Information</h2>
                        <p>
                            For any questions, requests, or concerns regarding this Privacy Policy or the handling of personal data, contact us at:
                        </p>
                        <p className="text-primary">Email: privacy@xynema.com or care@xynema.in</p>
                        <p className="text-gray-900 dark:text-white">Company: GCCDYNAMICS PVT LTD</p>
                        <p className="text-sm font-normal text-gray-500">Registered Office: 24/286,48 A, University Road, Kochi University, Ernakulam, Ernakulam- 682022, Kerala, India</p>
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
