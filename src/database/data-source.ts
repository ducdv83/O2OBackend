import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

function parseDatabaseUrl(databaseUrl: string): {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
} | null {
  try {
    const url = new URL(databaseUrl);
    if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') return null;

    const database = url.pathname.replace(/^\//, '');
    return {
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 5432,
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database,
    };
  } catch {
    return null;
  }
}

const databaseUrl = process.env.DATABASE_URL;
const parsed = databaseUrl ? parseDatabaseUrl(databaseUrl) : null;

const dataSourceOptions: DataSourceOptions = parsed
  ? {
      type: 'postgres',
      host: parsed.host,
      port: parsed.port,
      username: parsed.username,
      password: parsed.password,
      database: parsed.database,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: false,
      logging: true,
      ssl: { rejectUnauthorized: false },
    }
  : {
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'o2o_db',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: false,
      logging: true,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

export const AppDataSource = new DataSource(dataSourceOptions);

