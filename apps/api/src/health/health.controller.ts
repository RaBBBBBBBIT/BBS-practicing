import { Controller, Get } from "@nestjs/common";
import { createHealthResponse, type HealthResponse } from "@bbs/shared";

@Controller("health")
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return createHealthResponse("api");
  }
}
