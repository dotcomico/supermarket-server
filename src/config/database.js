import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

 const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_STORAGE || "./database.sqlite",
  logging: false, // Set to console.log to see SQL queries in terminal
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite Database connected successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

export { sequelize, connectDB };
export default sequelize;
