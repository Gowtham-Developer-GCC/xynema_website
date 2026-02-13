import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { designSystem } from '../config/design-system';

const TermsOfUsePage = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-whiteSmoke">
            <SEO
                title="Terms of Use - XYNEMA"
                description="Read XYNEMA's terms of use and conditions for using our platform"
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
                        <h1 className="text-sm font-black uppercase text-gray-900">Terms of Use</h1>
                    </div>
                    <div className="w-20"></div>
                </div>
            </header>

            <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="prose max-w-none font-display">
                    <h1 className="text-3xl font-black text-gray-900 mb-8 uppercase">
                        Terms of Use
                    </h1>

                    <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

                    {[
                        {
                            title: '1. Acceptance of Terms',
                            content: `By accessing and using XYNEMA, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`
                        },
                        {
                            title: '2. User Accounts',
                            content: `To access certain features of XYNEMA, you may be required to create an account. You agree to:
                            • Provide accurate and truthful information
                            • Maintain the confidentiality of your password
                            • Be responsible for all activities under your account
                            • Notify us immediately of any unauthorized use`
                        },
                        {
                            title: '3. Movie Bookings',
                            content: `• All bookings are subject to availability
                            • Tickets are non-transferable and for single use only
                            • Cancellations must be made within the specified timeframe
                            • Refunds will be processed according to our refund policy`
                        },
                        {
                            title: '4. Payment Terms',
                            content: `• All transactions are conducted in Indian Rupees
                            • Payment is due at the time of booking
                            • We accept all major credit/debit cards and digital payment methods
                            • All payments are secure and encrypted`
                        },
                        {
                            title: '5. Limitation of Liability',
                            content: `XYNEMA shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.`
                        },
                        {
                            title: '6. Governing Law',
                            content: `These Terms of Use are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts located in India.`
                        },
                        {
                            title: '7. Contact Information',
                            content: `For any questions about these Terms of Use, please contact us at support@xynema.com`
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
                    className="mt-12 p-8 rounded-[32px] border-2 border-premiumGold bg-premiumGold/5 font-display"
                >
                    <p className="text-center font-black uppercase text-charcoalSlate">
                        By using XYNEMA, you acknowledge that you have read and understood these Terms of Use.
                    </p>
                </div>
            </article>
        </div>
    );
};

export default TermsOfUsePage;
