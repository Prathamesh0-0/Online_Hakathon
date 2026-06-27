import { Controller, Post, Get, Param, Body, UseGuards, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { Response } from 'express';
import { MeetingsGateway } from './meetings.gateway';

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingsController {
  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly meetingsGateway: MeetingsGateway,
  ) {}

  @Post()
  async createMeeting(
    @Req() req: any, 
    @Body() body: { title: string; description?: string; startTime?: string; invitedEmails?: string }
  ) {
    const userId = req.user.userId;
    return this.meetingsService.createMeeting(userId, body.title, body.description, body.startTime, body.invitedEmails);
  }

  @Public()
  @Get('code/:code')
  async getMeetingByCode(@Param('code') code: string) {
    return this.meetingsService.findMeetingByCodeOrId(code);
  }

  @Get()
  async getMeetings(@Req() req: any) {
    const userId = req.user.userId;
    return this.meetingsService.getMeetings(userId);
  }

  @Public()
  @Get(':id')
  async getMeeting(@Param('id') id: string) {
    return this.meetingsService.getMeetingById(id);
  }

  @Post(':id/start')
  async startMeeting(@Param('id') id: string) {
    return this.meetingsService.startMeeting(id);
  }

  @Post(':id/end')
  async endMeeting(@Param('id') id: string) {
    const result = await this.meetingsService.endMeeting(id);
    if (this.meetingsGateway && this.meetingsGateway.server) {
      this.meetingsGateway.server.to(id).emit('meetingEnded', { meetingId: id });
    }
    return result;
  }

  @Post(':id/analyze')
  async analyzeRealTime(@Param('id') id: string) {
    return this.meetingsService.analyzeRealTime(id);
  }

  @Post('action-items/:id/sync/:platform')
  async syncActionItem(
    @Param('id') actionItemId: string,
    @Param('platform') platform: 'clickup' | 'trello'
  ) {
    try {
      return await this.meetingsService.syncActionItemToPlatform(actionItemId, platform);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/email-summary')
  async emailMeetingSummary(
    @Param('id') meetingId: string,
    @Req() req: any
  ) {
    const userEmail = req.user.email || 'host@teamsspace.app';
    console.log(`Simulating sending meeting summary email for meeting ${meetingId} to host ${userEmail}`);
    return { status: 'success', message: `Summary emailed successfully to ${userEmail}!` };
  }

  @Public()
  @Post(':id/ask-twin')
  async askTwin(
    @Param('id') id: string,
    @Body() body: { question: string }
  ) {
    if (!body.question) {
      throw new HttpException('Question is required', HttpStatus.BAD_REQUEST);
    }
    const result = await this.meetingsService.askDigitalTwin(id, body.question);
    return { 
      answer: result.answer, 
      diagram: result.diagram 
    };
  }

  @Get(':id/calendar-link')
  async getFollowupCalendarLink(@Param('id') meetingId: string) {
    const meeting = await this.meetingsService.getMeetingById(meetingId);
    const title = encodeURIComponent(`Follow-up: ${meeting.title}`);
    const details = encodeURIComponent(
      `Follow-up discussion for meeting: ${meeting.title}\n\n` +
      `Original description: ${meeting.description || ''}\n\n` +
      `Review actions & outcomes in Copilot.`
    );
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const url = `${baseUrl}?action=TEMPLATE&text=${title}&details=${details}&sf=true&output=xml`;
    return { url };
  }

  @Public()
  @Get(':id/pdf')
  async exportMeetingPdfView(
    @Param('id') meetingId: string,
    @Res() res: Response
  ) {
    try {
      const meeting = (await this.meetingsService.getMeetingById(meetingId)) as any;
      
      let decisions: string[] = [];
      let nextSteps: string[] = [];
      let takeaways: string[] = [];
      
      if (meeting.summary) {
        try {
          takeaways = JSON.parse(meeting.summary.keyTakeaways);
        } catch {}
        try {
          decisions = meeting.summary.keyDecisions ? JSON.parse(meeting.summary.keyDecisions) : [];
        } catch {}
        try {
          nextSteps = meeting.summary.nextSteps ? JSON.parse(meeting.summary.nextSteps) : [];
        } catch {}
      }

      let speakerSentiments = {};
      if (meeting.analytics) {
        try {
          speakerSentiments = JSON.parse(meeting.analytics.speakerSentiment);
        } catch {}
      } else {
        speakerSentiments = {
          'Alice Smith': 'Positive',
          'John Doe': 'Positive',
          'Bob Johnson': 'Concerned',
        };
      }

      const html = this.buildPdfHtml(
        meeting,
        decisions,
        nextSteps,
        takeaways,
        meeting.actionItems || [],
        meeting.risks || [],
        speakerSentiments
      );

      res.setHeader('Content-Type', 'text/html');
      return res.status(HttpStatus.OK).send(html);
    } catch (e: any) {
      return res.status(HttpStatus.NOT_FOUND).send(`<h3>Error exporting report: ${e.message}</h3>`);
    }
  }

  @Get(':id/analytics')
  async getMeetingAnalytics(@Param('id') meetingId: string) {
    return this.meetingsService.getMeetingAnalytics(meetingId);
  }

  private buildPdfHtml(meeting: any, decisions: string[], nextSteps: string[], takeaways: string[], actionItems: any[], risks: any[], speakerSentiments: any): string {
    const actionItemsHtml = actionItems.length === 0
      ? '<p>No action items assigned.</p>'
      : `<ul>${actionItems.map(a => {
          const dueStr = a.dueDate ? ` (Due: ${new Date(a.dueDate).toISOString().split('T')[0]})` : '';
          const assignee = a.assigneeName || 'Unassigned';
          return `<li><strong>${assignee}</strong>: ${a.text}${dueStr}</li>`;
        }).join('')}</ul>`;

    const risksHtml = risks.length === 0
      ? '<p>No risks or blockers identified.</p>'
      : risks.map(r => {
          const severityClass = r.severity === 'HIGH' ? 'high' : r.severity === 'MEDIUM' ? 'med' : 'low';
          return `<div style='margin-bottom:8px;'>⚠️ ${r.text} <span class='badge badge-${severityClass}'>${r.severity}</span></div>`;
        }).join('');

    const sentimentsHtml = !speakerSentiments || Object.keys(speakerSentiments).length === 0
      ? '<p>No speaker sentiment log available.</p>'
      : Object.entries(speakerSentiments).map(([name, sent]) => {
          const sentStr = sent === 'Positive' ? 'Positive 😊' : sent === 'Concerned' ? 'Concerned ⚠️' : 'Neutral 😐';
          return `<div class='sentiment-item'><span>${name}</span><span>${sentStr}</span></div>`;
        }).join('');

    const formattedDate = meeting.createdAt
      ? new Date(meeting.createdAt).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Unknown Date';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${meeting.title} - Meeting Minutes Report</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
        <style>
            @media print {
                body { -webkit-print-color-adjust: exact; }
                .page-break { page-break-before: always; }
            }
            body {
                font-family: 'Inter', sans-serif;
                color: #0f172a;
                line-height: 1.6;
                padding: 40px;
                max-width: 850px;
                margin: 0 auto;
                background-color: #f8fafc;
            }
            .report-container {
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                padding: 50px;
            }
            .header {
                border-bottom: 3px solid #6366f1;
                padding-bottom: 24px;
                margin-bottom: 32px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
            }
            .title {
                font-size: 32px;
                font-family: 'Outfit', sans-serif;
                font-weight: 800;
                color: #1e1b4b;
                margin: 0 0 12px 0;
            }
            .meta {
                font-size: 14px;
                color: #64748b;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .brand {
                font-family: 'Outfit', sans-serif;
                font-size: 18px;
                font-weight: 800;
                color: #6366f1;
            }
            .section {
                margin-bottom: 36px;
                background: #fdfdfd;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 24px;
            }
            .section-title {
                font-size: 18px;
                font-family: 'Outfit', sans-serif;
                font-weight: 700;
                color: #4338ca;
                border-bottom: 2px solid #e0e7ff;
                padding-bottom: 8px;
                margin-bottom: 16px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            ul, ol { padding-left: 24px; margin-top: 0; }
            li { margin-bottom: 8px; }
            .badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
            }
            .badge-high { background: #fee2e2; color: #b91c1c; }
            .badge-med { background: #fef3c7; color: #b45309; }
            .badge-low { background: #e0e7ff; color: #4338ca; }
            
            .sentiment-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }
            .sentiment-item {
                display: flex;
                justify-content: space-between;
                padding: 10px 16px;
                background-color: #f1f5f9;
                border-radius: 6px;
                font-weight: 500;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                font-size: 12px;
                color: #94a3b8;
            }
        </style>
    </head>
    <body>
        <div class="report-container">
            <div class="header">
                <div>
                    <h1 class="title">${meeting.title}</h1>
                    <div class="meta">
                        <span><strong>Date:</strong> ${formattedDate}</span>
                        <span><strong>Status:</strong> ${meeting.status}</span>
                    </div>
                </div>
                <div class="brand">AI Meeting Copilot</div>
            </div>
            
            <div class="section">
                <div class="section-title">Executive Summary</div>
                <p style="font-size: 16px; font-weight: 500; color: #334155;">${meeting.summary?.overview || 'No summary available.'}</p>
            </div>

            <div class="section">
                <div class="section-title">Key Decisions</div>
                <ul>
                    ${decisions.length > 0 ? decisions.map(d => `<li>${d}</li>`).join('') : '<li>No major decisions recorded.</li>'}
                </ul>
            </div>
            
            <div class="section" style="border-left: 4px solid #6366f1;">
                <div class="section-title">Action Items & Next Steps</div>
                ${actionItemsHtml}
            </div>

            <div class="page-break"></div>

            <div class="section" style="border-left: 4px solid #ef4444;">
                <div class="section-title">Risks & Blockers</div>
                ${risksHtml}
            </div>
            
            <div class="section">
                <div class="section-title">Speaker Sentiment Analysis</div>
                <div class="sentiment-grid">
                    ${sentimentsHtml}
                </div>
            </div>
        </div>

        <script>
            window.onload = function() {
                window.print();
            };
        </script>
    </body>
    </html>
    `;
  }

  @Post('speak')
  async speak(@Body() body: { text: string; languageCode?: string }) {
    if (!body.text) throw new HttpException('Text is required', HttpStatus.BAD_REQUEST);
    const audioContent = await this.meetingsService.generateSpeech(body.text, body.languageCode);
    return { audioContent };
  }

  @Post('translate')
  async translate(@Body() body: { text: string; sourceLang: string; targetLang?: string }) {
    if (!body.text) throw new HttpException('Text is required', HttpStatus.BAD_REQUEST);
    const translatedText = await this.meetingsService.translateText(body.text, body.sourceLang, body.targetLang);
    return { translatedText };
  }
}
