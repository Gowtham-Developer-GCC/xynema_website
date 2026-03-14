import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

const TermsOfUsePage = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: '1. Acceptance of Terms',
            content: `These Terms of Service (the “Terms”) are intended to make you aware of your legal rights and responsibilities with respect to your access to and use of the XYNEMA website and any other related mobile or software applications (collectively “Platform”). By accessing or using the Platform, you are agreeing to these Terms and concluding a legally binding contract with GCCDYNAMICS PVT LTD. Your use/access of the Platform shall be governed by these Terms and the Privacy Policy available on the Platform.`
        },
        {
            title: '2. User Accounts',
            content: `To access certain features of XYNEMA, you may be required to create an account. You agree to provide accurate and truthful information, maintain the confidentiality of your password, and remain responsible for all activities under your account. Notify us immediately of any unauthorized use.`
        },
        {
            title: '3. Service Eligibility',
            content: `You must be at least 18 years of age or the age of majority in your jurisdiction to use this Platform independently. Use by minors should be supervised by a parent or legal guardian.`
        },
        {
            title: '4. Platform License',
            content: `Users are granted a limited, non-exclusive, non-transferable license to access and use the Platform solely for personal and non-commercial purposes. Any unauthorized reproduction, modification, distribution, or commercial exploitation of Platform content is strictly prohibited.`
        },
        {
            title: '5. Movie and Event Bookings',
            content: `• All bookings are subject to availability.
• Tickets are non-transferable and for single use only.
• Cancellations must be made within the specified timeframe as per the organizer's policy.
• Refunds will be processed according to our specific refund policy outlined below.`
        },
        {
            title: '6. Pricing and Fees',
            content: `Prices displayed on the Platform may include the base ticket price determined by the event organizer or venue operator, as well as applicable taxes, convenience fees, and service charges. These additional fees cover platform usage, payment processing, and operational costs associated with facilitating the booking. All charges are displayed to the user prior to the final confirmation of payment. By completing the booking process, you agree to pay the full amount displayed at the checkout stage. Convenience fees or platform service charges are generally non-refundable unless otherwise specified.`
        },
        {
            title: '7. Payments',
            content: `Payments may be processed through various secure payment methods including credit cards, debit cards, UPI, net banking, digital wallets, or other integrated gateways. All payment transactions are processed through authorized third-party payment gateway providers that comply with financial security standards. XYNEMA does not store or directly process sensitive payment information such as card numbers or banking credentials. Users are responsible for ensuring sufficient funds and authorization for their selected payment method.`
        },
        {
            title: '8. Cancellation and Refund Policy',
            content: `Cancellation and refund policies vary depending on the specific event, venue, or service provider. Some bookings, particularly movie tickets, may be non-refundable once confirmed. Event organizers may establish their own timelines and conditions. Where refunds are permitted, the amount will typically be credited back to the original payment method within five (5) to ten (10) working days. XYNEMA facilitates processing but does not independently guarantee refund approval if the organizer’s policy does not permit it.`
        },
        {
            title: '9. Ticket Delivery and Entry',
            content: `Upon successful booking, tickets may be delivered electronically through the mobile application, email, SMS, or QR code-based digital passes. Users are responsible for ensuring correct contact information. Entry requires the presentation of a valid digital ticket or QR code. Failure to present valid identification may result in denial of entry without refund.`
        },
        {
            title: '10. Event Changes, Postponement, or Cancellation',
            content: `Events may occasionally be postponed, rescheduled, relocated, or cancelled due to circumstances beyond XYNEMA's control. In such cases, the event organizer or venue operator will determine the applicable refund or rescheduling policy. XYNEMA will make reasonable efforts to notify users and assist in processing refunds where applicable.`
        },
        {
            title: '11. User Conduct',
            content: `Users agree to use the Platform responsibly. Prohibited conduct includes engaging in fraudulent bookings, reselling tickets illegally, attempting to manipulate booking systems, or interfering with Platform functioning. Users must not upload unlawful, harmful, or defamatory content. Misuse may result in account termination and legal action.`
        },
        {
            title: '12. Intellectual Property',
            content: `All intellectual property associated with the Platform, including design, logos, trademarks, and software, is owned by or licensed to GCCDYNAMICS PVT LTD. Unauthorized use is strictly prohibited.`
        },
        {
            title: '13. Third-Party Links and Services',
            content: `The Platform may contain links to external services operated by third parties. XYNEMA does not control or endorse the content or policies of such third-party services. Access is at the user's own risk.`
        },
        {
            title: '14. Limitation of Liability',
            content: `To the fullest extent permitted by law, XYNEMA and GCCDYNAMICS PVT LTD shall not be liable for any direct, indirect, incidental, or consequential damages arising from Platform use. XYNEMA serves only as an intermediary facilitating transactions.`
        },
        {
            title: '15. Suspension or Termination of Accounts',
            content: `XYNEMA reserves the right to suspend or terminate accounts if it determines a user has violated these Terms, engaged in fraudulent activity, or misused the Platform.`
        },
        {
            title: '16. Changes to Terms',
            content: `The Company may modify or update these Terms periodically. Any revised version will be published on the Platform with the updated date. Continued use constitutes acceptance of revised Terms.`
        },
        {
            title: '17. Governing Law and Jurisdiction',
            content: `These Terms shall be governed and interpreted in accordance with the laws of India. Disputes shall be subject to the exclusive jurisdiction of the courts located in the state of registration of GCCDYNAMICS PVT LTD.`
        },
        {
            title: '18. Contact Information',
            content: `For any questions, concerns, or feedback regarding these Terms of Use, you may contact the Company:
Email: support@xynema.com
Company: GCCDYNAMICS PVT LTD`
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f1115] transition-colors duration-300">
            <SEO
                title="Terms of Service | XYNEMA"
                description="Read XYNEMA's terms of service and legal conditions for using our platform."
            />

            {/* Simple Sticky Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#151924]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-500 hover:text-primary"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="ml-4 font-bold text-sm uppercase tracking-widest text-primary">
                        Terms of Service
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-16 md:py-24 animate-in fade-in duration-700">
                <div className="text-center mb-20">
                    <h1 className="text-4xl md:text-5xl font-black text-primary mb-4 tracking-tight">Terms of service</h1>
                    <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">Last updated on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>
                </div>

                <div className="space-y-12">
                    <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200">
                        <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-6">
                            Thank you for using XYNEMA.
                        </p>
                    </div>

                    {sections.map((section, idx) => (
                        <section key={idx} className="border-t border-gray-50 dark:border-gray-800/50 pt-10">
                            <h2 className="text-xl font-bold text-[#1a1a1a] dark:text-white mb-6 font-roboto tracking-tight">
                                {section.title}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-sans text-sm md:text-base whitespace-pre-wrap">
                                {section.content}
                            </p>
                        </section>
                    ))}
                </div>

                {/* Footer Advisory */}
                <div className="mt-24 pt-12 border-t border-gray-100 dark:border-gray-800 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">
                        © {new Date().getFullYear()} XYNEMA. All Rights Reserved.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default TermsOfUsePage;
