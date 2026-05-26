import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
  const expressApp = app.getHttpAdapter().getInstance();

  // Browsers request this automatically when opening the API URL directly.
  expressApp.get("/favicon.ico", (_req: unknown, res: { status: (code: number) => { end: () => void } }) =>
    res.status(204).end(),
  );

  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://localhost:19006",
      "http://localhost:8081",
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  Logger.log(`FitRix API listening on http://localhost:${port}/api/v1`, "Bootstrap");
}

bootstrap();
