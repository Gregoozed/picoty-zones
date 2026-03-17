// Config for sequelize-cli (CommonJS required)
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'picoty_user',
    password: process.env.DB_PASS || 'changeme',
    database: process.env.DB_NAME || 'picoty_zones',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
  },
};
