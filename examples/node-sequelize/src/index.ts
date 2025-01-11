import dotenv from 'dotenv';
import { initializeDatabase } from './database';
import { app, port } from './app';

dotenv.config();

async function bootstrap() {
  try {
    await initializeDatabase();

    app.listen(port, () => {
      console.info(`Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize application', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Unhandled error during startup', error);
  process.exit(1);
});
