import { BlogSection } from "@/components/sections/BlogSection";
import { Helmet } from "react-helmet-async";

const Blog = () => {
  return (
    <>
      <Helmet>
        <title>Blog - UniqueHub</title>
        <meta name="description" content="Read the latest Web3 insights, tutorials and news on UniqueHub blog" />
        <meta property="og:title" content="Blog - UniqueHub" />
        <meta property="og:description" content="Read the latest Web3 insights, tutorials and news on UniqueHub blog" />
        <meta property="og:image" content="https://uniqueehub.vercel.app/opengraph-image.png" />
        <meta property="og:url" content="https://uniqueehub.vercel.app/blog" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:button:1" content="Read Blog" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://uniqueehub.vercel.app/blog" />
      </Helmet>
      <BlogSection />
    </>
  );
};

export default Blog;
