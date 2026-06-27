import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { MeetingsModule } from './meetings/meetings.module';
import { TeamsModule } from './teams/teams.module';
import { EmailModule } from './email/email.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { LivekitModule } from './livekit/livekit.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MeetingsModule,
    TeamsModule,
    EmailModule,
    IntegrationsModule,
    LivekitModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

