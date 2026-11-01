/** @type {import('next').NextConfig} */

const path = require('path');

// Report-only until a preview runs clean. Articles hold images, video and frames from anywhere.
const CONTENT_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://res.wx.qq.com https://res2.wx.qq.com https://translate.google.com https://translate.googleapis.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://translate.googleapis.com https://www.gstatic.com",
  "img-src * data: blob:",
  "font-src 'self' data:",
  "media-src * blob:",
  "connect-src 'self' https:",
  "frame-src https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

const nextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Content-Security-Policy-Report-Only', value: CONTENT_POLICY },
      ],
    },
  ],
}

module.exports = nextConfig
