/** @type {import('next').NextConfig} */

const path = require('path');

// Articles hold images, video and frames from anywhere. The webpack build has no inline script, which Turbopack's would need.
// ponytail: the inline code Google Translate runs. If Google changes it, the language list goes empty, and the new hash
// is in the browser's console error. Pages without the translator are unaffected.
const GOOGLE_TRANSLATE_INLINE = "'sha256-R6kjt5FwTd5vAw94Q08NLDZsSaGTzg4NsdIfKtECSp0='";

const CONTENT_POLICY = [
  "default-src 'self'",
  `script-src 'self' ${GOOGLE_TRANSLATE_INLINE} https://res.wx.qq.com https://res2.wx.qq.com https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://www.gstatic.com`,
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
        { key: 'Content-Security-Policy', value: CONTENT_POLICY },
      ],
    },
  ],
}

module.exports = nextConfig
