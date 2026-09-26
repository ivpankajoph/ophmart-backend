import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`  OPHMNART Luxury E-Commerce Backend     `);
      console.log(`  Server listening on port ${PORT}       `);
      console.log(`  API Base: http://localhost:${PORT}/api `);
      console.log(`  API Docs: http://localhost:${PORT}/api/docs`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
};

startServer();
