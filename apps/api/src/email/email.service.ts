import { Injectable, Logger, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

interface InvitationEmailInput {
  to: string;
  firstName?: string | null;
  coachName: string;
  activationUrl: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    this.fromEmail =
      this.config.get<string>("RESEND_FROM_EMAIL") ?? "onboarding@resend.dev";

    if (!apiKey) {
      this.logger.warn(
        "RESEND_API_KEY not set — EmailService will log emails instead of sending them.",
      );
      this.resend = null;
    } else {
      this.resend = new Resend(apiKey);
    }
  }

  async sendInvitationEmail(input: InvitationEmailInput): Promise<void> {
    const greeting = input.firstName ? `Hi ${input.firstName},` : "Hi there,";
    const subject = `${input.coachName} invited you to train with FitRix`;
    const html = this.renderInvitationHtml({
      greeting,
      coachName: input.coachName,
      activationUrl: input.activationUrl,
    });
    const text = `${greeting}

${input.coachName} is inviting you to train together using FitRix — a coaching app that keeps your workouts, check-ins, and progress in one place.

Accept your invitation and create your account:
${input.activationUrl}

This invite link expires in 7 days.

— The FitRix team`;

    if (!this.resend) {
      this.logger.log(
        `[DEV-ONLY] Would send invitation email to ${input.to}:\n${text}`,
      );
      return;
    }

    const isDev = this.config.get<string>("NODE_ENV") !== "production";

    try {
      const result = await this.resend.emails.send({
        from: `FitRix <${this.fromEmail}>`,
        to: input.to,
        subject,
        html,
        text,
      });
      if (result.error) {
        // In dev, Resend restricts sends to your own verified address until a
        // domain is added. Fall back to logging the activation link so you can
        // still test the full flow locally.
        if (isDev) {
          this.logger.warn(
            `[DEV] Resend blocked email to ${input.to}: ${result.error.message}`,
          );
          this.logger.log(
            `[DEV] Activation URL for ${input.to}:\n  ${input.activationUrl}`,
          );
          return;
        }
        this.logger.error(
          `Resend rejected email to ${input.to}: ${result.error.message}`,
        );
        throw new InternalServerErrorException("Failed to send invitation email");
      }
      this.logger.log(`Invitation email sent to ${input.to} (id=${result.data?.id})`);
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      if (isDev) {
        this.logger.warn(
          `[DEV] Email send failed for ${input.to} — continuing anyway. Activation URL:\n  ${input.activationUrl}`,
        );
        return;
      }
      this.logger.error(
        `Unexpected error sending invitation to ${input.to}`,
        err as Error,
      );
      throw new InternalServerErrorException("Failed to send invitation email");
    }
  }

  private renderInvitationHtml(args: {
    greeting: string;
    coachName: string;
    activationUrl: string;
  }): string {
    return `<!doctype html>
<html>
  <body style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 32px;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px; color: white;">
        <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.85;">FitRix</p>
        <h1 style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700;">You're invited to train</h1>
      </div>
      <div style="padding: 32px; color: #334155; font-size: 15px; line-height: 1.6;">
        <p style="margin: 0 0 16px 0;">${args.greeting}</p>
        <p style="margin: 0 0 16px 0;"><strong>${args.coachName}</strong> invited you to train with them on FitRix — a single place for workouts, check-ins, and progress tracking.</p>
        <p style="margin: 0 0 24px 0;">Click below to accept the invitation and set up your account. This link expires in 7 days.</p>
        <p style="margin: 0 0 32px 0; text-align: center;">
          <a href="${args.activationUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px;">Accept invitation</a>
        </p>
        <p style="margin: 0; color: #64748b; font-size: 13px;">If the button doesn't work, paste this link into your browser:<br><a href="${args.activationUrl}" style="color: #2563eb; word-break: break-all;">${args.activationUrl}</a></p>
      </div>
      <div style="padding: 20px 32px; background: #f8fafc; color: #94a3b8; font-size: 12px; text-align: center; border-top: 1px solid #e2e8f0;">
        You received this email because ${args.coachName} sent you a FitRix invitation.<br>If you weren't expecting this, you can safely ignore it.
      </div>
    </div>
  </body>
</html>`;
  }
}
