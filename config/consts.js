import path from 'path';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export default {
  logFileDir      : path.join(__dirname, '../log'),
  logFileName     : 'app-%DATE%.log',
  dbHost          : process.env.dbHost || 'localhost',
  dbPort          : process.env.dbPort || '27017',
  dbName          : process.env.dbName || 'apartments',
  dbUser          : process.env.dbUser || 'root',
  dbPassword      : process.env.dbPassword || 'password',
  serverPort      : process.env.PORT || 8000,
  SALT_WORK_FACTOR: process.env.SALT_WORK_FACTOR || 10,
  JWT_SECRET      : process.env.JWT_SECRET || 'JWT_SECRET',
  ADMIN_EMAIL     : process.env.APARTMENT_ADMIN_EMAIL || 'admin@example.com',
  ADMIN_PASSWORD  : process.env.APARTMENT_ADMIN_PASSWORD || 'qwer1234'
}
