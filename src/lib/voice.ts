export type VoiceIntent =
  | { type: 'COMPLETE_TASK'; taskTitle: string }
  | { type: 'NAVIGATE'; destination: '/' | '/stats' | '/tasks' | '/categories' | '/log' }
  | { type: 'CREATE_TASK'; title: string; taskType: 'habit' | 'priority' }
  | { type: 'RUN_AUDIT' }
  | { type: 'UNKNOWN'; transcript: string };

/**
 * Text similarity helper to match spoken phrases to existing task titles
 */
export function findBestTaskMatch<T extends { title: string; is_completed_today?: boolean }>(
  spokenText: string,
  tasks: T[]
): T | null {
  if (!spokenText || tasks.length === 0) return null;
  const cleanSpoken = spokenText.toLowerCase().trim();

  let bestMatch: T | null = null;
  let highestScore = 0;

  for (const task of tasks) {
    const cleanTitle = task.title.toLowerCase().trim();

    // Direct match or substring match
    if (cleanSpoken.includes(cleanTitle) || cleanTitle.includes(cleanSpoken)) {
      return task;
    }

    // Word token overlap scoring
    const spokenWords = cleanSpoken.split(/\s+/);
    const titleWords = cleanTitle.split(/\s+/);

    let matchCount = 0;
    for (const word of spokenWords) {
      if (word.length > 2 && titleWords.some((tw) => tw.includes(word) || word.includes(tw))) {
        matchCount++;
      }
    }

    const score = matchCount / Math.max(titleWords.length, 1);
    if (score > highestScore && score >= 0.4) {
      highestScore = score;
      bestMatch = task;
    }
  }

  return bestMatch;
}

/**
 * Parse transcript into structured voice intent
 */
export function parseVoiceCommand(transcript: string): VoiceIntent {
  const text = transcript.toLowerCase().trim();

  // Navigation intents
  if (text.includes('go to stats') || text.includes('open stats') || text.includes('show stats')) {
    return { type: 'NAVIGATE', destination: '/stats' };
  }
  if (
    text.includes('go to tasks') ||
    text.includes('open tasks') ||
    text.includes('show tasks') ||
    text.includes('manage quests')
  ) {
    return { type: 'NAVIGATE', destination: '/tasks' };
  }
  if (
    text.includes('go to categories') ||
    text.includes('open categories') ||
    text.includes('skill domains')
  ) {
    return { type: 'NAVIGATE', destination: '/categories' };
  }
  if (text.includes('go to log') || text.includes('open log') || text.includes('audit log')) {
    return { type: 'NAVIGATE', destination: '/log' };
  }
  if (
    text.includes('go to dashboard') ||
    text.includes('open dashboard') ||
    text.includes('home') ||
    text.includes('daily quests')
  ) {
    return { type: 'NAVIGATE', destination: '/' };
  }

  // Audit intent
  if (
    text.includes('run audit') ||
    text.includes('enforce penalty') ||
    text.includes('check streaks') ||
    text.includes('penalty check')
  ) {
    return { type: 'RUN_AUDIT' };
  }

  // Create task intent
  const createMatch = text.match(/(?:create task|add task|add habit|add priority|new quest)\s+(.+)/i);
  if (createMatch) {
    const title = createMatch[1].trim();
    const isHabit = text.includes('habit');
    return {
      type: 'CREATE_TASK',
      title,
      taskType: isHabit ? 'habit' : 'priority',
    };
  }

  // Complete task intent
  const completeKeywords = ['complete', 'finish', 'done', 'mark', 'check'];
  for (const kw of completeKeywords) {
    if (text.startsWith(kw) || text.includes(` ${kw} `)) {
      // Extract target task title after keyword
      const parts = text.split(new RegExp(`\\b${kw}\\b`, 'i'));
      const target = parts.slice(1).join(' ').replace(/as done|as complete|task/gi, '').trim();
      if (target) {
        return { type: 'COMPLETE_TASK', taskTitle: target };
      }
    }
  }

  return { type: 'UNKNOWN', transcript };
}

/**
 * Text-To-Speech Synthesizer for System Assistant Voice Feedback
 */
export function speakSystemVoice(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel(); // cancel any active speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 0.9;
  utterance.volume = 0.9;

  // Try to pick a crisp robotic/English voice if available
  const voices = window.speechSynthesis.getVoices();
  const systemVoice = voices.find(
    (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('David'))
  );
  if (systemVoice) {
    utterance.voice = systemVoice;
  }

  window.speechSynthesis.speak(utterance);
}
