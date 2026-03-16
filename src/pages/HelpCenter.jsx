import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Headphones, ChevronRight, MessageCircle, HelpCircle, FileText } from 'lucide-react';
import { buttonStyles, cardStyles } from '../styles/components';
import SEO from '../components/SEO';

const HelpCenter = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('contact');

    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const [reportForm, setReportForm] = useState({
        issueType: '',
        description: ''
    });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleReportSubmit = (e) => {
        e.preventDefault();
        // Simulate submission
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 3000);
        setReportForm({ issueType: '', description: '' });
    };

    const tabs = [
        { id: 'faqs', label: 'FAQs', icon: HelpCircle },
        { id: 'contact', label: 'Contact', icon: MessageCircle },
        { id: 'report', label: 'Report', icon: FileText }
    ];

    const faqItems = [
        {
            q: "How do I book tickets on XYNEMA?",
            a: "To book tickets, open the XYNEMA platform and browse available movies, events, sports venues, or restaurants. Select the activity you wish to book, choose the preferred date, time, or seat if applicable, and proceed to checkout. After completing the payment through one of the supported payment methods, you will receive a booking confirmation via email, SMS, or in-app notification."
        },
        {
            q: "What payment methods are accepted?",
            a: "XYNEMA supports multiple payment methods including credit cards, debit cards, UPI, net banking, and digital wallets. All payments are processed through secure payment gateways to ensure safe transactions."
        },
        {
            q: "How do I access my e-ticket?",
            a: "After successful booking, your e-ticket will be available in the My Bookings section of the XYNEMA platform. You will also receive the ticket through email or SMS depending on the booking type. The ticket may include a QR code or booking reference number that can be presented at the venue for entry."
        },
        {
            q: "Can I cancel my booking?",
            a: "Cancellation eligibility depends on the policies of the respective theatre, event organizer, sports venue operator, or restaurant partner. Some bookings may allow cancellations within a specified timeframe, while others may be non-refundable. You can check the cancellation policy during the booking process."
        },
        {
            q: "How long do refunds take?",
            a: "If a booking qualifies for a refund, the refund is typically processed within 5–10 business days. The actual time required may depend on the payment method used and the processing time of the respective bank or payment provider."
        },
        {
            q: "What should I do if my payment was deducted but the booking was not confirmed?",
            a: "If payment was deducted but a booking confirmation was not received, the transaction is usually reversed automatically by the payment provider. This process may take 5–7 business days. If the amount is not refunded within this period, you may contact the XYNEMA support team with your transaction details."
        },
        {
            q: "How can I change my account details?",
            a: "Users can update their profile information by accessing the Account Settings section within the XYNEMA platform. If you encounter any issues while updating your account details, please contact customer support for assistance."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] transition-colors duration-300">
            <SEO 
                title="Help & Support | Xynema" 
                description="Get in touch with Xynema support for any queries or issues."
            />

            {/* Header Area */}
            <div className="bg-white dark:bg-[#151924] border-b border-gray-100 dark:border-gray-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight font-roboto">
                            Help & support
                        </h1>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800/50">
                    <div className="flex justify-center md:justify-start">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-8 py-5 text-sm font-semibold transition-all relative ${
                                    activeTab === tab.id
                                        ? 'text-primary'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                <span>{tab.label}</span>
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in duration-300" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
                {activeTab === 'faqs' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Welcome Text */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 font-roboto">XYNEMA Help Center</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                                Welcome to the XYNEMA Help Center. This section provides assistance with bookings, payments, cancellations, account management, and partner services. Our goal is to ensure that your experience on the XYNEMA platform is smooth, secure, and enjoyable. If you cannot find the information you need, our support team is available to assist you.
                            </p>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider text-primary/80">Frequently Asked Questions</h3>
                        
                        {/* FAQ Accordions */}
                        <div className="space-y-4 mb-20">
                            {faqItems.map((item, index) => (
                                <div 
                                    key={index}
                                    className="bg-white dark:bg-[#151924] border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm transition-all"
                                >
                                    <button 
                                        onClick={() => toggleFaq(index)}
                                        className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <span className="font-bold text-gray-900 dark:text-gray-100 font-roboto leading-tight">{item.q}</span>
                                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openFaq === index ? 'rotate-90' : ''}`} />
                                    </button>
                                    <div className={`transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                                        <div className="px-6 pb-6 text-gray-600 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-50 dark:border-gray-800/50 pt-4">
                                            {item.a}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Additional Info Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                            <div className="space-y-4">
                                <h4 className="text-primary font-bold uppercase tracking-widest text-[11px]">Customer Support</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                    If you need help with bookings, payments, refunds, or technical issues, our team is here.
                                </p>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">For Customer Service:</span>
                                    <a href="mailto:care@xynema.in" className="text-primary font-bold hover:underline">care@xynema.in</a>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-primary font-bold uppercase tracking-widest text-[11px]">Partner Support</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Existing partners or venue owners wishing to onboard with Xynema.
                                </p>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">For Partner Support:</span>
                                    <a href="mailto:support@xynema.in" className="text-primary font-bold hover:underline">support@xynema.in</a>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-primary font-bold uppercase tracking-widest text-[11px]">Corporate Information</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Communication, media inquiries, and business partnerships for GCCDYNAMICS PVT LTD.
                                </p>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">For Corporate Info:</span>
                                    <a href="mailto:info@xynema.in" className="text-primary font-bold hover:underline">info@xynema.in</a>
                                </div>
                            </div>
                        </div>

                        {/* Closing Footer Call-to-action */}
                        <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-8 text-center border border-primary/10">
                             <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-roboto tracking-tight">Still Need Help?</h4>
                             <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xl mx-auto leading-relaxed">
                                 If you cannot find the answer you are looking for, contact our support team. Please include your **booking ID** and registered email for faster assistance.
                             </p>
                             <div className="flex justify-center flex-wrap gap-4">
                                 <button 
                                    onClick={() => setActiveTab('contact')}
                                    className="px-8 py-3 bg-primary text-white rounded-lg font-bold text-sm tracking-wide shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                 >
                                     Go to Contact
                                 </button>
                             </div>
                        </div>
                    </div>
                )}
                {activeTab === 'contact' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Email Support Card */}
                        <div className="bg-white dark:bg-[#151924] rounded-xl p-6 md:p-8 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="w-14 h-14 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center border border-primary/10 dark:border-primary/20 shrink-0">
                                <Mail className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 font-roboto">Email Support</h3>
                                <a href="mailto:care@xynema.in" className="text-primary hover:underline text-sm font-medium mb-1 block">
                                    care@xynema.in
                                </a>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Our team aims to respond as quickly as possible.
                                </p>
                            </div>
                            <button className="text-gray-400 hover:text-primary transition-colors hidden md:block">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Phone Support Card */}
                        <div className="bg-white dark:bg-[#151924] rounded-xl p-6 md:p-8 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                <Phone className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 font-roboto">Phone Support</h3>
                                <a href="tel:+04944531182" className="text-primary hover:underline text-sm font-medium mb-1 block">
                                    0494-4531182
                                </a>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-sans">
                                    Available Mon-Sat, 9 AM - 9 PM
                                </p>
                            </div>
                            <button className="text-gray-400 hover:text-primary transition-colors hidden md:block">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Live Chat Card */}
                        <div className="bg-white dark:bg-[#151924] rounded-xl p-6 md:p-8 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="w-14 h-14 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center border border-primary/10 dark:border-primary/20 shrink-0">
                                <Headphones className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 font-roboto tracking-tight">Live Chat</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Chat with our support team in real-time
                                </p>
                            </div>
                            <button className="w-full md:w-auto px-10 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold text-sm tracking-wide transition-all active:scale-95 shadow-lg shadow-primary/20">
                                Start Chat
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'report' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {isSubmitted ? (
                            <div className="text-center py-20 bg-white dark:bg-[#151924] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                <div className="w-16 h-16 bg-green-50 dark:bg-green-900/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ChevronRight className="w-8 h-8 text-green-500 rotate-[-90deg]" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Report Submitted!</h3>
                                <p className="text-gray-500 dark:text-gray-400">Thank you for your feedback. We will look into it immediately.</p>
                            </div>
                        ) : (
                            <div className="max-w-2xl mx-auto">
                                {/* Advisory Banner */}
                                <div className="bg-[#fff1f1] border border-[#ffe4e4] rounded-lg p-4 mb-8 flex items-start gap-4">
                                    <HelpCircle className="w-5 h-5 text-[#ff4d4d] shrink-0 mt-0.5" />
                                    <p className="text-[13px] md:text-sm text-[#c0392b] font-medium leading-relaxed">
                                        Report any issues, bugs, or inappropriate content. We take all reports seriously.
                                    </p>
                                </div>

                                <form onSubmit={handleReportSubmit} className="space-y-6">
                                    {/* Issue Type Selector */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Issue Type</label>
                                        <div className="relative">
                                            <select 
                                                required
                                                value={reportForm.issueType}
                                                onChange={(e) => setReportForm({...reportForm, issueType: e.target.value})}
                                                className="w-full bg-white dark:bg-[#151924] border border-gray-100 dark:border-gray-800 rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer text-gray-700 dark:text-gray-300"
                                            >
                                                <option value="" disabled>Select issue type</option>
                                                <option value="booking">Problem with my booking</option>
                                                <option value="payment">Payment issue</option>
                                                <option value="falseinfo_event_or_show">Incorrect event or show information</option>
                                                <option value="falseinfo_venue">Venue issue - sports turf / theatre / restaurant</option>
                                                <option value="ticket_not_received">Ticket not received</option>
                                                <option value="unable_to_access_event_or_venue">Unable to access event or venue</option>
                                                <option value="refund_cancellation">Refund or cancellation issue</option>
                                                <option value="app_technical_problem">App technical problem</option>
                                                <option value="suspicious_activity">Suspicious or fraudulent activity</option>
                                                <option value="other">Other issue</option>
                                            </select>
                                            <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Description Textarea */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Description</label>
                                        <textarea 
                                            required
                                            rows={8}
                                            value={reportForm.description}
                                            onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                                            placeholder="Please describe the issue in detail..."
                                            className="w-full bg-white dark:bg-[#151924] border border-gray-100 dark:border-gray-800 rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-gray-700 dark:text-gray-300"
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <button 
                                        type="submit"
                                        className="w-full py-4 bg-[#ff4d4d] hover:bg-[#ff3333] text-white rounded-xl font-bold text-sm tracking-widest uppercase transition-all shadow-lg shadow-red-500/10 active:scale-[0.98]"
                                    >
                                        Submit Report
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HelpCenter;
