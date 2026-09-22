/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV === 'development'
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isDevelopment ? ["'unsafe-eval'"] : []),
  'https://checkout.razorpay.com',
  'https://cdn.razorpay.com',
  'https://checkout-static-next.razorpay.com',
  'https://*.clerk.accounts.dev',
  'https://apis.google.com',
  'https://www.gstatic.com',
  'https://*.firebaseapp.com',
  'https://*.googleapis.com',
].join(' ')

const nextConfig = {
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    EXECUTION_SERVICE_URL: process.env.EXECUTION_SERVICE_URL,
    EXECUTION_SERVICE_TOKEN: process.env.EXECUTION_SERVICE_TOKEN,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL: process.env.GROQ_MODEL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
    ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
          { key: 'Content-Security-Policy', value: `default-src 'self'; script-src ${scriptSrc}; connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://checkout-static-next.razorpay.com https://cdn.razorpay.com https://*.clerk.accounts.dev https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseapp.com https://*.googleapis.com https://*.firebaseio.com; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://checkout-static-next.razorpay.com https://*.clerk.accounts.dev https://*.firebaseapp.com https://accounts.google.com https://apis.google.com; img-src 'self' data: blob: https://*.clerk.accounts.dev https://*.razorpay.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://*.gstatic.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:` },
        ],
      },
    ]
  },
}

export default nextConfig
