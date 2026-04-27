import type { MetadataRoute } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dynastyinsurancegroup.com"

const PUBLIC_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/individual", priority: 0.9, changeFrequency: "weekly" },
  { path: "/family", priority: 0.9, changeFrequency: "weekly" },
  { path: "/business", priority: 0.9, changeFrequency: "weekly" },
  { path: "/cobra", priority: 0.9, changeFrequency: "weekly" },
  { path: "/ppo", priority: 0.9, changeFrequency: "weekly" },
  { path: "/self-employed", priority: 0.9, changeFrequency: "weekly" },
  { path: "/recruit", priority: 0.6, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "monthly" },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return PUBLIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))
}
