export interface QaQuestion {
  question: string;
  expectedAnswer: string;
  keyPoints: string[];
}

export function buildQaPrompt(
  itemName: string,
  itemDescription: string | undefined,
  difficulty: string,
  questionCount: number,
  promptComment?: string,
): string {
  const descriptionPart = itemDescription
    ? `\nItem description: ${itemDescription}`
    : '';
  const commentPart = promptComment
    ? `\nAdditional instructions: ${promptComment}`
    : '';

  return `You are an expert educator creating open-ended assessment questions.

Topic: ${itemName}${descriptionPart}
Difficulty: ${difficulty}
Number of questions: ${questionCount}${commentPart}

Generate exactly ${questionCount} open-ended questions about "${itemName}".
Each question should require a thoughtful written response.

Respond with ONLY a valid JSON array. No markdown, no explanation, no code fences.
Use this exact structure:
[
  {
    "question": "Open-ended question here?",
    "expectedAnswer": "A comprehensive model answer covering the main points",
    "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
  }
]

Rules:
- Questions should require explanation, not just recall
- expectedAnswer should be 2-4 sentences covering the core idea
- keyPoints should list 3-5 essential concepts the answer must include
- Difficulty "${difficulty}": ${difficultyGuidance(difficulty)}
- Return exactly ${questionCount} question objects in the array`;
}

function difficultyGuidance(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'explain basic concepts and definitions';
    case 'medium':
      return 'compare, contrast, and apply concepts';
    case 'hard':
      return 'analyze, evaluate, and synthesize advanced ideas';
    default:
      return 'mix of explanation and application';
  }
}
