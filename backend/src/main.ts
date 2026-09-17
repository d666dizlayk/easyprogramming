import "dotenv/config";
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const port = Number(process.env.PORT || 3001);
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server running on port ${port}`);
}
bootstrap();

