import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import { app, port } from './app';

dotenv.config();

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    await AppDataSource.synchronize();
    console.log('Data Source has been initialized');

    app.listen(port, () => {
      console.info(`Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Unhandled error during startup:', error);
  process.exit(1);
});
