import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

const port = Number(process.env.API_PORT ?? process.env.PORT ?? 4000);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true
  });
  await app.listen(port);
}

void bootstrap();
