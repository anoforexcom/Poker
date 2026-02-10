import React from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';

const LegalPage = () => {
    const { type } = useParams<{ type?: string }>();
    const pageType = type || 'terms';

    const content = pageType === 'privacy' ? {
        title: 'Privacy Policy',
        lastUpdated: 'February 10, 2026',
        sections: [
            {
                title: '1. Information We Collect',
                content: `We collect information that you provide directly to us, including:
                
• Personal Information: Name, email address, date of birth, and payment information when you create an account.
• Gameplay Data: Hand histories, tournament results, and gameplay statistics.
• Device Information: IP address, browser type, operating system, and device identifiers.
• Communication Data: Messages sent through our platform and customer support interactions.`
            },
            {
                title: '2. How We Use Your Information',
                content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Process transactions and send related information
• Send technical notices, updates, and security alerts
• Respond to your comments and questions
• Monitor and analyze trends, usage, and activities
• Detect, prevent, and address fraud and security issues
• Comply with legal obligations and enforce our terms`
            },
            {
                title: '3. Information Sharing',
                content: `We do not sell your personal information. We may share your information:

• With service providers who perform services on our behalf
• To comply with legal obligations or respond to lawful requests
• To protect the rights and safety of our users and the public
• In connection with a merger, acquisition, or sale of assets
• With your consent or at your direction`
            },
            {
                title: '4. Data Security',
                content: `We implement industry-standard security measures to protect your information:

• 256-bit SSL encryption for all data transmission
• Secure data centers with 24/7 monitoring
• Regular security audits and penetration testing
• Two-factor authentication options
• Encrypted storage of sensitive information

However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.`
            },
            {
                title: '5. Your Rights',
                content: `You have the right to:

• Access and receive a copy of your personal data
• Correct inaccurate or incomplete information
• Request deletion of your personal data
• Object to or restrict processing of your data
• Data portability
• Withdraw consent at any time

To exercise these rights, contact us at privacy@pokerpro.com.`
            },
            {
                title: '6. Cookies and Tracking',
                content: `We use cookies and similar tracking technologies to:

• Remember your preferences and settings
• Understand how you use our platform
• Improve user experience
• Provide targeted content

You can control cookies through your browser settings, but disabling them may affect platform functionality.`
            },
            {
                title: '7. Children\'s Privacy',
                content: `Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.`
            },
            {
                title: '8. International Data Transfers',
                content: `Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.`
            },
            {
                title: '9. Changes to This Policy',
                content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date.`
            },
            {
                title: '10. Contact Us',
                content: `If you have questions about this Privacy Policy, please contact us:

Email: privacy@pokerpro.com
Address: Poker Pro Platform, 123 Gaming Street, Suite 100, Las Vegas, NV 89101
Phone: +1 (555) 123-4567`
            }
        ]
    } : {
        title: 'Terms of Service',
        lastUpdated: 'February 10, 2026',
        sections: [
            {
                title: '1. Acceptance of Terms',
                content: `By accessing and using Poker Pro Platform ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.

These terms constitute a legally binding agreement between you and Poker Pro Platform.`
            },
            {
                title: '2. Eligibility',
                content: `To use the Platform, you must:

• Be at least 18 years of age (or the legal age of majority in your jurisdiction)
• Have the legal capacity to enter into a binding contract
• Not be located in a jurisdiction where online poker is prohibited
• Not be on any self-exclusion list or banned from gambling activities
• Provide accurate and complete registration information`
            },
            {
                title: '3. Account Responsibilities',
                content: `You are responsible for:

• Maintaining the confidentiality of your account credentials
• All activities that occur under your account
• Ensuring your account information is accurate and up-to-date
• Notifying us immediately of any unauthorized use
• Using only one account per person

Sharing accounts or using multiple accounts may result in permanent suspension.`
            },
            {
                title: '4. Fair Play and Prohibited Conduct',
                content: `You agree not to:

• Use bots, artificial intelligence, or automated playing programs
• Collude with other players or engage in chip dumping
• Use any form of external assistance or real-time advice
• Exploit bugs or vulnerabilities in the software
• Engage in abusive, harassing, or offensive behavior
• Attempt to manipulate game outcomes
• Launder money or engage in fraudulent activities

Violations will result in account suspension and forfeiture of funds.`
            },
            {
                title: '5. Deposits and Withdrawals',
                content: `Financial transactions are subject to:

• Minimum and maximum limits as specified on the Platform
• Verification requirements for withdrawals
• Processing times varying by payment method
• Potential fees for certain transaction types
• Anti-money laundering compliance checks

We reserve the right to request additional documentation before processing withdrawals.`
            },
            {
                title: '6. Game Rules and Disputes',
                content: `• All games are governed by standard poker rules as displayed on the Platform
• In case of technical errors, the hand may be voided
• Disputes must be reported within 48 hours of the incident
• Our decision on disputes is final and binding
• We maintain detailed logs of all gameplay for dispute resolution`
            },
            {
                title: '7. Intellectual Property',
                content: `All content on the Platform, including software, graphics, logos, and text, is owned by Poker Pro Platform and protected by intellectual property laws. You may not:

• Copy, modify, or distribute our content
• Reverse engineer or decompile our software
• Use our trademarks without permission
• Create derivative works based on our Platform`
            },
            {
                title: '8. Limitation of Liability',
                content: `To the maximum extent permitted by law:

• We are not liable for any indirect, incidental, or consequential damages
• Our total liability is limited to the amount in your account
• We do not guarantee uninterrupted or error-free service
• We are not responsible for third-party services or links
• You use the Platform at your own risk`
            },
            {
                title: '9. Responsible Gaming',
                content: `We are committed to responsible gaming:

• Self-exclusion options are available
• Deposit limits can be set on your account
• Reality check reminders can be enabled
• Links to problem gambling resources are provided
• We comply with all responsible gaming regulations

If you believe you have a gambling problem, please seek help immediately.`
            },
            {
                title: '10. Termination',
                content: `We may suspend or terminate your account:

• For violation of these Terms of Service
• For fraudulent or illegal activity
• At our discretion with or without cause
• Upon your request

Upon termination, you may withdraw your remaining balance subject to verification.`
            },
            {
                title: '11. Changes to Terms',
                content: `We reserve the right to modify these Terms of Service at any time. Material changes will be notified via email or Platform notification. Continued use after changes constitutes acceptance of the new terms.`
            },
            {
                title: '12. Governing Law',
                content: `These Terms are governed by the laws of the State of Nevada, United States. Any disputes shall be resolved through binding arbitration in Las Vegas, Nevada.`
            },
            {
                title: '13. Contact Information',
                content: `For questions about these Terms of Service:

Email: legal@pokerpro.com
Address: Poker Pro Platform, 123 Gaming Street, Suite 100, Las Vegas, NV 89101
Phone: +1 (555) 123-4567`
            }
        ]
    };

    return (
        <div className="min-h-screen bg-background pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl lg:text-5xl font-display font-bold text-white mb-4">
                        {content.title}
                    </h1>
                    <p className="text-slate-400">
                        Last Updated: {content.lastUpdated}
                    </p>
                </motion.div>

                {/* Content */}
                <div className="space-y-8">
                    {content.sections.map((section, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            className="bg-surface border border-white/5 rounded-xl p-8"
                        >
                            <h2 className="text-2xl font-bold text-white mb-4">{section.title}</h2>
                            <div className="text-slate-300 leading-relaxed whitespace-pre-line">
                                {section.content}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mt-16 text-center"
                >
                    <div className="bg-surface border border-white/5 rounded-2xl p-8">
                        <h3 className="text-xl font-bold text-white mb-4">Questions about our {pageType === 'privacy' ? 'Privacy Policy' : 'Terms'}?</h3>
                        <p className="text-slate-400 mb-6">Our legal team is here to help.</p>
                        <a
                            href="mailto:legal@pokerpro.com"
                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-bold transition-all"
                        >
                            <span className="material-symbols-outlined">mail</span>
                            Contact Legal Team
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LegalPage;
