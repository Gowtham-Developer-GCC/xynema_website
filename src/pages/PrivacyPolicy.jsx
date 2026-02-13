import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { designSystem } from '../config/design-system';

const PrivacyPolicyPage = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-whiteSmoke">
            <SEO
                title="Privacy Policy - XYNEMA"
                description="Read XYNEMA's comprehensive privacy policy and how we protect your data"
            />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-xynemaRose transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <div className="text-center font-display">
                        <h1 className="text-sm font-black uppercase text-gray-900">Privacy Policy</h1>
                    </div>
                    <div className="w-20"></div>
                </div>
            </header>

            <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="prose max-w-none font-display">
                    <h1 className="text-3xl font-black text-gray-900 mb-8 uppercase">
                        Privacy Policy
                    </h1>

                    <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

                    {[
                        {
                            title: '1. Information We Collect',
                            content: `We collect information you provide directly to us, such as when you create an account, make a booking, or contact us. This includes:
                            • Name, email address, and phone number
                            • Payment information (processed securely)
                            • Movie preferences and viewing history
                            • Device information and usage data`
                        },
                        {
                            title: '2. How We Use Your Information',
                            content: `We use the information we collect to:
                            • Process your bookings and payments
                            • Provide customer support
                            • Send promotional offers (with your consent)
                            • Improve our services and user experience
                            • Comply with legal obligations`
                        },
                        {
                            title: '3. Data Security',
                            content: `We implement industry-standard security measures including 256-bit SSL encryption to protect your personal information. All payment processing is PCI DSS compliant.`
                        },
                        {
                            title: '4. Your Rights',
                            content: `You have the right to:
                            • Access your personal data
                            • Correct inaccurate information
                            • Request deletion of your data
                            • Opt-out of promotional communications
                            • Data portability`
                        },
                        {
                            title: '5. Contact Us',
                            content: `If you have any questions about this Privacy Policy, please contact us at privacy@xynema.com`
                        }
                    ].map((section, idx) => (
                        <section key={idx} className="mb-8">
                            <h2
                                className="text-2xl font-black uppercase text-xynemaRose mb-4"
                            >
                                {section.title}
                            </h2>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                                {section.content}
                            </p>
                        </section>
                    ))}
                </div>

                {/* Call to Action */}
                <div
                    className="mt-12 p-8 rounded-[32px] border-2 border-xynemaRose bg-xynemaRose/5 font-display"
                >
                    <p className="text-center font-black uppercase text-xynemaRose">
                        We're committed to protecting your privacy. If you have concerns, contact us immediately.
                    </p>
                </div>
            </article>
        </div>
    );
};

export default PrivacyPolicyPage;
