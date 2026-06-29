import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  @Get('status')
  getStatus() {
    return {
      slack: !!process.env.SLACK_WEBHOOK_URL,
      clickup: !!process.env.CLICKUP_ACCESS_TOKEN,
    };
  }
}
