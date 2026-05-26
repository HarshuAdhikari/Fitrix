import { Module } from "@nestjs/common";
import { ClientPortalController } from "./client-portal.controller";
import { ClientPortalService } from "./client-portal.service";
import { InvitationsModule } from "../invitations/invitations.module";

@Module({
  imports: [InvitationsModule],
  controllers: [ClientPortalController],
  providers: [ClientPortalService],
})
export class ClientPortalModule {}
