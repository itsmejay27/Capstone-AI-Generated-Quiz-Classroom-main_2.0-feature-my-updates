/**
 * Ollama Local AI Service Integration
 * Connects directly to local Ollama API (http://localhost:11434 or proxy /api/ollama)
 */

import { buildTopicDrivenQuestions, buildTopicDrivenModules } from './geminiService';

export const DEFAULT_OLLAMA_URL = '/api/ollama';

export interface OllamaModelInfo {
  name: string;
  size?: number;
  modified_at?: string;
}

export interface OllamaConnectionState {
  connected: boolean;
  models: string[];
  activeModel: string;
  error?: string;
}

export interface ExamGenerationParams {
  model: string;
  mcCount: number;
  tfCount: number;
  saCount: number;
  essayCount: number;
  extraCount: number;
  difficulty: string;
  topics: string[];
  generationPrompt: string;
  uploadedText?: string;
  baseUrl?: string;
}

export interface ReviewerGenerationParams {
  model: string;
  subject: string;
  difficulty: 'easy' | 'normal' | 'hard';
  customInstructions?: string;
  uploadedText?: string;
  baseUrl?: string;
}

/**
 * Checks connection to local Ollama instance and returns available models.
 */
export async function checkOllamaConnection(baseUrl: string = DEFAULT_OLLAMA_URL): Promise<OllamaConnectionState> {
  const endpointsToTry = [baseUrl, 'http://localhost:11434', 'http://127.0.0.1:11434'];

  for (const endpoint of endpointsToTry) {
    try {
      const cleanEndpoint = endpoint.replace(/\/$/, '');
      const response = await fetch(`${cleanEndpoint}/api/tags`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        const models = (data.models || []).map((m: any) => m.name || m.model);
        // Prioritize lightweight 1B / 3B / phi / qwen models for ultra-fast local execution
        const preferredFastModel = models.find((m: string) => m.includes('1b') || m.includes('3.2') || m.includes('3b') || m.includes('phi') || m.includes('qwen') || m.includes('tiny')) || models[0] || 'llama3.2:latest';
        return {
          connected: true,
          models: models.length > 0 ? models : ['llama3.2:latest'],
          activeModel: preferredFastModel,
        };
      }
    } catch (err) {
      // Continue to next endpoint attempt
    }
  }

  return {
    connected: false,
    models: [],
    activeModel: '',
    error: 'Could not connect to Ollama. Make sure Ollama is running on your laptop (e.g., run "ollama serve" in terminal).',
  };
}

/**
 * Extracts plain text from uploaded files (text-based, markdown, json, etc.).
 */
export async function extractFilesContent(files: (File | null)[]): Promise<string> {
  const textParts: string[] = [];

  for (const file of files) {
    if (!file) continue;
    try {
      if (
        file.type.startsWith('text/') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.csv')
      ) {
        const content = await file.text();
        textParts.push(`--- Attached Document (${file.name}) ---\n${content.substring(0, 4000)}`);
      } else {
        textParts.push(`--- Attached File Reference ---\nFilename: ${file.name} (Size: ${(file.size / 1024).toFixed(1)} KB)`);
      }
    } catch (err) {
      console.warn(`Error reading file ${file.name}:`, err);
    }
  }

  return textParts.join('\n\n');
}

/**
 * Robustly auto-repairs truncated or malformed JSON payloads from local LLMs.
 */
function parseTruncatedJson(text: string): any {
  if (!text) return null;
  let clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();

  // 1. Try standard JSON.parse
  try {
    return JSON.parse(clean);
  } catch (e) {}

  // 2. Extract complete question objects inside array via Regex
  const questionObjects: any[] = [];
  const objRegex = /\{\s*"(?:question|q|stem|title)"\s*:\s*"[\s\S]*?\}/g;
  let match;
  while ((match = objRegex.exec(clean)) !== null) {
    try {
      const parsedObj = JSON.parse(match[0]);
      questionObjects.push(parsedObj);
    } catch (e2) {
      try {
        const repaired = match[0] + '"';
        const withBrace = repaired.endsWith('}') ? repaired : repaired + '}';
        questionObjects.push(JSON.parse(withBrace));
      } catch (e3) {}
    }
  }

  if (questionObjects.length > 0) {
    return { questions: questionObjects };
  }

  // 3. Try auto-closing open brackets and braces
  let openBrackets = 0;
  let openBraces = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char === '\\' && !escaped) {
      escaped = true;
      continue;
    }
    if (char === '"' && !escaped) {
      inString = !inString;
    }
    if (!inString) {
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
    }
    escaped = false;
  }

  let repairedStr = clean;
  if (inString) repairedStr += '"';
  while (openBraces > 0) {
    repairedStr += '}';
    openBraces--;
  }
  while (openBrackets > 0) {
    repairedStr += ']';
    openBrackets--;
  }

  try {
    return JSON.parse(repairedStr);
  } catch (e4) {
    console.warn('Auto-repair JSON failed:', e4);
  }

  return null;
}

/**
 * Flexibly extracts question items from any JSON structure produced by local LLMs.
 */
function extractQuestionsFromParsedJson(parsed: any): any[] {
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;

  if (typeof parsed === 'object') {
    if (Array.isArray(parsed.questions)) return parsed.questions;
    if (Array.isArray(parsed.items)) return parsed.items;
    if (Array.isArray(parsed.quiz)) return parsed.quiz;
    if (Array.isArray(parsed.exam)) return parsed.exam;
    if (Array.isArray(parsed.data)) return parsed.data;
    if (Array.isArray(parsed.results)) return parsed.results;
    if (Array.isArray(parsed.content)) return parsed.content;

    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
        return parsed[key];
      }
    }
  }

  return [];
}

/**
 * Sends a structured generation request to local Ollama API for Exams/Quizzes using fast streaming.
 */
export async function generateExamWithOllama(params: ExamGenerationParams): Promise<any[]> {
  const userUrl = (params.baseUrl || DEFAULT_OLLAMA_URL).replace(/\/$/, '');
  const endpointsToTry = Array.from(new Set([userUrl, 'http://localhost:11434', 'http://127.0.0.1:11434']));
  const totalQuestions = params.mcCount + params.tfCount + params.saCount + params.essayCount + params.extraCount;

  if (totalQuestions === 0) {
    throw new Error('Please select at least 1 question to generate.');
  }

  // Ensure user's generation prompt is prioritized as the primary subject
  const promptTextRaw = params.generationPrompt?.trim() || '';
  const primaryTopic = promptTextRaw || (params.topics && params.topics.find((t) => t && t !== 'General Subject Matter')) || 'General Subject';

  const systemPrompt = `You are an ultra-fast exam authoring assistant. Create questions strictly about: "${primaryTopic}".
Keep stems under 10 words and choices under 4 words. Respond ONLY with compact raw JSON.`;

  const promptText = `Generate an exam about "${primaryTopic}".
Quantities required:
- Multiple choice (4 short options): ${params.mcCount} questions
- True/False: ${params.tfCount} questions
- Short Answer: ${params.saCount} questions
- Essay: ${params.essayCount} questions
- Anti-cheat items (isExtra: true): ${params.extraCount} questions

${params.uploadedText ? `Context: ${params.uploadedText.substring(0, 500)}\n` : ''}

Respond ONLY with valid JSON matching this exact structure:
{
  "questions": [
    {
      "q": "What is a core principle of ${primaryTopic}?",
      "o": ["Choice A", "Choice B", "Choice C", "Choice D"],
      "a": 0,
      "t": "multiple-choice",
      "e": false
    }
  ]
}`;

  let rawQuestions: any[] = [];
  let connectionError: string | null = null;

  for (const endpoint of endpointsToTry) {
    try {
      const cleanEndpoint = endpoint.replace(/\/$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(`${cleanEndpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: params.model || 'llama3.2:latest',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: promptText },
          ],
          stream: true,
          format: 'json',
          keep_alive: '15m',
          options: {
            num_ctx: 1024,
            num_predict: 450,
            temperature: 0.0,
            top_k: 10,
            top_p: 0.5,
          },
        }),
      });
      clearTimeout(timeoutId);

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n').filter((l) => l.trim());
          for (const line of lines) {
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                accumulatedText += json.message.content;
              } else if (json.response) {
                accumulatedText += json.response;
              }
            } catch (e) {}
          }
        }

        const parsed = parseTruncatedJson(accumulatedText);
        if (parsed) {
          rawQuestions = extractQuestionsFromParsedJson(parsed);
          if (rawQuestions.length > 0) break;
        }
      }
    } catch (err: any) {
      connectionError = err.name === 'AbortError' 
        ? 'Ollama request timed out after 60s' 
        : (err.message || 'Connection failed');
    }
  }

  // If local Ollama returned empty or parse error, fallback to topic generator
  if (rawQuestions.length === 0) {
    console.warn(`Ollama API call could not be completed (${connectionError || 'No response'}), using topic fallback engine.`);
    rawQuestions = buildTopicDrivenQuestions(params as any);
  }

  let idCounter = 1;
  return rawQuestions.map((q: any) => {
    const qType = q.t || q.type || q.question_type || 'multiple-choice';
    const isExtra = Boolean(q.e || q.isExtra || q.is_extra);
    const defaultPoints = qType === 'multiple-choice' ? 2 : qType === 'true-false' ? 1 : qType === 'short-answer' ? 3 : 5;
    const questionStem = q.q || q.question || q.stem || q.text || q.title || `Question about ${primaryTopic}`;

    const formattedItem: any = {
      id: `gq-ollama-${Date.now()}-${idCounter++}`,
      type: qType,
      question: questionStem,
      points: Number(q.points || q.score) || defaultPoints,
      difficulty: params.difficulty,
      topic: q.topic || primaryTopic,
      image: '',
      isExtra: isExtra,
    };

    const rawOptions = q.o || q.options || q.choices || q.answers || q.opts;
    const rawAnswer = q.a !== undefined 
      ? q.a 
      : (q.correctAnswer !== undefined ? q.correctAnswer : (q.answer !== undefined ? q.answer : q.key));

    if (qType === 'multiple-choice') {
      formattedItem.options = Array.isArray(rawOptions) && rawOptions.length >= 2 
        ? rawOptions.slice(0, 4) 
        : ['Option A', 'Option B', 'Option C', 'Option D'];
      
      let corr = Number(rawAnswer);
      if (isNaN(corr) || corr < 0 || corr >= formattedItem.options.length) {
        if (typeof rawAnswer === 'string') {
          const charCode = rawAnswer.trim().toUpperCase().charCodeAt(0);
          if (charCode >= 65 && charCode <= 68) {
            corr = charCode - 65;
          } else {
            const parsedNum = parseInt(rawAnswer, 10);
            if (!isNaN(parsedNum)) {
              corr = parsedNum >= 1 && parsedNum <= formattedItem.options.length ? parsedNum - 1 : 0;
            } else {
              corr = 0;
            }
          }
        } else {
          corr = 0;
        }
      }
      formattedItem.correctAnswer = corr;
      formattedItem.optionsImages = ['', '', '', ''];
    } else if (qType === 'true-false') {
      const corrStr = String(rawAnswer !== undefined ? rawAnswer : 'true').toLowerCase();
      formattedItem.correctAnswer = corrStr.includes('false') || corrStr === '0' || corrStr === 'f' ? 'false' : 'true';
    } else {
      formattedItem.correctAnswer = String(rawAnswer !== undefined ? rawAnswer : 'Answer key');
    }

    return formattedItem;
  });
}

/**
 * Regenerates an individual question item using Ollama.
 */
export async function regenerateQuestionWithOllama(
  model: string,
  questionItem: any,
  mode: 'full' | 'options' | 'answer',
  baseUrl: string = DEFAULT_OLLAMA_URL
): Promise<any> {
  const userUrl = baseUrl.replace(/\/$/, '');
  const endpointsToTry = Array.from(new Set([userUrl, 'http://localhost:11434', 'http://127.0.0.1:11434']));
  const topic = questionItem.topic || 'Subject Matter';

  const systemPrompt = `You are a quiz authoring AI assistant. Return ONLY a JSON object strictly about the topic "${topic}".`;
  
  const userPrompt = `Revise this question (${mode} mode) strictly about "${topic}" in JSON format:
Question: "${questionItem.question}"
Type: ${questionItem.type}
Topic: ${topic}

Respond with JSON:
{
  "question": "Revised question stem strictly about ${topic}",
  "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
  "correctAnswer": 0
}`;

  for (const endpoint of endpointsToTry) {
    try {
      const cleanUrl = endpoint.replace(/\/$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout for question regeneration

      const response = await fetch(`${cleanUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: model || 'llama3.2:latest',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: false,
          format: 'json',
          options: {
            num_ctx: 1024,
            num_predict: 300,
            temperature: 0.0,
          },
        }),
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rawText = data.message?.content || data.response || '';
        const parsed = parseTruncatedJson(rawText);
        if (parsed) {
          const updated = { ...questionItem };
          const qStem = parsed.question || parsed.stem || parsed.text || parsed.q;
          if (qStem) updated.question = qStem;
          if (parsed.options || parsed.o) updated.options = parsed.options || parsed.o;
          const rawAns = parsed.correctAnswer ?? parsed.answer ?? parsed.a;
          if (rawAns !== undefined) updated.correctAnswer = rawAns;
          return updated;
        }
      }
    } catch (err) {
      console.warn('Ollama regenerate attempt failed:', err);
    }
  }

  return {
    ...questionItem,
    question: `Revised Question about ${topic}: ${questionItem.question.replace(/\(AI Revised\)/g, '').trim()}`,
  };
}

/**
 * Generates structured learning modules with lesson text and quizzes for ReviewerGenerator.
 */
export async function generateReviewerWithOllama(params: ReviewerGenerationParams): Promise<any[]> {
  const userUrl = (params.baseUrl || DEFAULT_OLLAMA_URL).replace(/\/$/, '');
  const endpointsToTry = Array.from(new Set([userUrl, 'http://localhost:11434', 'http://127.0.0.1:11434']));

  const moduleCounts = { easy: 3, normal: 4, hard: 5 };
  const itemsPerModule = { easy: 4, normal: 5, hard: 6 };
  const targetCount = moduleCounts[params.difficulty] || 3;
  const itemsCount = itemsPerModule[params.difficulty] || 4;

  const topicPrompt = params.customInstructions?.trim()
    ? `Subject: "${params.subject}". Focus: "${params.customInstructions.trim()}"`
    : `Subject: "${params.subject}"`;

  const systemPrompt = `You are a learning content authoring AI strictly creating study modules for: ${topicPrompt}.
Keep lesson content brief (3 bullet points max) and question stems concise (max 10 words). Respond ONLY with valid JSON.`;

  const userPrompt = `Create a study reviewer strictly based on: ${topicPrompt}.
Create exactly ${targetCount} modules with ${itemsCount} questions per module.

${params.uploadedText ? `Reference Material: ${params.uploadedText.substring(0, 1000)}\n` : ''}

Respond ONLY with valid JSON:
{
  "modules": [
    {
      "title": "Module 1: Title",
      "topic": "Topic Name",
      "lessonContent": "### Module Overview\\n- Point 1\\n- Point 2\\n- Point 3",
      "questions": [
        {
          "type": "multiple-choice",
          "question": "Question stem about ${params.subject}",
          "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
          "correctAnswer": 0,
          "explanation": "Short explanation"
        }
      ]
    }
  ]
}`;

  let rawModules: any[] = [];
  let connectionError: string | null = null;

  for (const endpoint of endpointsToTry) {
    try {
      const cleanEndpoint = endpoint.replace(/\/$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const response = await fetch(`${cleanEndpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: params.model || 'llama3.2:latest',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: true,
          format: 'json',
          keep_alive: '15m',
          options: {
            num_ctx: 1024,
            num_predict: 550,
            temperature: 0.0,
            top_k: 10,
            top_p: 0.5,
          },
        }),
      });
      clearTimeout(timeoutId);

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n').filter((l) => l.trim());
          for (const line of lines) {
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                accumulatedText += json.message.content;
              } else if (json.response) {
                accumulatedText += json.response;
              }
            } catch (e) {}
          }
        }

        const parsed = parseTruncatedJson(accumulatedText);
        if (parsed) {
          rawModules = parsed.modules || parsed.study_modules || parsed.data || (Array.isArray(parsed) ? parsed : []);
          if (rawModules.length > 0) break;
        }
      }
    } catch (err: any) {
      connectionError = err.name === 'AbortError' 
        ? 'Ollama request timed out after 90s' 
        : (err.message || 'Connection failed');
    }
  }

  if (rawModules.length > 0) {
    return rawModules.map((mod: any, idx: number) => ({
      id: `mod-ollama-${Date.now()}-${idx}`,
      number: idx + 1,
      title: mod.title || `Module ${idx + 1}: ${mod.topic || params.subject}`,
      topic: mod.topic || `${params.subject} Topic ${idx + 1}`,
      lessonContent: mod.lessonContent || `Module ${idx + 1} study guide content for ${params.subject}.`,
      questions: (mod.questions || mod.quiz || []).map((q: any, qIdx: number) => ({
        id: `q-ollama-${Date.now()}-${idx}-${qIdx}`,
        type: q.type || q.question_type || 'multiple-choice',
        question: q.question || q.stem || q.text || `Question testing ${params.subject}`,
        options: q.options || q.choices || ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : (q.answer !== undefined ? q.answer : 0),
        explanation: q.explanation || 'Correct based on module reading content.',
      })),
      status: 'unlocked',
      bestScore: null,
      attempts: 0,
    }));
  }

  console.warn(`Ollama reviewer generation failed (${connectionError || 'No response'}), using topic fallback engine.`);
  return buildTopicDrivenModules(params.subject, params.difficulty, targetCount, itemsCount);
}
