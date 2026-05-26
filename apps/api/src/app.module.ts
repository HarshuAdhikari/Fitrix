import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisCacheModule } from "./cache/redis-cache.module";
import { AuthModule } from "./auth/auth.module";
import { ClerkAuthGuard } from "./auth/clerk.guard";
import { RolesGuard } from "./auth/roles.guard";
import { HealthModule } from "./health/health.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { UsersModule } from "./users/users.module";
import { ExercisesModule } from "./exercises/exercises.module";
import { ProgramsModule } from "./programs/programs.module";
import { SchedulesModule } from "./schedules/schedules.module";
import { WorkoutsModule } from "./workouts/workouts.module";
import { ClientsModule } from "./clients/clients.module";
import { EmailModule } from "./email/email.module";
import { InvitationsModule } from "./invitations/invitations.module";
import { AdminModule } from "./admin/admin.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { ClientPortalModule } from "./client-portal/client-portal.module";

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisCacheModule,
    AuthModule,
    HealthModule,
    EmailModule,
    InvitationsModule,
    WebhooksModule,
    UsersModule,
    ExercisesModule,
    ProgramsModule,
    SchedulesModule,
    WorkoutsModule,
    ClientsModule,
    OrganizationsModule,
    ClientPortalModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ClerkAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
