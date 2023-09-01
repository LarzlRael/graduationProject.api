import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
export { ConfigService, ConfigModule } from '@nestjs/config';

export const databasePoolFactory = async (configService: ConfigService) => {
  return new Pool({
    host: process.env.HOST,
    port: 5432,
    user: 'postgres',
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
  });
};