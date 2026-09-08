import dotenv from 'dotenv';

dotenv.config();

// Auto-normalize Python/SQLAlchemy postgresql+psycopg:// to standard postgresql://
let rawDbUrl = process.env.DATABASE_URL || '';
if (rawDbUrl.startsWith('postgresql+psycopg://')) {
  rawDbUrl = rawDbUrl.replace('postgresql+psycopg://', 'postgresql://');
  process.env.DATABASE_URL = rawDbUrl;
} else if (rawDbUrl.startsWith('postgres+psycopg://')) {
  rawDbUrl = rawDbUrl.replace('postgres+psycopg://', 'postgresql://');
  process.env.DATABASE_URL = rawDbUrl;
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  host: process.env.HOST || '127.0.0.1',
  port: parseInt(process.env.PORT || '4000', 10),

  databaseUrl: process.env.DATABASE_URL || '',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/auth/google/callback',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_please_change_in_production',
    expiresIn: '30d' as const,
  },

  cookie: {
    name: 'auth_token',
    domain: process.env.COOKIE_DOMAIN || undefined,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Days in milliseconds
  },

  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://shabu.longwarp.com,https://toll.longwarp.com,https://trade.longwarp.com')
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean),
  },
};
