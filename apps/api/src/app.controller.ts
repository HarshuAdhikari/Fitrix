import { Controller, Get } from "@nestjs/common";
import { Public } from "./auth/decorators/public.decorator";

@Controller()
export class AppController {
  @Public()
  @Get()
  getRoot() {
    return {
      service: "fitrix-api",
      status: "ok",
      docs: {
        health: "/api/v1/health",
      },
    };
  }
}
