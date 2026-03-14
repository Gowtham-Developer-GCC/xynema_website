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
            content: `To access certain features of XYNEMA, you may be required to create an account. You agree to provide accurate and truthful information, maintain the confidentiality of your password, and remain responsible for all activities under your account. Any activities occurring under your account are deemed to have been performed by you unless proven otherwise. Therefore, you agree to immediately notify XYNEMA if you suspect any unauthorized access, security breach, or misuse of your account. XYNEMA shall not be responsible for any loss, damage, or inconvenience arising from the unauthorized use of your account if such access results from your failure to maintain proper account security.`
        },
        {
            title: '3. Service Eligibility',
            content: `You must be at least 18 years of age or the age of majority in your jurisdiction to use this Platform independently. Use by minors should be supervised by a parent or legal guardian.`
        },
        {
            title: '4. Platform Services',
            content: `The Platform offers a range of services intended to enhance user access to entertainment, sports, dining, and community experiences. Users may purchase tickets for movies, live events, concerts, sports tournaments, festivals, and similar experiences listed on the Platform. In addition to ticketing, the Platform allows users to reserve sports venues such as football turfs, badminton courts, cricket nets, indoor sports arenas, and other recreational facilities. XYNEMA also provides event discovery features and may facilitate private or invite-only events, as well as restaurant discovery and reservation services.`
        },
        {
            title: '5. Role of XYNEMA',
            content: `XYNEMA acts solely as a technology platform that connects users with independent service providers. The Company does not own, operate, manage, or directly control the venues, events, restaurants, or services listed on the Platform. All responsibilities related to the execution of events, management of venues, food quality, safety protocols, and regulatory compliance lie with the respective third-party providers. XYNEMA cannot be held responsible for errors, omissions, or inaccuracies in event listings or pricing information provided by third parties.`
        },
        {
            title: '6. Pricing, Fees, and Charges',
            content: `Prices displayed on the Platform may include the base ticket price determined by the event organizer or venue operator, as well as applicable taxes, convenience fees, and service charges. These additional fees cover platform usage, payment processing, and operational costs. All charges are displayed prior to the final confirmation. By completing the booking, you agree to pay the full amount displayed. Convenience fees or platform service charges are generally non-refundable unless otherwise specified.`
        },
        {
            title: '7. Payments',
            content: `Payments for bookings on the Platform may be processed through various secure payment methods including credit cards, debit cards, Unified Payments Interface (UPI), net banking, digital wallets, or other integrated gateways. XYNEMA does not store or directly process sensitive payment information such as card numbers or banking credentials. Users are responsible for ensuring that their selected payment method has sufficient funds and is authorized for online transactions.`
        },
        {
            title: '8. Cancellation and Refund Policy',
            content: `Cancellation and refund policies vary depending on the specific event, venue, or service provider. Some bookings, particularly movie tickets or time-sensitive events, may be non-refundable once confirmed. Event organizers and venue operators establish their own timelines and conditions. Where refunds are permitted, the amount will typically be credited back to the original payment method within five (5) to ten (10) working days. XYNEMA facilitates processing but does not independently guarantee refund approval.`
        },
        {
            title: '9. Ticket Delivery and Entry',
            content: `Upon successful booking, tickets or reservation confirmations are delivered electronically through the mobile application, email, SMS, or QR code-based digital passes. Entry may require presentation of a digital ticket, QR code, or valid identification. Each ticket or QR code may be used only once; duplicate or copied tickets may be rejected at the venue entry point. Failure to present a valid ticket may result in denial of entry without refund.`
        },
        {
            title: '10. Event Changes, Postponement, or Cancellation',
            content: `Events listed on the Platform may occasionally be postponed, rescheduled, relocated, or cancelled due to circumstances beyond the control of XYNEMA. In such cases, the event organizer or venue operator will determine the applicable refund or rescheduling policy. XYNEMA will make reasonable efforts to notify users and assist in processing refunds or alternate arrangements where applicable.`
        },
        {
            title: '11. User Conduct',
            content: `Users agree to use the Platform responsibly and in accordance with applicable laws. Prohibited conduct includes engaging in fraudulent bookings, reselling tickets illegally, attempting to manipulate booking systems, or interfering with the normal functioning of the Platform. Users must not upload or distribute content that is unlawful, harmful, defamatory, or abusive. Misuse may result in account termination and legal action.`
        },
        {
            title: '12. Intellectual Property',
            content: `All intellectual property associated with the Platform, including its design, logos, trademarks, software, technology, and content, is owned by or licensed to GCCDYNAMICS PVT LTD. Users are granted a limited license for personal and non-commercial purposes. Any unauthorized reproduction, modification, or commercial exploitation is strictly prohibited.`
        },
        {
            title: '13. Third-Party Links and Services',
            content: `The Platform may contain links or references to external websites or services operated by third parties. XYNEMA does not control or endorse the content, policies, or practices of such third-party services. Users access third-party websites at their own risk.`
        },
        {
            title: '14. Limitation of Liability',
            content: `To the fullest extent permitted by law, XYNEMA and GCCDYNAMICS PVT LTD shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from the use of the Platform, including event cancellations, disputes with providers, or technical failures. XYNEMA does not guarantee uninterrupted or error-free access and shall not be liable for delays due to force majeure events.`
        },
        {
            title: '15. Suspension or Termination of Accounts',
            content: `XYNEMA reserves the right to suspend, restrict, or terminate user accounts at its sole discretion if it determines that a user has violated these Terms, engaged in fraudulent activity, or misused the Platform. Termination may result in the loss of access to services and any unused bookings.`
        },
        {
            title: '16. Changes to Terms',
            content: `The Company may modify or update these Terms periodically. Any revised version will be published on the Platform along with the updated date. Continued use of the Platform after such updates constitutes acceptance of the revised Terms.`
        },
        {
            title: '17. Governing Law and Jurisdiction',
            content: `These Terms shall be governed and interpreted in accordance with the laws of India. Any disputes arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the courts located in the state where GCCDYNAMICS PVT LTD is registered.`
        },
        {
            title: '18. Anti-Scalping & Intermediary Disclaimer',
            content: `Intermediary Disclaimer: XYNEMA is a neutral platform under IT Act 2000. No liability for third-party services. Anti-Scalping: Max 10 tickets per user per event. Resale is strictly prohibited; violations lead to cancellation and reporting to authorities.`
        },
        {
            title: '19. Contact Information',
            content: `If you have any questions, concerns, or feedback regarding these Terms of Use, you may contact the Company:
Email: support@xynema.com

GCCDYNAMICS PVT LTD
Registered Office: 24/286,48 A, University Road, Kochi University, Ernakulam, Ernakulam- 682022, Kerala, India`
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
