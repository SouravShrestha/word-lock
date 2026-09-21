import type { MetadataRoute } from "next";

/**
 * `/robots.txt`.
 *
 * Generated rather than dropped in `public/`, so the sitemap URL follows the
 * deployment instead of being hardcoded. A static `public/robots.txt` would win
 * over this route silently — that is how the sitemap pointer went missing once
 * already, so do not add one back.
 *
 * `Mediapartners-Google` is spelled out even though `*` already allows it: it is
 * the AdSense crawler, and the ads on this site depend on it being able to read
 * the pages it serves ads against.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    rules: [
      { userAgent: "Mediapartners-Google", allow: "/" },
      { userAgent: "*", allow: "/" },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
