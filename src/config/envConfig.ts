import dotenv from 'dotenv';

dotenv.config();

export const NODE_ENV = process.env.NODE_ENV as string;
const LOCAL_ORIGIN = process.env.LOCAL_ORIGIN as string;
const PRODUCTION_ORIGIN = process.env.PRODUCTION_ORIGIN as string;
const LOCAL_DB_URL = process.env.LOCAL_DB_URL as string;
const PRODUCTION_DB_URL = process.env.PRODUCTION_DB_URL as string;
const PRODUCTION_ENV = NODE_ENV === 'production';

export const PORT = process.env.PORT as string;
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
export const SALT_ROUNDS = Number(process.env.SALT_ROUNDS as string);
export const DATABASE_URL = PRODUCTION_ENV ? PRODUCTION_DB_URL : LOCAL_DB_URL;
export const ALLOWED_ORIGIN = PRODUCTION_ENV ? PRODUCTION_ORIGIN : LOCAL_ORIGIN;