import { describe, expect, it } from "vitest";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module.js";

describe("Health endpoint", () => {
  it("returns an API health response", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();

    await request(app.getHttpServer())
      .get("/api/health")
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe("ok");
        expect(body.service).toBe("api");
        expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
      });

    await app.close();
  });
});
