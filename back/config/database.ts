import dotenv from 'dotenv';
import type { Options } from 'sequelize';

dotenv.config();

const config: Options = {
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  database: process.env.DB_NAME || 'picoty_zones',
  username: process.env.DB_USER || 'picoty_user',
  password: process.env.DB_PASS || 'changeme',
  logging: process.env.NODE_ENV === 'production' ? false : console.log,
  define: {
    underscored: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
};

export default config;
