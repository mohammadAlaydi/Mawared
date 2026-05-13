import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://mawared.sa"
  ).replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing private on the marketing site yet; keep the deny list empty
        // until/unless we add gated routes.
        disallow: [],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
