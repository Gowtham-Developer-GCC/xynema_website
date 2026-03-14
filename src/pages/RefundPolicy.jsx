import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

const RefundPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f1115] transition-colors duration-300">
            <SEO
                title="Refund Policy | XYNEMA"
                description="Understand XYNEMA's cancellation and refund policies for movie tickets, events, and venues."
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
                            Refund Policy
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 animate-in fade-in duration-700">
                <div className="mb-10">
                    <h1 className="text-2xl font-bold text-primary mb-6 uppercase tracking-tight">Refund Policy</h1>
                    <p className="text-primary text-[13px] font-bold italic">Effective & last updated March, 2026</p>
                </div>

                <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 space-y-6 font-sans leading-relaxed text-sm md:text-base">
                    <p>
                        Cancellation and refund policies vary depending on the specific event, venue, restaurant, or service provider listed on the XYNEMA platform. Certain bookings, including but not limited to movie tickets, limited-capacity events, promotional offers, or time-sensitive bookings, may be non-cancellable and non-refundable once the booking has been successfully confirmed. Users are advised to carefully review the applicable cancellation and refund terms displayed at the time of booking before completing the transaction.
                    </p>
                    
                    <p>
                        Event organizers, theatres, sports venue operators, and restaurant partners may establish their own cancellation timelines, refund eligibility conditions, and rescheduling policies. In the case of sports venue bookings, cancellations may only be permitted within specific time windows prior to the scheduled booking slot, and late cancellations may not qualify for any refund depending on the venue’s policy.
                    </p>
                    
                    <p>
                        Where refunds are approved by the respective organizer or service provider, the refunded amount shall exclude any platform convenience fees, internet handling charges, service fees, or other processing charges collected by XYNEMA at the time of booking. Such charges are collected for facilitating the booking transaction and are non-refundable under all circumstances, including situations where the booking itself is cancelled or refunded by the service provider.
                    </p>
                    
                    <p>
                        If a refund is approved, the eligible refund amount will typically be credited back to the original payment method used during the booking transaction, subject to the policies and processing timelines of the respective payment gateway, bank, or financial institution. Refund processing timelines generally range between five (5) to ten (10) working days, although actual timelines may vary depending on the payment provider and banking network involved.
                    </p>
                    
                    <p>
                        In certain situations, events or services may be postponed, rescheduled, relocated, or modified by the respective event organizer or venue operator due to circumstances beyond their control. Such circumstances may include technical issues, weather conditions, safety concerns, regulatory restrictions, or force majeure events. In such cases, the event organizer or service provider will determine the applicable refund or rescheduling policy. XYNEMA will make reasonable efforts to notify users and assist in processing refunds or alternate arrangements where applicable.
                    </p>
                    
                    <p className="font-medium text-gray-900 dark:text-white">
                        XYNEMA acts solely as a technology platform and booking intermediary facilitating transactions between users and third-party service providers. While XYNEMA may assist users in initiating refund requests, the final decision regarding refund approval, rescheduling, or cancellation eligibility rests solely with the respective event organizer, theatre, venue operator, or partner service provider. XYNEMA shall not be held liable for refund decisions, service disruptions, or changes made by such third-party partners.
                    </p>
                </div>

                {/* Simple Footer Text */}
                <div className="mt-20 pt-10 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
                    XYNEMA. All Rights Reserved. © {new Date().getFullYear()}
                </div>
            </main>
        </div>
    );
};

export default RefundPolicy;
