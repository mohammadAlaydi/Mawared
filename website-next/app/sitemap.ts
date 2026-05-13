import type { MetadataRoute } from "next";

// Single-page marketing site for now. When new routes are added, append
// them here so crawlers discover them.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://mawared.sa"
  ).replace(/\/$/, "");

  return [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
