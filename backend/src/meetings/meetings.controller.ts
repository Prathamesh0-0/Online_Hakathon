import { Controller, Post, Get, Patch, Param, Body, UseGuards, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
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
    @Param('platform') platform: 'clickup'
  ) {
    try {
      return await this.meetingsService.syncActionItemToPlatform(actionItemId, platform);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch('action-items/:id')
  async updateActionItem(
    @Param('id') id: string,
    @Body() body: { assigneeName?: string; status?: string }
  ) {
    try {
      return await this.meetingsService.updateActionItem(id, body);
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
        try { takeaways = JSON.parse(meeting.summary.keyTakeaways); } catch {}
        try { decisions = meeting.summary.keyDecisions ? JSON.parse(meeting.summary.keyDecisions) : []; } catch {}
        try { nextSteps = meeting.summary.nextSteps ? JSON.parse(meeting.summary.nextSteps) : []; } catch {}
      }

      let speakerSentiments: any = {};
      let talkTimeDistribution: any = {};
      if (meeting.analytics) {
        try { speakerSentiments = JSON.parse(meeting.analytics.speakerSentiment); } catch {}
        try { talkTimeDistribution = JSON.parse(meeting.analytics.talkTimeDistribution); } catch {}
      }

      const html = this.buildPdfHtml(
        meeting, decisions, nextSteps, takeaways,
        meeting.actionItems || [], meeting.risks || [],
        speakerSentiments, talkTimeDistribution
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

  private buildPdfHtml(meeting: any, decisions: string[], nextSteps: string[], takeaways: string[], actionItems: any[], risks: any[], speakerSentiments: any, talkTimeDistribution: any): string {
    const productivityScore = meeting.summary?.productivityScore ?? null;
    const engagement = meeting.analytics?.engagementScore ?? null;
    const sentimentScore = meeting.analytics?.sentimentScore ?? null;
    const duration = meeting.analytics?.duration ?? 0;
    const totalWords = meeting.analytics?.totalWords ?? 0;
    const transcriptCount = meeting.transcripts?.length ?? 0;

    const formattedDate = meeting.createdAt
      ? new Date(meeting.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Unknown Date';

    const formattedEnd = meeting.endTime
      ? new Date(meeting.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '—';

    const durationStr = duration > 0 ? `${Math.floor(duration / 60)}m ${duration % 60}s` : (meeting.endTime && meeting.startTime ? `${Math.round((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / 60000)} min` : '—');

    // Score gauge arc helper
    const scoreGauge = (score: number, color: string) => {
      const pct = Math.min(Math.max(score, 0), 100);
      const r = 36; const cx = 44; const cy = 44;
      const circumference = Math.PI * r;
      const offset = circumference - (pct / 100) * circumference;
      return `<svg width="88" height="52" viewBox="0 0 88 52">
        <path d="M8,44 A36,36 0 0,1 80,44" fill="none" stroke="#e2e8f0" stroke-width="8" stroke-linecap="round"/>
        <path d="M8,44 A36,36 0 0,1 80,44" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"
          stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" style="transition:stroke-dashoffset 1s"/>
        <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="14" font-weight="800" fill="${color}">${pct}</text>
        <text x="${cx}" y="${cy + 11}" text-anchor="middle" font-size="7" fill="#94a3b8">/ 100</text>
      </svg>`;
    };

    // Talk time bar chart
    const talkEntries = Object.entries(talkTimeDistribution || {});
    const talkMax = talkEntries.length > 0 ? Math.max(...talkEntries.map(([, v]: any) => Number(v) || 0)) : 1;
    const talkBarsHtml = talkEntries.length === 0
      ? '<p style="color:#94a3b8;font-size:13px;">No talk time data available.</p>'
      : talkEntries.map(([name, pct]: any) => {
          const val = Number(pct) || 0;
          const barW = talkMax > 0 ? Math.round((val / talkMax) * 100) : 0;
          const hue = Math.round((talkEntries.indexOf([name, pct] as any) / talkEntries.length) * 280);
          return `<div style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:13px;font-weight:600;color:#334155;">${name}</span>
              <span style="font-size:12px;font-weight:700;color:#6366f1;">${val}%</span>
            </div>
            <div style="background:#e2e8f0;border-radius:6px;height:10px;">
              <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);height:10px;border-radius:6px;width:${barW}%;"></div>
            </div>
          </div>`;
        }).join('');

    // Sentiment bars
    const sentimentEntries = Object.entries(speakerSentiments || {});
    const sentimentsHtml = sentimentEntries.length === 0
      ? '<p style="color:#94a3b8;font-size:13px;">No speaker sentiment data available.</p>'
      : sentimentEntries.map(([name, sent]: any) => {
          const isPos = sent === 'Positive';
          const isCon = sent === 'Concerned' || sent === 'Negative';
          const color = isPos ? '#10b981' : isCon ? '#ef4444' : '#f59e0b';
          const emoji = isPos ? '😊' : isCon ? '⚠️' : '😐';
          const label = isPos ? 'Positive' : isCon ? 'Concerned' : 'Neutral';
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:8px;">
            <span style="font-size:13px;font-weight:600;color:#334155;">${name}</span>
            <span style="font-size:12px;font-weight:700;color:${color};background:${color}18;padding:3px 10px;border-radius:20px;">${emoji} ${label}</span>
          </div>`;
        }).join('');

    // Action items rich HTML
    const actionItemsHtml = actionItems.length === 0
      ? '<p style="color:#94a3b8;font-size:13px;">No action items assigned.</p>'
      : actionItems.map((a, i) => {
          const dueStr = a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Deadline';
          const assignee = a.assigneeName || 'Unassigned';
          const statusColor = a.status === 'COMPLETED' ? '#10b981' : a.status === 'IN_PROGRESS' ? '#f59e0b' : '#6366f1';
          const statusLabel = a.status || 'PENDING';
          const extLink = a.externalUrl ? `<a href="${a.externalUrl}" style="color:#6366f1;font-size:11px;text-decoration:none;border:1px solid #e0e7ff;padding:2px 8px;border-radius:10px;" target="_blank">🔗 ${a.externalPlatform?.toUpperCase() || 'View'}</a>` : '';
          return `<div style="display:flex;gap:14px;align-items:flex-start;padding:12px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:10px;">
            <div style="background:#6366f118;color:#4338ca;font-weight:800;font-size:11px;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">${i + 1}</div>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:600;color:#0f172a;margin-bottom:5px;">${a.text}</div>
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <span style="font-size:11px;color:#64748b;">👤 ${assignee}</span>
                <span style="font-size:11px;color:#64748b;">📅 ${dueStr}</span>
                <span style="font-size:11px;font-weight:700;color:${statusColor};background:${statusColor}18;padding:2px 8px;border-radius:10px;">${statusLabel}</span>
                ${extLink}
              </div>
            </div>
          </div>`;
        }).join('');

    // Risks rich HTML
    const risksHtml = risks.length === 0
      ? '<p style="color:#94a3b8;font-size:13px;">No risks or blockers identified.</p>'
      : risks.map(r => {
          const isHigh = r.severity === 'HIGH';
          const isMed = r.severity === 'MEDIUM';
          const color = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#6366f1';
          const bg = isHigh ? '#fee2e218' : isMed ? '#fef3c718' : '#e0e7ff18';
          return `<div style="display:flex;gap:12px;align-items:flex-start;padding:12px 14px;background:${bg};border-radius:8px;border:1px solid ${color}30;margin-bottom:10px;">
            <span style="font-size:16px;flex-shrink:0;">⚠️</span>
            <div style="flex:1;">
              <div style="font-size:13px;color:#0f172a;font-weight:500;">${r.text}</div>
              <span style="font-size:11px;font-weight:700;color:${color};background:${color}20;padding:2px 8px;border-radius:10px;margin-top:4px;display:inline-block;">${r.severity}</span>
            </div>
          </div>`;
        }).join('');

    const sentScoreColor = sentimentScore !== null ? (sentimentScore >= 0.6 ? '#10b981' : sentimentScore >= 0.3 ? '#f59e0b' : '#ef4444') : '#94a3b8';
    const sentScoreLabel = sentimentScore !== null ? (sentimentScore >= 0.6 ? 'Positive' : sentimentScore >= 0.3 ? 'Neutral' : 'Negative') : '—';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meeting.title} — Meeting Report</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      color: #0f172a;
      line-height: 1.65;
      padding: 0;
      margin: 0;
      background: #f1f5f9;
    }
    .page-wrap {
      max-width: 860px;
      margin: 0 auto;
      padding: 32px 20px;
    }
    .print-bar {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-bottom: 20px;
    }
    .btn-print {
      background: linear-gradient(135deg,#6366f1,#8b5cf6);
      color: #fff;
      border: none;
      padding: 10px 22px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .report {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    /* === HEADER === */
    .report-header {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
      padding: 40px 48px 36px;
      color: #fff;
    }
    .report-header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .brand-pill {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 20px;
      padding: 6px 14px;
      font-family: 'Outfit', sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: #c7d2fe;
    }
    .status-badge {
      background: rgba(16,185,129,0.2);
      border: 1px solid rgba(16,185,129,0.4);
      color: #6ee7b7;
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .meeting-title {
      font-family: 'Outfit', sans-serif;
      font-size: 34px;
      font-weight: 900;
      color: #fff;
      margin: 0 0 10px;
      line-height: 1.2;
    }
    .meeting-meta {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }
    .meta-item {
      font-size: 13px;
      color: #c7d2fe;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .meta-item strong { color: #e0e7ff; }
    /* === SCORE CARDS === */
    .score-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .score-card {
      padding: 24px 20px;
      text-align: center;
      border-right: 1px solid #e2e8f0;
    }
    .score-card:last-child { border-right: none; }
    .score-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .score-value {
      font-family: 'Outfit', sans-serif;
      font-size: 28px;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 4px;
    }
    .score-sub {
      font-size: 11px;
      color: #94a3b8;
    }
    /* === CONTENT === */
    .content { padding: 36px 48px; }
    .section {
      margin-bottom: 32px;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e0e7ff;
    }
    .section-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      flex-shrink: 0;
    }
    .section-title {
      font-family: 'Outfit', sans-serif;
      font-size: 15px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #312e81;
      margin: 0;
    }
    .summary-box {
      background: linear-gradient(135deg, #eef2ff, #f5f3ff);
      border: 1px solid #c7d2fe;
      border-radius: 10px;
      padding: 18px 22px;
      font-size: 15px;
      font-weight: 500;
      color: #1e1b4b;
      line-height: 1.7;
    }
    ul.styled { list-style: none; padding: 0; margin: 0; }
    ul.styled li {
      padding: 8px 0 8px 22px;
      position: relative;
      font-size: 13.5px;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }
    ul.styled li:last-child { border-bottom: none; }
    ul.styled li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #6366f1;
      font-weight: 700;
    }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .footer-report {
      text-align: center;
      padding: 24px 48px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .footer-report p { font-size: 11.5px; color: #94a3b8; margin: 2px 0; }
    .footer-brand { font-family: 'Outfit', sans-serif; font-weight: 800; color: #6366f1; font-size: 14px; }
  </style>
</head>
<body>
<div class="page-wrap">
  <!-- Print / Download bar -->
  <div class="print-bar no-print">
    <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="report">
    <!-- ===== HEADER ===== -->
    <div class="report-header">
      <div class="report-header-top">
        <span class="brand-pill">🤖 AI Meeting Copilot</span>
        <span class="status-badge">${meeting.status}</span>
      </div>
      <h1 class="meeting-title">${meeting.title}</h1>
      ${meeting.description ? `<p style="color:#a5b4fc;font-size:14px;margin:0 0 16px;">${meeting.description}</p>` : ''}
      <div class="meeting-meta">
        <div class="meta-item">📅 <strong>Date:</strong>&nbsp;${formattedDate}</div>
        ${meeting.endTime ? `<div class="meta-item">⏱ <strong>Ended:</strong>&nbsp;${formattedEnd}</div>` : ''}
        <div class="meta-item">💬 <strong>Transcript Lines:</strong>&nbsp;${transcriptCount}</div>
        ${totalWords > 0 ? `<div class="meta-item">📝 <strong>Total Words:</strong>&nbsp;${totalWords.toLocaleString()}</div>` : ''}
        ${meeting.host?.name ? `<div class="meta-item">👤 <strong>Host:</strong>&nbsp;${meeting.host.name}</div>` : ''}
      </div>
    </div>

    <!-- ===== SCORE CARDS ===== -->
    <div class="score-cards">
      <div class="score-card">
        <div class="score-label">Productivity</div>
        ${productivityScore !== null
          ? scoreGauge(productivityScore, '#6366f1')
          : `<div class="score-value" style="color:#94a3b8;">—</div>`}
        <div class="score-sub">AI Score</div>
      </div>
      <div class="score-card">
        <div class="score-label">Engagement</div>
        ${engagement !== null
          ? scoreGauge(engagement, '#10b981')
          : `<div class="score-value" style="color:#94a3b8;">—</div>`}
        <div class="score-sub">Team Score</div>
      </div>
      <div class="score-card">
        <div class="score-label">Overall Sentiment</div>
        <div class="score-value" style="color:${sentScoreColor};font-size:22px;margin-top:8px;">${sentScoreLabel}</div>
        <div class="score-sub">${sentimentScore !== null ? `Score: ${sentimentScore.toFixed(2)}` : 'No data'}</div>
      </div>
      <div class="score-card">
        <div class="score-label">Duration</div>
        <div class="score-value" style="color:#f59e0b;font-size:22px;margin-top:8px;">${durationStr}</div>
        <div class="score-sub">${actionItems.length} Action Items · ${risks.length} Risks</div>
      </div>
    </div>

    <!-- ===== CONTENT ===== -->
    <div class="content">

      <!-- Executive Summary -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon" style="background:#eef2ff;">📋</div>
          <h2 class="section-title">Executive Summary</h2>
        </div>
        <div class="summary-box">
          ${meeting.summary?.overview || '<em style="color:#94a3b8;">No AI summary generated for this meeting yet. End the meeting to generate it.</em>'}
        </div>
      </div>

      <!-- Two-column: Key Decisions + Key Takeaways -->
      <div class="two-col">
        <div class="section">
          <div class="section-header">
            <div class="section-icon" style="background:#ede9fe;">⚖️</div>
            <h2 class="section-title">Key Decisions</h2>
          </div>
          ${decisions.length > 0
            ? `<ul class="styled">${decisions.map(d => `<li>${d}</li>`).join('')}</ul>`
            : '<p style="color:#94a3b8;font-size:13px;">No major decisions recorded.</p>'}
        </div>
        <div class="section">
          <div class="section-header">
            <div class="section-icon" style="background:#ecfdf5;">💡</div>
            <h2 class="section-title">Key Takeaways</h2>
          </div>
          ${takeaways.length > 0
            ? `<ul class="styled">${takeaways.map(t => `<li>${t}</li>`).join('')}</ul>`
            : '<p style="color:#94a3b8;font-size:13px;">No takeaways recorded.</p>'}
        </div>
      </div>

      <!-- Next Steps -->
      ${nextSteps.length > 0 ? `
      <div class="section">
        <div class="section-header">
          <div class="section-icon" style="background:#fef3c7;">➡️</div>
          <h2 class="section-title">Next Steps</h2>
        </div>
        <ul class="styled">
          ${nextSteps.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>` : ''}

      <!-- Action Items -->
      <div class="section page-break">
        <div class="section-header">
          <div class="section-icon" style="background:#ede9fe;">✅</div>
          <h2 class="section-title">Action Items (${actionItems.length})</h2>
        </div>
        ${actionItemsHtml}
      </div>

      <!-- Risks & Blockers -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon" style="background:#fee2e2;">🚨</div>
          <h2 class="section-title">Risks & Blockers (${risks.length})</h2>
        </div>
        ${risksHtml}
      </div>

      <!-- Two-column: Talk Time + Speaker Sentiment -->
      <div class="two-col">
        <div class="section">
          <div class="section-header">
            <div class="section-icon" style="background:#e0e7ff;">🎙️</div>
            <h2 class="section-title">Talk Time Distribution</h2>
          </div>
          ${talkBarsHtml}
        </div>
        <div class="section">
          <div class="section-header">
            <div class="section-icon" style="background:#ecfdf5;">😊</div>
            <h2 class="section-title">Speaker Sentiment</h2>
          </div>
          ${sentimentsHtml}
        </div>
      </div>

    </div>

    <!-- ===== FOOTER ===== -->
    <div class="footer-report">
      <div class="footer-brand">AI Meeting Copilot</div>
      <p>This report was automatically generated from meeting transcript data using AI analysis.</p>
      <p>Generated on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  </div>
</div>
</body>
</html>`;
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
