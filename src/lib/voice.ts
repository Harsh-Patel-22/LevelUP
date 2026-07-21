export type VoiceIntent =
  | { type: 'COMPLETE_TASK'; taskTitle: string }
  | { type: 'NAVIGATE'; destination: '/' | '/stats' | '/tasks' | '/categories' | '/log' }
  | { type: 'CREATE_TASK'; title: string; taskType: 'habit' | 'priority' }
  | { type: 'RUN_AUDIT' }
  | { type: 'UNKNOWN'; transcript: string };

const NUMBER_WORDS: Record<string, string> = {
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
};

/**
 * Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Normalized string similarity score between 0.0 and 1.0
 */
export function stringSimilarity(str1: string, str2: string): number {
  const a = str1.toLowerCase().trim();
  const b = str2.toLowerCase().trim();
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;

  const maxLen = Math.max(a.length, b.length);
  const dist = levenshteinDistance(a, b);
  return 1.0 - dist / maxLen;
}

/**
 * Normalize spoken text by replacing number words and stripping filler
 */
export function normalizeText(text: string): string {
  let cleaned = text.toLowerCase().trim();

  // Replace number words
  Object.keys(NUMBER_WORDS).forEach((word) => {
    const reg = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(reg, NUMBER_WORDS[word]);
  });

  // Remove common speech filler words
  cleaned = cleaned.replace(/\b(please|the|a|an|task|habit|quest|item|my)\b/gi, ' ');
  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Robust fuzzy matcher to find best task match from spoken input
 */
export function findBestTaskMatch<T extends { id: number; title: string; is_completed_today?: boolean }>(
  spokenText: string,
  tasks: T[]
): T | null {
  if (!spokenText || tasks.length === 0) return null;

  const normSpoken = normalizeText(spokenText);
  let bestMatch: T | null = null;
  let highestScore = 0;

  for (const task of tasks) {
    const normTitle = normalizeText(task.title);

    // 1. Direct equality or substring match
    if (normSpoken === normTitle || normSpoken.includes(normTitle) || normTitle.includes(normSpoken)) {
      return task;
    }

    // 2. Levenshtein full string similarity
    const levScore = stringSimilarity(normSpoken, normTitle);

    // 3. Word token overlap similarity
    const spokenTokens = normSpoken.split(' ').filter((w) => w.length > 1);
    const titleTokens = normTitle.split(' ').filter((w) => w.length > 1);

    let tokenMatches = 0;
    for (const st of spokenTokens) {
      for (const tt of titleTokens) {
        if (st === tt || stringSimilarity(st, tt) >= 0.75) {
          tokenMatches++;
          break;
        }
      }
    }

    const tokenScore = tokenMatches / Math.max(titleTokens.length, 1);
    const combinedScore = Math.max(levScore, tokenScore);

    if (combinedScore > highestScore && combinedScore >= 0.35) {
      highestScore = combinedScore;
      bestMatch = task;
    }
  }

  return bestMatch;
}

/**
 * Robust intent parser supporting natural voice command patterns
 */
export function parseVoiceCommand(transcript: string): VoiceIntent {
  const rawText = transcript.toLowerCase().trim();
  const normText = normalizeText(transcript);

  // 1. Navigation Commands
  const navPatterns = [
    { dest: '/stats' as const, keywords: ['stats', 'statistics', 'graph', 'progression', 'level progress'] },
    { dest: '/tasks' as const, keywords: ['tasks', 'task list', 'manage quests', 'quest list', 'all tasks'] },
    { dest: '/categories' as const, keywords: ['categories', 'category', 'domains', 'skill domains', 'skills'] },
    { dest: '/log' as const, keywords: ['log', 'history', 'xp log', 'audit log', 'ledger', 'activity'] },
    { dest: '/' as const, keywords: ['dashboard', 'home', 'today', 'daily', 'main'] },
  ];

  if (rawText.startsWith('go to') || rawText.startsWith('open') || rawText.startsWith('show') || rawText.startsWith('take me to') || rawText.startsWith('view')) {
    for (const pat of navPatterns) {
      if (pat.keywords.some((kw) => rawText.includes(kw) || normText.includes(kw))) {
        return { type: 'NAVIGATE', destination: pat.dest };
      }
    }
  }

  // Direct short navigation words
  if (rawText === 'stats' || rawText === 'open stats') return { type: 'NAVIGATE', destination: '/stats' };
  if (rawText === 'tasks' || rawText === 'open tasks') return { type: 'NAVIGATE', destination: '/tasks' };
  if (rawText === 'categories' || rawText === 'open categories') return { type: 'NAVIGATE', destination: '/categories' };
  if (rawText === 'log' || rawText === 'open log') return { type: 'NAVIGATE', destination: '/log' };
  if (rawText === 'dashboard' || rawText === 'home') return { type: 'NAVIGATE', destination: '/' };

  // 2. Audit Commands
  if (
    rawText.includes('run audit') ||
    rawText.includes('enforce penalty') ||
    rawText.includes('check streak') ||
    rawText.includes('check penalties') ||
    rawText.includes('penalty check') ||
    rawText.includes('audit system')
  ) {
    return { type: 'RUN_AUDIT' };
  }

  // 3. Create Task Commands
  const createRegex = /(?:create task|add task|add habit|add priority|new quest|remind me to|create habit|create priority)\s+(.+)/i;
  const createMatch = rawText.match(createRegex);
  if (createMatch) {
    const title = createMatch[1].replace(/as habit|as priority|habit|priority/gi, '').trim();
    const isHabit = rawText.includes('habit');
    if (title) {
      return {
        type: 'CREATE_TASK',
        title,
        taskType: isHabit ? 'habit' : 'priority',
      };
    }
  }

  // 4. Complete Task Commands (Supports natural variants: "complete X", "mark X done", "done with X", "check off X", "finished X", "i did X")
  const completePrefixes = [
    'complete',
    'completed',
    'finish',
    'finished',
    'mark',
    'check',
    'check off',
    'cross off',
    'done with',
    'done',
    'i did',
    'i completed',
    'cleared',
  ];

  for (const prefix of completePrefixes) {
    if (rawText.startsWith(prefix) || rawText.includes(` ${prefix} `)) {
      const parts = rawText.split(new RegExp(`\\b${prefix}\\b`, 'i'));
      let target = parts.slice(1).join(' ').replace(/\b(as done|as complete|done|completed|task|habit|quest)\b/gi, '').trim();
      if (!target && parts[0]) target = parts[0].trim();
      if (target) {
        return { type: 'COMPLETE_TASK', taskTitle: target };
      }
    }
  }

  // Fallback: If transcript isn't nav/audit/create, treat as task completion attempt
  if (rawText.length > 3) {
    return { type: 'COMPLETE_TASK', taskTitle: rawText };
  }

  return { type: 'UNKNOWN', transcript };
}

/**
 * Text-To-Speech Synthesizer (Disabled per user request)
 */
export function speakSystemVoice(_text: string) {
  // Disabled: Voice control only listens to user voice input without speaking aloud
}
