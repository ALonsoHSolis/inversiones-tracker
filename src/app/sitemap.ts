import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

const BASE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    { url: BASE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/como-funciona`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/calculadora`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
    ...posts,
    { url: `${BASE_URL}/terminos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/disclaimer`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
