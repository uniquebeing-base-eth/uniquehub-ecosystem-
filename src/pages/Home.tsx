import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CompanyHero, Intro, Capabilities, Philosophy, OpenProof, ProductsTeaser, ContactCTA } from "@/components/company/Sections";

const TITLE = "UniqueHub — Technology Innovation & Implementation";
const DESC = "UniqueHub helps companies and startups identify, adopt and implement technology that creates real business value.";

const Home = () => (
  <>
    <Helmet>
      <title>{TITLE}</title>
      <meta name="description" content={DESC} />
      <link rel="canonical" href="https://uniquehub.xyz" />
      <meta property="og:title" content={TITLE} />
      <meta property="og:description" content={DESC} />
      <meta property="og:url" content="https://uniquehub.xyz" />
      <script type="application/ld+json">
        {JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "UniqueHub", url: "https://uniquehub.xyz", email: "info@uniquehub.xyz", description: DESC })}
      </script>
    </Helmet>
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <CompanyHero />
        <Intro />
        <Capabilities />
        <Philosophy />
        <OpenProof />
        <ProductsTeaser />
        <ContactCTA />
      </main>
      <Footer />
    </div>
  </>
);

export default Home;
