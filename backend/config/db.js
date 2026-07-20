import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const database = process.env.MYSQL_DATABASE || 'safewatch';
const username = process.env.MYSQL_USER || 'root';
const password = process.env.MYSQL_PASSWORD || '';
const host = process.env.MYSQL_HOST || 'localhost';
const port = parseInt(process.env.MYSQL_PORT || '3306', 10);

export const sequelize = new Sequelize(database, username, password, {
  host: host,
  port: port,
  dialect: 'mysql',
  logging: false,
  define: {
    timestamps: true, // Default to true, we can override per model
  }
});

export async function connectDB() {
  // First, verify and auto-create the database if it does not exist
  const connection = await mysql.createConnection({
    host,
    port,
    user: username,
    password,
  });
  
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
  await connection.end();

  // Connect via Sequelize and synchronize schemas
  await sequelize.authenticate();
  console.log(`✅ MySQL connected: ${host}:${port}/${database}`);
  await sequelize.sync({ alter: true });
  console.log('✅ MySQL tables synchronized successfully.');
}
