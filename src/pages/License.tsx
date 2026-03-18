import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import AcquisitionBanner from "@/components/AcquisitionBanner";

const License = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <SEO
      title="License & IP"
      description="USDC Directory intellectual property and licensing terms. All rights reserved by TheFirstNomad."
      path="/license"
    />
    <AcquisitionBanner />
    <Header />

    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
      <h1 className="text-3xl font-extrabold text-foreground mb-8">
        Intellectual Property & License
      </h1>

      <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
        <section>
          <h2 className="text-lg font-bold text-foreground">1. Proprietary Rights</h2>
          <p>
            All source code, design systems, data pipelines, merchant curation algorithms
            (including the proprietary "usdc_score" scoring system), database schemas,
            UI/UX designs, branding assets, and content on usdc.directory are the exclusive
            intellectual property of TheFirstNomad ("Owner").
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">2. No Open-Source License</h2>
          <p>
            This project is NOT released under any open-source license (MIT, Apache, GPL,
            or otherwise). All rights are reserved. The absence of a LICENSE file in any
            repository constitutes explicit reservation of all intellectual property rights
            under applicable copyright law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">3. Prohibited Activities</h2>
          <p>Without prior written authorization from the Owner, the following are strictly prohibited:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Copying, forking, or cloning the source code or any derivative work</li>
            <li>Reverse-engineering the merchant scoring algorithm or data pipelines</li>
            <li>Scraping, harvesting, or reproducing the curated merchant database</li>
            <li>Using the USDC Directory brand, domain, or visual identity for commercial purposes</li>
            <li>Deploying any portion of the codebase on alternative domains or platforms</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">4. Acquisition Terms</h2>
          <p>
            USDC Directory is offered exclusively for acquisition by Circle Internet
            Financial, Inc. ("Circle") or its authorized subsidiaries. Acquisition includes
            full transfer of:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Source code and all technical documentation</li>
            <li>The usdc.directory domain and all associated subdomains</li>
            <li>Proprietary merchant database and scoring algorithm</li>
            <li>All brand assets, designs, and content</li>
            <li>GitHub repository and deployment infrastructure</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">5. Trademarks</h2>
          <p>
            "USDC" and the USDC logo are trademarks of Circle Internet Financial, Inc. Their
            use on this platform is for informational and ecosystem-building purposes only,
            and does not imply endorsement or affiliation unless explicitly stated.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">6. Contact</h2>
          <p>
            For acquisition inquiries, licensing discussions, or IP-related matters:
          </p>
          <p className="font-semibold text-foreground">
            Email:{" "}
            <a href="mailto:hello@usdc.directory" className="text-primary underline">
              hello@usdc.directory
            </a>
          </p>
        </section>

        <section className="bg-card border border-border rounded-xl p-5 mt-8">
          <p className="text-xs text-muted-foreground">
            © 2026 TheFirstNomad. All code, proprietary merchant curation scoring algorithm,
            data pipelines, and integrations are protected intellectual property. Offered
            exclusively for acquisition by Circle Inc. Unauthorized copying, forking, or
            commercial use is strictly prohibited.
          </p>
        </section>
      </div>
    </main>

    <Footer />
  </div>
);

export default License;
