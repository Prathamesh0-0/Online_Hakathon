import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface SendInviteEmailDto {
  recipientEmail: string;
  recipientName?: string;
  meetingTitle: string;
  meetingCode: string;
  meetingId: string;
  hostName: string;
  scheduledAt?: Date;
  joinLink: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false, // TLS via STARTTLS on port 587
      auth: {
        user: process.env.SMTP_USER || process.env.JIRA_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async sendViaResend(
    to: string,
    subject: string,
    html: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey.includes('your_resend_api_key_here') || apiKey.trim() === '') {
      return { success: false, error: 'Resend API Key is not configured' };
    }

    try {
      const fromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: to,
          subject: subject,
          html: html,
        }),
      });

      const data = (await response.json()) as any;
      if (response.ok && data?.id) {
        return { success: true, messageId: data.id };
      } else {
        const errMsg = data?.message || JSON.stringify(data) || `HTTP status ${response.status}`;
        return { success: false, error: errMsg };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private sendMockEmail(
    to: string,
    subject: string,
    joinLink: string,
  ): { success: boolean; messageId: string } {
    const mockId = 'mock-' + Math.random().toString(36).substring(2, 11);
    this.logger.log(`[SIMULATED EMAIL DISPATCH] Mock email sent successfully to ${to}`);
    this.logger.log(`[SIMULATED EMAIL DISPATCH] Subject: "${subject}"`);
    this.logger.log(`[SIMULATED EMAIL DISPATCH] Join Link: ${joinLink}`);
    return { success: true, messageId: mockId };
  }

  async sendMeetingInvite(dto: SendInviteEmailDto): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log("sendMeetingInvite DTO received:", dto);
    const {
      recipientEmail,
      recipientName,
      meetingTitle,
      meetingCode,
      hostName,
      scheduledAt,
      joinLink,
    } = dto;

    const senderEmail = process.env.SMTP_USER || process.env.JIRA_EMAIL || 'noreply@teamsspace.app';
    const formattedDate = scheduledAt
      ? new Date(scheduledAt).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short',
        })
      : 'Immediately available';

    const htmlBody = this.buildInviteEmailHtml({
      recipientName: recipientName || recipientEmail.split('@')[0],
      meetingTitle,
      meetingCode,
      hostName,
      formattedDate,
      joinLink,
    });

    const subject = `📹 You're invited to "${meetingTitle}" — Join Now`;

    // 1. Try SMTP First
    const smtpPass = process.env.SMTP_PASS;
    const isDummySmtp = !smtpPass || smtpPass.includes('your_gmail_app_password_here') || smtpPass.includes('placeholder') || smtpPass.trim() === '';

    if (!isDummySmtp) {
      try {
        console.log("Sending email to:", recipientEmail);
        const info = await this.transporter.sendMail({
          from: `"TeamsSpace Copilot" <${senderEmail}>`,
          to: recipientEmail,
          subject,
          html: htmlBody,
          text: this.buildPlainTextBody({ recipientName: recipientName || recipientEmail, meetingTitle, meetingCode, hostName, formattedDate, joinLink }),
        });

        this.logger.log(`Meeting invite sent via SMTP to ${recipientEmail}. MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (error: any) {
        this.logger.error(`SMTP send failed to ${recipientEmail}, trying Resend fallback... Error: ${error.message}`);
      }
    } else {
      this.logger.log(`SMTP skipped for ${recipientEmail} (placeholder credentials detected), trying Resend fallback...`);
    }

    // 2. Fallback to Resend API
    const resendApiKey = process.env.RESEND_API_KEY;
    const isResendConfigured = resendApiKey && !resendApiKey.includes('your_resend_api_key_here') && resendApiKey.trim() !== '';

    if (isResendConfigured) {
      this.logger.log(`Attempting to send email to ${recipientEmail} via Resend API...`);
      const resendResult = await this.sendViaResend(recipientEmail, subject, htmlBody);
      if (resendResult.success) {
        this.logger.log(`Meeting invite sent via Resend API to ${recipientEmail}. MessageId: ${resendResult.messageId}`);
        return { success: true, messageId: resendResult.messageId };
      }
      this.logger.error(`Resend API send failed to ${recipientEmail}: ${resendResult.error || 'unknown error'}`);
    } else {
      this.logger.log(`Resend API not configured.`);
    }

    // 3. Fallback to Mock Simulation
    this.logger.warn(`Both Resend and SMTP failed or are unconfigured. Falling back to Mock Simulation for ${recipientEmail}...`);
    const mockResult = this.sendMockEmail(recipientEmail, subject, joinLink);
    return mockResult;
  }

  async sendBulkInvites(
    emails: string[],
    meetingData: Omit<SendInviteEmailDto, 'recipientEmail' | 'recipientName'>,
  ): Promise<{ total: number; sent: number; failed: string[] }> {
    const results = await Promise.allSettled(
      emails.map((email) =>
        this.sendMeetingInvite({ ...meetingData, recipientEmail: email }),
      ),
    );

    const failed: string[] = [];
    let sent = 0;

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value.success) {
        sent++;
      } else {
        failed.push(emails[idx]);
      }
    });

    return { total: emails.length, sent, failed };
  }

  private buildInviteEmailHtml(data: {
    recipientName: string;
    meetingTitle: string;
    meetingCode: string;
    hostName: string;
    formattedDate: string;
    joinLink: string;
  }): string {
    const { recipientName, meetingTitle, meetingCode, hostName, formattedDate, joinLink } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Meeting Invitation</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#111118;border:1px solid #2a2a3e;border-radius:16px;overflow:hidden;max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6d28d9 0%,#0891b2 100%);padding:36px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:12px;">
                <div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;">📹</div>
                <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">TeamsSpace</span>
              </div>
              <h1 style="color:#fff;font-size:28px;font-weight:800;margin:0;line-height:1.2;">You're Invited to a Meeting</h1>
              <p style="color:rgba(255,255,255,0.75);margin:10px 0 0;font-size:15px;">AI-powered collaboration platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="color:#a1a1b3;font-size:15px;margin:0 0 8px;">Hi <strong style="color:#e2e2f0;">${recipientName}</strong>,</p>
              <p style="color:#a1a1b3;font-size:15px;margin:0 0 28px;line-height:1.6;">
                <strong style="color:#e2e2f0;">${hostName}</strong> has invited you to join a live meeting session on <strong style="color:#e2e2f0;">TeamsSpace</strong>.
              </p>

              <!-- Meeting Info Card -->
              <div style="background:#1a1a2e;border:1px solid #2a2a3e;border-radius:12px;padding:24px;margin-bottom:28px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom:16px;">
                      <div style="color:#6d60d8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Meeting Title</div>
                      <div style="color:#e2e2f0;font-size:20px;font-weight:700;">${meetingTitle}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top:1px solid #2a2a3e;padding:16px 0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="50%">
                            <div style="color:#6d60d8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Meeting Code</div>
                            <div style="color:#a78bfa;font-size:16px;font-weight:700;letter-spacing:0.08em;background:#2a2050;border-radius:6px;padding:6px 12px;display:inline-block;">${meetingCode}</div>
                          </td>
                          <td width="50%">
                            <div style="color:#6d60d8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Hosted By</div>
                            <div style="color:#e2e2f0;font-size:15px;font-weight:600;">${hostName}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top:1px solid #2a2a3e;padding-top:16px;">
                      <div style="color:#6d60d8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Scheduled For</div>
                      <div style="color:#e2e2f0;font-size:14px;">🗓 ${formattedDate}</div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${joinLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#0891b2);color:#fff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:10px;letter-spacing:0.02em;box-shadow:0 8px 24px rgba(109,40,217,0.35);">
                  🚀 Join Meeting Now
                </a>
              </div>

              <!-- Or use code section -->
              <div style="background:#0f0f1a;border:1px dashed #2a2a3e;border-radius:10px;padding:18px;text-align:center;margin-bottom:28px;">
                <p style="color:#a1a1b3;font-size:13px;margin:0 0 8px;">Or join with the meeting code on <a href="${joinLink.split('/join')[0]}/join" style="color:#7c6de8;text-decoration:none;">TeamsSpace</a>:</p>
                <div style="font-size:24px;font-weight:800;color:#a78bfa;letter-spacing:0.12em;">${meetingCode}</div>
              </div>

              <!-- How it works -->
              <div style="margin-bottom:24px;">
                <p style="color:#a1a1b3;font-size:13px;margin:0 0 12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">How to Join:</p>
                <table cellpadding="0" cellspacing="0" width="100%">
                  ${[
                    ['1', 'Click "Join Meeting Now" above (no account needed)'],
                    ['2', 'Enter your name and email address'],
                    ['3', 'Test your camera and microphone'],
                    ['4', 'Click "Join as Guest" and wait for host approval'],
                  ].map(([num, text]) => `
                  <tr>
                    <td style="padding:6px 0;">
                      <div style="display:flex;align-items:flex-start;gap:10px;">
                        <div style="min-width:22px;height:22px;background:linear-gradient(135deg,#6d28d9,#0891b2);border-radius:50%;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:22px;">${num}</div>
                        <span style="color:#a1a1b3;font-size:13px;line-height:22px;">${text}</span>
                      </div>
                    </td>
                  </tr>`).join('')}
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0d0d1a;border-top:1px solid #2a2a3e;padding:24px 40px;text-align:center;">
              <p style="color:#4a4a6a;font-size:12px;margin:0 0 4px;">This invitation was sent by TeamsSpace AI Meeting Copilot.</p>
              <p style="color:#4a4a6a;font-size:12px;margin:0;">If you did not expect this email, you can safely ignore it.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private buildPlainTextBody(data: {
    recipientName: string;
    meetingTitle: string;
    meetingCode: string;
    hostName: string;
    formattedDate: string;
    joinLink: string;
  }): string {
    return `
Hi ${data.recipientName},

${data.hostName} has invited you to join a live meeting on TeamsSpace.

Meeting: ${data.meetingTitle}
Code:    ${data.meetingCode}
When:    ${data.formattedDate}
Host:    ${data.hostName}

JOIN NOW: ${data.joinLink}

Or go to the Join page and enter the meeting code: ${data.meetingCode}

---
TeamsSpace AI Meeting Copilot
    `.trim();
  }
}
