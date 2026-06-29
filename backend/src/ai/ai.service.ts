import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly sarvamApiKey = process.env.SARVAM_API_KEY;

  constructor() {
    if (this.sarvamApiKey) {
      this.logger.log('Sarvam AI service initialized successfully.');
    } else {
      this.logger.warn('SARVAM_API_KEY is not set. The application will run with Mock AI services.');
    }
  }

  private async callSarvamAi(prompt: string): Promise<string> {
    const apiKey = this.sarvamApiKey;
    if (!apiKey) {
      throw new Error('SARVAM_API_KEY is not set');
    }

    const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant that analyzes meeting transcripts and always returns responses strictly formatted as valid JSON matching the requested schema.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Sarvam AI API returned status ${response.status}: ${await response.text()}`);
    }

    const json: any = await response.json();
    if (!json.choices || json.choices.length === 0) {
      throw new Error('Sarvam AI returned empty choices');
    }

    return json.choices[0].message.content;
  }

  private parseJson(text: string): any {
    const cleanText = text.replace(/```json\s*|```\s*/g, '').trim();
    return JSON.parse(cleanText);
  }

  async generateSpeech(text: string, languageCode: string = 'en-IN'): Promise<string> {
    const apiKey = this.sarvamApiKey;
    if (!apiKey) {
      this.logger.warn('SARVAM_API_KEY is not set. Skipping real TTS.');
      return '';
    }

    // Map language codes to Sarvam AI-compatible codes
    // Sarvam supports: en-IN, hi-IN, ta-IN, te-IN, kn-IN, bn-IN, mr-IN, gu-IN, pa-IN, ml-IN, od-IN
    const sarvamLangMap: Record<string, string> = {
      'en-US': 'en-IN',
      'en-GB': 'en-IN',
      'en': 'en-IN',
    };
    const sarvamLangCode = sarvamLangMap[languageCode] || languageCode;

    try {
      this.logger.log(`Generating Sarvam AI TTS (model: bulbul:v3, speaker: rohan, lang: ${sarvamLangCode}) for text: "${text.substring(0, 60)}..."`);
      const response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': apiKey,
        },
        body: JSON.stringify({
          text,
          target_language_code: sarvamLangCode,
          speaker: 'rohan',
          model: 'bulbul:v3',
        }),
      });

      if (!response.ok) {
        throw new Error(`Sarvam TTS returned status ${response.status}: ${await response.text()}`);
      }

      const json = (await response.json()) as any;
      return json.audios && json.audios[0] ? json.audios[0] : '';
    } catch (error: any) {
      this.logger.error('Failed to generate speech via Sarvam AI:', error.message);
      throw error;
    }
  }

  async translateText(text: string, sourceLang: string, targetLang: string = 'en-IN'): Promise<string> {
    const apiKey = this.sarvamApiKey;
    if (!apiKey) {
      this.logger.warn('SARVAM_API_KEY is not set. Skipping translation.');
      return text;
    }

    try {
      const response = await fetch('https://api.sarvam.ai/v1/translation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': apiKey,
        },
        body: JSON.stringify({
          input: text,
          source_language_code: sourceLang || 'auto',
          target_language_code: targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sarvam Translation returned status ${response.status}: ${await response.text()}`);
      }

      const json = (await response.json()) as any;
      return json.translated_text || text;
    } catch (error: any) {
      this.logger.error('Failed to translate via Sarvam AI:', error.message);
      return text;
    }
  }

  private getLanguageName(code?: string): string {
    switch (code) {
      case 'en-US': return 'English (US)';
      case 'en-IN': return 'English (India)';
      case 'hi-IN': return 'Hindi (हिंदी)';
      case 'ta-IN': return 'Tamil (தமிழ்)';
      case 'te-IN': return 'Telugu (తెలుగు)';
      case 'kn-IN': return 'Kannada (ಕನ್ನಡ)';
      case 'bn-IN': return 'Bengali (বাংলা)';
      case 'mr-IN': return 'Marathi (มరాఠీ)';
      case 'gu-IN': return 'Gujarati (ગુજરાતી)';
      default: return 'English (India)';
    }
  }

  async answerQuestion(meetingTitle: string, transcriptLines: string[], question: string, languageCode?: string): Promise<{ answer: string; diagram?: any }> {
    const fullTranscript = transcriptLines.join('\n');
    if (!this.sarvamApiKey) {
      return this.getMockQuestionAnswer(question, transcriptLines);
    }

    const selectedLanguage = this.getLanguageName(languageCode);

    try {
      const prompt = `
        [SYSTEM DEFINITION - MANDATORY COMPLIANCE]
        You are "AI Copilot", an intelligent AI Copilot integrated into an AI Meeting Copilot platform for the meeting titled "${meetingTitle}".
        Your role is NOT limited to meeting assistance. You act as a complete AI assistant that helps users with meetings, learning, productivity, communication, and general knowledge.

        [CORE RESPONSIBILITIES]
        1. Meeting Assistant:
           - Generate meeting summaries.
           - Extract action items.
           - Identify decisions and deadlines.
           - Detect potential risks.
           - Answer questions about current and previous meetings.
           - Search meeting history.
           - Explain meeting context using the Meeting Memory Graph.
        2. General AI Assistant:
           - Answer questions on any topic including Mathematics, Science, General Knowledge, Programming, Artificial Intelligence, Data Structures & Algorithms, Web Development, Cloud Computing, Finance, Communication Skills, English Grammar, Interview Preparation, Resume Review, Email Writing, Presentation Preparation, Career Guidance, Productivity Tips, Logical Reasoning, and Current Technology Concepts.

        [CONVERSATION BEHAVIOR & RESPONSE STYLE]
        - Maintain conversation context. Answer follow-up questions naturally.
        - Ask clarifying questions only when necessary.
        - Never invent facts or participant names. If information is unavailable, clearly state that.
        - Be professional, friendly, and concise.
        - Use simple language unless the user requests technical details.
        - Format answers using headings, bullet points, tables, or code blocks when appropriate.
        - Provide step-by-step explanations for technical or educational questions.

        [PRIORITY RULES]
        1. If the user asks about the current or previous meeting, prioritize meeting-related context.
        2. Otherwise, behave as a full-featured AI assistant capable of answering any valid question across different domains.
        3. Support both voice and text seamlessly, automatically adapting based on the microphone state (Voice Mode vs Silent Mode).

        [CURRENT ACTIVE LANGUAGE]
        Language Mode: ${selectedLanguage}
        (You must reply EXCLUSIVELY in the language and script designated above. If English, reply in English text. If Hindi, reply in हिंदी text, etc.)

        Below is the transcript of what has been discussed so far in the meeting:
        ---
        ${fullTranscript || '(No discussion recorded yet)'}
        ---

        A participant has just asked you this question:
        "${question}"

        Return the response as a JSON object matching this schema:
        {
          "answer": "your comprehensive response here (strictly in ${selectedLanguage}, formatted with markdown/headings/bullet points/code blocks/tables if appropriate)",
          "diagram": {
            "title": "Title of the diagram",
            "type": "flowchart" | "mindmap",
            "nodes": [
              { "id": "1", "label": "Node Label", "shape": "circle" | "box" | "decision" }
            ],
            "edges": [
              { "from": "1", "to": "2", "label": "connection label or null" }
            ]
          }
        }
      `;
      const resultText = await this.callSarvamAi(prompt);
      const parsed = this.parseJson(resultText);
      return {
        answer: parsed.answer || 'I apologize, but I could not formulate a clear response.',
        diagram: parsed.diagram || null
      };
    } catch (error) {
      this.logger.error('Sarvam AI question answering failed. Falling back to Mock:', error);
      return this.getMockQuestionAnswer(question, transcriptLines);
    }
  }

  private getMockQuestionAnswer(question: string, transcriptLines: string[] = []): { answer: string; diagram?: any } {
    const cleanQ = question.toLowerCase();
    
    // Draw / Diagram Request
    if (cleanQ.includes('diagram') || cleanQ.includes('flowchart') || cleanQ.includes('mindmap') || cleanQ.includes('draw') || cleanQ.includes('whiteboard')) {
      return {
        answer: 'Certainly! I have generated a flowchart diagram for the authentication and socket connection flow and opened the whiteboard canvas to draw it for you.',
        diagram: {
          title: 'Authentication & WebSocket Connection Flow',
          type: 'flowchart',
          nodes: [
            { id: '1', label: 'Start (User Action)', shape: 'circle' },
            { id: '2', label: 'Login UI Page', shape: 'box' },
            { id: '3', label: 'Validate Token?', shape: 'decision' },
            { id: '4', label: 'Socket IO Gateway', shape: 'box' },
            { id: '5', label: 'Active Meeting Stage', shape: 'box' },
            { id: '6', label: 'Error Alert Screen', shape: 'box' }
          ],
          edges: [
            { from: '1', to: '2' },
            { from: '2', to: '3' },
            { from: '3', to: '4', label: 'Valid Token' },
            { from: '3', to: '6', label: 'Invalid Token' },
            { from: '4', to: '5', label: 'Connect' }
          ]
        }
      };
    }

    if (cleanQ.includes('status') || cleanQ.includes('setup') || cleanQ.includes('vite') || cleanQ.includes('react')) {
      return {
        answer: 'John Doe mentioned that the Vite React setup is going well, with core routing and layout completed. However, Bob Johnson is currently blocked on the Socket.io WebSocket gateway setup.',
        diagram: null
      };
    }
    if (cleanQ.includes('block') || cleanQ.includes('delay') || cleanQ.includes('problem') || cleanQ.includes('issue')) {
      return {
        answer: 'Bob Johnson reported a 2-day delay on the WebSocket gateway due to server network port conflicts. John and Bob plan to debug this together tomorrow at 10 AM.',
        diagram: null
      };
    }
    if (cleanQ.includes('next steps') || cleanQ.includes('todo') || cleanQ.includes('task') || cleanQ.includes('action')) {
      return {
        answer: 'The next steps are for John and Bob to pair program tomorrow to troubleshoot the port conflicts, and for John to finish the frontend dashboard layout by Monday.',
        diagram: null
      };
    }

    // Scan transcript lines for keywords in the user's question
    if (transcriptLines && transcriptLines.length > 0) {
      for (const line of transcriptLines) {
        const parts = line.split(':');
        if (parts.length > 1) {
          const speaker = parts[0].trim();
          const content = parts.slice(1).join(':').trim();
          const words = cleanQ.split(/\s+/);
          
          const matchedKeyword = words.find(w => w.length > 3 && content.toLowerCase().includes(w));
          if (matchedKeyword && !cleanQ.includes('assist') && !cleanQ.includes('help')) {
            return {
              answer: `During the meeting, ${speaker} mentioned: "${content}". I can help track this as an action item or summarize it for you.`,
              diagram: null
            };
          }
        }
      }
    }

    // General assistant request or greetings
    if (cleanQ.includes('assist') || cleanQ.includes('help') || cleanQ.includes('hi') || cleanQ.includes('hello') || cleanQ.includes('hey')) {
      if (transcriptLines && transcriptLines.length > 0) {
        // Find last discussed topic right before the wake-word call
        let lastDiscussedLine = '';
        for (let i = transcriptLines.length - 1; i >= 0; i--) {
          const l = transcriptLines[i].toLowerCase();
          if (!l.includes('copilot') && !l.includes('assist us') && !l.includes('assist me') && !l.includes('can you')) {
            lastDiscussedLine = transcriptLines[i];
            break;
          }
        }
        
        if (lastDiscussedLine) {
          const parts = lastDiscussedLine.split(':');
          const lastSpeaker = parts.length > 1 ? parts[0].trim() : 'a participant';
          const lastTopic = parts.length > 1 ? parts.slice(1).join(':').trim() : lastDiscussedLine.trim();
          
          return {
            answer: `Regarding the discussion about ${lastTopic} mentioned by ${lastSpeaker}, you should proceed with coordinating your tasks. I can help document these action items or create a visual diagram if you need them.`,
            diagram: null
          };
        }
      }
      
      return {
        answer: 'I am here to assist you with the meeting. I can summarize discussions, track action items, or generate mindmaps and flowcharts.',
        diagram: null
      };
    }

    // Fallback smart generic summary answer based on transcript
    if (transcriptLines && transcriptLines.length > 0) {
      const topics = transcriptLines
        .filter(line => line.includes(':') && line.length > 15)
        .slice(-2)
        .map(line => {
          const parts = line.split(':');
          return `"${parts.slice(1).join(':').trim()}" (discussed by ${parts[0].trim()})`;
        });
      
      if (topics.length > 0) {
        return {
          answer: `Regarding your question, the current discussion includes: ${topics.join(' and ')}. I am tracking these points and will include them in the final action board.`,
          diagram: null
        };
      }
    }

    return {
      answer: 'I am here to assist you with the meeting. I can summarize discussions, track action items, or generate mindmaps and flowcharts. What would you like to focus on?',
      diagram: null
    };
  }

  async summarizeMeeting(transcriptLines: string[]): Promise<{ overview: string; keyTakeaways: string[]; keyDecisions: string[]; nextSteps: string[]; productivityScore: number }> {
    const fullTranscript = transcriptLines.join('\n');
    if (!fullTranscript.trim()) {
      return {
        overview: 'No transcript available for this meeting.',
        keyTakeaways: ['No takeaways because there was no discussion.'],
        keyDecisions: [],
        nextSteps: [],
        productivityScore: 100,
      };
    }

    if (!this.sarvamApiKey) {
      return this.getMockSummary(transcriptLines);
    }

    try {
      const prompt = `
        Analyze the following meeting transcript. Generate a concise paragraph summarizing the meeting (overview), 
        extract key takeaways as an array of strings, extract key decisions as an array of strings, extract next steps as an array of strings,
        and estimate a team productivity score from 0 to 100 (where 100 is highly collaborative/productive, and low is due to delays or arguments).
        Return the response as a JSON object matching this schema:
        {
          "overview": "string summary",
          "keyTakeaways": ["takeaway 1", "takeaway 2"],
          "keyDecisions": ["decision 1", "decision 2"],
          "nextSteps": ["next step 1", "next step 2"],
          "productivityScore": number
        }

        Transcript:
        ${fullTranscript}
      `;
      const resultText = await this.callSarvamAi(prompt);
      return this.parseJson(resultText);
    } catch (error) {
      this.logger.error('Sarvam AI summarization failed. Falling back to Mock:', error);
      return this.getMockSummary(transcriptLines);
    }
  }

  async extractActionItems(transcriptLines: string[]): Promise<Array<{ text: string; assigneeName?: string; dueDate?: string }>> {
    const fullTranscript = transcriptLines.join('\n');
    if (!fullTranscript.trim()) {
      return [];
    }

    if (!this.sarvamApiKey) {
      return this.getMockActionItems(transcriptLines);
    }

    try {
      const prompt = `
        Analyze this meeting transcript and extract all explicit or implied action items (tasks/todos).
        For each action item, identify:
        1. The description of the task (text).
        2. The name of the assignee (assigneeName) if mentioned, or null.
        3. A proposed due date (dueDate in ISO 8601 format like "YYYY-MM-DD") if mentioned or inferred, or null.
        
        Return a JSON array of objects matching this schema:
        [
          {
            "text": "description of task",
            "assigneeName": "Name or null",
            "dueDate": "YYYY-MM-DD or null"
          }
        ]

        Transcript:
        ${fullTranscript}
      `;
      const resultText = await this.callSarvamAi(prompt);
      return this.parseJson(resultText);
    } catch (error) {
      this.logger.error('Sarvam AI action items extraction failed. Falling back to Mock:', error);
      return this.getMockActionItems(transcriptLines);
    }
  }

  async detectRisks(transcriptLines: string[]): Promise<Array<{ text: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }>> {
    const fullTranscript = transcriptLines.join('\n');
    if (!fullTranscript.trim()) {
      return [];
    }

    if (!this.sarvamApiKey) {
      return this.getMockRisks(transcriptLines);
    }

    try {
      const prompt = `
        Analyze this meeting transcript and detect any potential project risks, conflicts, timeline bottlenecks, or blockers.
        For each risk detected, categorize its severity as LOW, MEDIUM, or HIGH.
        Return a JSON array of objects matching this schema:
        [
          {
            "text": "description of the risk/blocker",
            "severity": "LOW" | "MEDIUM" | "HIGH"
          }
        ]

        Transcript:
        ${fullTranscript}
      `;
      const resultText = await this.callSarvamAi(prompt);
      return this.parseJson(resultText);
    } catch (error) {
      this.logger.error('Sarvam AI risk detection failed. Falling back to Mock:', error);
      return this.getMockRisks(transcriptLines);
    }
  }

  async summarizeChannel(chatLines: string[], meetingSummaries: string[]): Promise<{ summary: string; keyPoints: string[] }> {
    const chatTranscript = chatLines.join('\n');
    const meetingsContext = meetingSummaries.join('\n');

    if (!chatTranscript.trim() && !meetingsContext.trim()) {
      return {
        summary: 'No activity or meetings recorded in this channel yet. Start discussing or host meetings to generate a summary!',
        keyPoints: ['No data available'],
      };
    }

    if (!this.sarvamApiKey) {
      return {
        summary: 'Mock Summary: The team had active discussions in this channel. Topics covered local testing, UI adjustments, and code alignment across backend services.',
        keyPoints: [
          'Aligned on project milestone scheduling.',
          'Discussed frontend component structures.',
          'Noted resolved blockers in setup documentation.'
        ]
      };
    }

    try {
      const prompt = `
        Analyze the activity inside this remote team channel.
        Below is the recent chat history and summaries of meetings hosted in this channel.
        Please summarize:
        1. What the team is currently working on or discussing (main projects/goals).
        2. Decisions made and consensus reached.
        3. Next steps, key milestones, or blocker items.
        
        Return the response as a JSON object matching this schema:
        {
          "summary": "a detailed overview paragraph summarizing channel activity and status",
          "keyPoints": ["bullet point 1", "bullet point 2", "bullet point 3"]
        }

        Recent Chat History:
        ${chatTranscript}

        Past Meeting Summaries:
        ${meetingsContext}
      `;
      const resultText = await this.callSarvamAi(prompt);
      return this.parseJson(resultText);
    } catch (error) {
      this.logger.error('Sarvam AI channel summarization failed. Falling back to Mock:', error);
      return {
        summary: 'Mock Summary: The team had active discussions in this channel. Topics covered local testing, UI adjustments, and code alignment across backend services.',
        keyPoints: [
          'Aligned on project milestone scheduling.',
          'Discussed frontend component structures.',
          'Noted resolved blockers in setup documentation.'
        ]
      };
    }
  }

  async analyzeMeetingAnalytics(transcriptLines: string[]): Promise<{
    duration: number;
    totalWords: number;
    talkTimeDistribution: Record<string, number>;
    sentimentScore: number;
    engagementScore: number;
    speakerSentiment: Record<string, string>;
  }> {
    const fullTranscript = transcriptLines.join('\n');
    const totalWords = fullTranscript.split(/\s+/).filter(Boolean).length;
    let durationSeconds = Math.round((totalWords / 130.0) * 60);
    if (durationSeconds < 10 && totalWords > 0) {
      durationSeconds = 10;
    }

    if (!fullTranscript.trim()) {
      return {
        duration: 0,
        totalWords: 0,
        talkTimeDistribution: {},
        sentimentScore: 0.0,
        engagementScore: 100,
        speakerSentiment: {},
      };
    }

    if (!this.sarvamApiKey) {
      return this.getMockAnalytics(transcriptLines, durationSeconds, totalWords);
    }

    try {
      const prompt = `
        Analyze the meeting transcript and calculate the following analytical metrics:
        1. Sentiment score of the conversation on a scale from -1.0 (very negative) to 1.0 (very positive).
        2. Team engagement score from 0 to 100 based on interactivity (back-and-forth turns), responsiveness, and distribution.
        3. Distribution of talk time in seconds among all participants (total talking duration is approximately ${durationSeconds} seconds).
        4. Specific speaker sentiment category ('Positive', 'Neutral', or 'Concerned') for each speaker based on their verbal statements, tone, and agreement.

        Return the response as a JSON object matching this schema:
        {
          "sentimentScore": number,
          "engagementScore": number,
          "talkTimeDistribution": {
            "Participant Name": number
          },
          "speakerSentiment": {
            "Participant Name": "Positive" | "Neutral" | "Concerned"
          }
        }

        Transcript:
        ${fullTranscript}
      `;
      const resultText = await this.callSarvamAi(prompt);
      const result = this.parseJson(resultText);

      const talkTime = result.talkTimeDistribution || {};
      const speakerSent = result.speakerSentiment || {};

      if (Object.keys(talkTime).length === 0) {
        const speakerTurns: Record<string, number> = {};
        for (const line of transcriptLines) {
          if (line.includes(':')) {
            const sp = line.split(':', 1)[0].trim();
            speakerTurns[sp] = (speakerTurns[sp] || 0) + 1;
          }
        }
        const totalTurns = Object.values(speakerTurns).reduce((a, b) => a + b, 0) || 1;
        for (const [sp, turns] of Object.entries(speakerTurns)) {
          talkTime[sp] = Math.round((turns / totalTurns) * durationSeconds);
        }
      }

      if (Object.keys(speakerSent).length === 0) {
        for (const line of transcriptLines) {
          if (line.includes(':')) {
            const sp = line.split(':', 1)[0].trim();
            if (!speakerSent[sp]) {
              speakerSent[sp] = 'Neutral';
            }
          }
        }
      }

      return {
        duration: durationSeconds,
        totalWords,
        talkTimeDistribution: talkTime,
        sentimentScore: Number(result.sentimentScore || 0.0),
        engagementScore: Number(result.engagementScore || 85),
        speakerSentiment: speakerSent,
      };
    } catch (error) {
      this.logger.error('Sarvam AI analytics failed. Falling back to Mock:', error);
      return this.getMockAnalytics(transcriptLines, durationSeconds, totalWords);
    }
  }

  // --- MOCK FALLBACKS ---

  private getMockSummary(transcriptLines: string[]): { overview: string; keyTakeaways: string[]; keyDecisions: string[]; nextSteps: string[]; productivityScore: number } {
    const fullText = transcriptLines.join(' ').toLowerCase();
    
    let overview = 'The team discussed active sprint updates, roadblocks, and coordinate next steps. Key milestones were reviewed.';
    const keyTakeaways = [
      'Reviewed current project status and alignment on backend architecture.',
      'Identified API integration hurdles and designated owners.',
      'Aligned on frontend styling approach using premium Vanilla CSS theme.'
    ];
    const keyDecisions = [
      'Backend will be built using NestJS and unified under SQLite database.',
      'External tasks will automatically sync to ClickUp.'
    ];
    const nextSteps = [
      'Alice to finalize schema migrations tomorrow morning.',
      'Bob to check server network port conflicts.'
    ];
    let score = 85;

    if (fullText.includes('delay') || fullText.includes('block') || fullText.includes('issue')) {
      overview += ' A few blockers regarding backend deployment and database migrations were highlighted.';
      keyTakeaways.push('Need to troubleshoot Docker Compose setup for local database instances.');
      nextSteps.push('Schedule joint debugging session for backend and database connection.');
      score = 70;
    }

    return {
      overview,
      keyTakeaways,
      keyDecisions,
      nextSteps,
      productivityScore: score,
    };
  }

  private getMockActionItems(transcriptLines: string[]): Array<{ text: string; assigneeName?: string; dueDate?: string }> {
    const actions: Array<{ text: string; assigneeName?: string; dueDate?: string }> = [];
    const fullText = transcriptLines.join(' ').toLowerCase();

    for (const line of transcriptLines) {
      const cleanLine = line.toLowerCase();
      if (cleanLine.includes('will') || cleanLine.includes('should') || cleanLine.includes('need to') || cleanLine.includes('task')) {
        const parts = line.split(':');
        const speaker = parts.length > 1 ? parts[0].trim() : undefined;
        const text = parts.length > 1 ? parts.slice(1).join(':').trim() : line.trim();

        let assigneeName = speaker;
        if (cleanLine.includes('rahul')) assigneeName = 'Rahul Sharma';
        else if (cleanLine.includes('priya')) assigneeName = 'Priya Patel';
        else if (cleanLine.includes('aman')) assigneeName = 'Aman Verma';

        if (text.length > 10) {
          actions.push({
            text: text.replace(/^(i will|we will|you should|please|need to)\s+/i, ''),
            assigneeName,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
          });
        }
      }
    }

    return actions;
  }

  private getMockRisks(transcriptLines: string[]): Array<{ text: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }> {
    const risks: Array<{ text: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }> = [];
    const fullText = transcriptLines.join(' ').toLowerCase();

    if (fullText.includes('delay') || fullText.includes('late')) {
      risks.push({ text: 'Timeline slip risk: Frontend development is blocked by backend API design', severity: 'HIGH' });
    }
    if (fullText.includes('db') || fullText.includes('database') || fullText.includes('migration')) {
      risks.push({ text: 'Database synchronization issue between Docker environment and local machines', severity: 'MEDIUM' });
    }
    if (fullText.includes('api') || fullText.includes('gemini') || fullText.includes('key')) {
      risks.push({ text: 'API integration: AI responses might be delayed if API keys are missing', severity: 'LOW' });
    }

    if (risks.length === 0) {
      risks.push({ text: 'Potential resource constraints due to parallel tasks in frontend and backend', severity: 'LOW' });
    }

    return risks;
  }

  private getMockAnalytics(
    transcriptLines: string[],
    durationSeconds: number,
    totalWords: number
  ): {
    duration: number;
    totalWords: number;
    talkTimeDistribution: Record<string, number>;
    sentimentScore: number;
    engagementScore: number;
    speakerSentiment: Record<string, string>;
  } {
    const talkTime: Record<string, number> = {};
    const speakerSent: Record<string, string> = {};

    const speakerTurns: Record<string, number> = {};
    for (const line of transcriptLines) {
      if (line.includes(':')) {
        const sp = line.split(':', 1)[0].trim();
        speakerTurns[sp] = (speakerTurns[sp] || 0) + 1;
      }
    }

    const totalTurns = Object.values(speakerTurns).reduce((a, b) => a + b, 0) || 1;
    for (const [sp, turns] of Object.entries(speakerTurns)) {
      talkTime[sp] = Math.round((turns / totalTurns) * durationSeconds);
      
      const spLower = sp.toLowerCase();
      if (spLower.includes('john') || spLower.includes('alice')) {
        speakerSent[sp] = 'Positive';
      } else if (spLower.includes('bob')) {
        speakerSent[sp] = 'Concerned';
      } else {
        speakerSent[sp] = 'Neutral';
      }
    }

    if (Object.keys(talkTime).length === 0) {
      talkTime['Rahul Sharma'] = Math.round(durationSeconds * 0.4);
      talkTime['Aman Verma'] = Math.round(durationSeconds * 0.3);
      talkTime['Priya Patel'] = Math.round(durationSeconds * 0.3);
      
      speakerSent['Rahul Sharma'] = 'Positive';
      speakerSent['Aman Verma'] = 'Positive';
      speakerSent['Priya Patel'] = 'Concerned';
    }

    return {
      duration: durationSeconds,
      totalWords,
      talkTimeDistribution: talkTime,
      sentimentScore: 0.6,
      engagementScore: 90,
      speakerSentiment: speakerSent,
    };
  }
}
