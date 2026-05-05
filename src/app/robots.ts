import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/privacy', '/terms', '/cookies'],
        disallow: ['/dashboard', '/seeker/', '/recruiter/', '/api/', '/settings', '/messages', '/applications', '/profile'],
      },
    ],
    sitemap: 'https://matchconnect.se/sitemap.xml',
  }
}
