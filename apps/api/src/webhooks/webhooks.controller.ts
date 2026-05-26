import {
  Controller,
  Post,
  Headers,
  Req,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Webhook } from "svix";
import { Request } from "express";
import { Public } from "../auth/decorators/public.decorator";
import { WebhooksService } from "./webhooks.service";

@Controller("webhooks")
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly webhooksService: WebhooksService,
  ) {}

  @Public()
  @Post("clerk")
  async handleClerk(
    @Req() req: Request,
    @Headers("svix-id") svixId: string,
    @Headers("svix-timestamp") svixTimestamp: string,
    @Headers("svix-signature") svixSignature: string,
  ): Promise<{ received: boolean }> {
    const secret = this.config.get<string>("CLERK_WEBHOOK_SECRET");
    if (!secret) {
      throw new BadRequestException("Webhook secret not configured");
    }

    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody) {
      throw new BadRequestException("Raw body not available");
    }

    const wh = new Webhook(secret);
    let event: { type: string; data: any };

    try {
      event = wh.verify(rawBody.toString("utf8"), {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as { type: string; data: any };
    } catch (err) {
      this.logger.warn(`Webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException("Invalid webhook signature");
    }

    this.logger.log(`Received Clerk webhook: ${event.type}`);

    switch (event.type) {
      case "user.created":
        await this.webhooksService.handleUserCreated(event.data);
        break;
      case "user.updated":
        await this.webhooksService.handleUserUpdated(event.data);
        break;
      case "user.deleted":
        await this.webhooksService.handleUserDeleted(event.data);
        break;
      default:
        this.logger.debug(`Unhandled webhook event type: ${event.type}`);
    }

    return { received: true };
  }
}
