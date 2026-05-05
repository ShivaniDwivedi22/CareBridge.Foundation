import { motion } from "framer-motion";
import { ScrollText, Shield } from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      title: "1. About CareBridge",
      body: (
        <p>
          CareBridge is an online platform that connects individuals seeking care services ("Care Seekers") with independent care providers ("Care Providers"). CareBridge operates as a connection platform only and does not employ, endorse, supervise, or guarantee the services of any Care Provider listed on this platform.
        </p>
      ),
    },
    {
      title: "2. Acceptance of Terms",
      body: (
        <p>
          By accessing or using CareBridge, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, please discontinue use immediately. These Terms constitute a binding agreement under the laws of Ontario, Canada.
        </p>
      ),
    },
    {
      title: "3. Nature of the Platform",
      body: (
        <ul className="list-disc pl-5 space-y-2">
          <li>CareBridge is a connection platform only. We do not provide care services directly.</li>
          <li>All care arrangements, agreements, and transactions are made solely between the Care Seeker and Care Provider.</li>
          <li>CareBridge is not a party to any agreement formed between users, and no agency, partnership, employment, or joint venture relationship is created between CareBridge and any user.</li>
        </ul>
      ),
    },
    {
      title: "4. No Endorsement or Verification",
      body: (
        <ul className="list-disc pl-5 space-y-2">
          <li>CareBridge does not independently verify, vet, certify, or guarantee the credentials, qualifications, background, identity, or suitability of any Care Provider.</li>
          <li>Users are solely responsible for conducting their own due diligence — including reference checks, credential verification, and where applicable, requesting a Vulnerable Sector Check under the <em>Criminal Records Act (Canada)</em> — before engaging any Care Provider.</li>
          <li>Profiles and listings are created by users. CareBridge makes no representations as to their accuracy or completeness.</li>
        </ul>
      ),
    },
    {
      title: "5. Limitation of Liability",
      body: (
        <>
          <p className="mb-3">To the fullest extent permitted by the laws of Ontario and Canada:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>CareBridge shall not be liable for any direct, indirect, incidental, special, or consequential loss, injury, damage, or harm arising from interactions, arrangements, or services between Care Seekers and Care Providers.</li>
            <li>CareBridge is not responsible for the conduct, actions, or omissions of any user on or off the platform.</li>
            <li>CareBridge does not guarantee the availability, quality, safety, or legality of any services offered or arranged through the platform.</li>
            <li>Where liability cannot be fully excluded under applicable law (including the <em>Consumer Protection Act, 2002</em> (Ontario)), CareBridge's total liability shall not exceed the greater of $100 CAD or the amount paid by the user to CareBridge in the 30 days preceding the claim.</li>
          </ul>
        </>
      ),
    },
    {
      title: "6. User Responsibilities",
      body: (
        <>
          <p className="mb-3">All users agree to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Provide accurate, current, and truthful information in their profiles and communications.</li>
            <li>Comply with all applicable federal and provincial laws, including but not limited to Ontario's <em>Occupational Health and Safety Act</em>, <em>Personal Health Information Protection Act (PHIPA)</em>, and any applicable regulated health profession legislation.</li>
            <li>Treat all other users with respect and dignity.</li>
            <li>Not use the platform for any unlawful, fraudulent, deceptive, or harmful purpose.</li>
          </ul>
        </>
      ),
    },
    {
      title: "7. Care Provider Acknowledgement",
      body: (
        <>
          <p className="mb-3">Care Providers acknowledge that:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>They are independent individuals or businesses, not employees, contractors, or agents of CareBridge.</li>
            <li>They are solely responsible for the care services they provide, including compliance with any applicable licensing, professional registration, insurance, and legal requirements in Ontario.</li>
            <li>If offering services within regulated health professions (e.g., nursing, personal support), they are responsible for ensuring they meet all requirements under Ontario's <em>Regulated Health Professions Act, 1991</em>.</li>
          </ul>
        </>
      ),
    },
    {
      title: "8. Privacy and Personal Information",
      body: (
        <>
          <p className="mb-3">CareBridge collects, uses, and discloses personal information in accordance with our Privacy Policy [linked] and in compliance with:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Ontario's <em>Personal Health Information Protection Act (PHIPA)</em>, where health information is involved.</li>
            <li>Canada's <em>Personal Information Protection and Electronic Documents Act (PIPEDA)</em> / <em>Consumer Privacy Protection Act (CPPA)</em> as applicable.</li>
          </ul>
          <p className="mt-3">By using the platform, you consent to the collection and use of your personal information as described in our Privacy Policy.</p>
        </>
      ),
    },
    {
      title: "9. Disputes Between Users",
      body: (
        <p>
          Any disputes arising between Care Seekers and Care Providers are to be resolved directly between those parties. CareBridge has no obligation to mediate, arbitrate, or resolve such disputes. For unresolved consumer concerns, users may contact the Ontario Ministry of Public and Business Service Delivery or seek guidance from a qualified legal professional.
        </p>
      ),
    },
    {
      title: "10. Modifications to Terms",
      body: (
        <p>
          CareBridge reserves the right to update these Terms at any time. Notice of material changes will be posted on the platform. Continued use after changes are posted constitutes acceptance of the revised Terms.
        </p>
      ),
    },
    {
      title: "11. Governing Law and Jurisdiction",
      body: (
        <p>
          These Terms are governed exclusively by the laws of the Province of Ontario and the applicable federal laws of Canada. Any legal proceedings shall be brought exclusively in the courts of Ontario.
        </p>
      ),
    },
    {
      title: "12. Accessibility",
      body: (
        <p>
          CareBridge is committed to accessibility in accordance with the <em>Accessibility for Ontarians with Disabilities Act (AODA)</em>. If you require an accessible format of these Terms, please contact us.
        </p>
      ),
    },
    {
      title: "13. Contact",
      body: (
        <>
          <p className="mb-2">For questions or concerns regarding these Terms:</p>
          <p>CareBridge — <a href="mailto:info@carebridge.foundation.com" className="text-primary hover:underline">info@carebridge.foundation.com</a></p>
          <p className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
            <strong>Important:</strong> Before publishing, have an Ontario-licensed lawyer review this — particularly around PHIPA compliance, consumer protection obligations, and any regulated health profession activity that may occur on your platform. The legal landscape for care platforms in Ontario carries specific obligations that may go beyond what a standard T&amp;C covers.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/5 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Shield className="w-4 h-4" /> Legal
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3">Terms and Conditions</h1>
          <p className="text-muted-foreground text-sm">CareBridge · Effective Date: May 5th, 2026</p>
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl border border-border/40 shadow-sm p-6 md:p-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-serif text-xl md:text-2xl font-bold mb-3 text-foreground flex items-center gap-2">
                  <ScrollText className="w-5 h-5 text-primary shrink-0" /> {section.title}
                </h2>
                <div className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {section.body}
                </div>
              </section>
            ))}
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          By using CareBridge, you acknowledge that you have read, understood, and agree to these Terms.
        </p>
      </div>
    </div>
  );
}
