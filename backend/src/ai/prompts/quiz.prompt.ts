export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export function buildQuizPrompt(
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

  return `You are an expert educator creating a quiz assessment.

Topic: ${itemName}${descriptionPart}
Difficulty: ${difficulty}
Number of questions: ${questionCount}${commentPart}

Generate exactly ${questionCount} multiple-choice questions about "${itemName}".
Each question must have exactly 4 options and one correct answer.

Respond with ONLY a valid JSON array. No markdown, no explanation, no code fences.
Use this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why the answer is correct"
  }
]

Rules:
- correctIndex is 0-based (0 = first option, 3 = last option)
- All options must be plausible but only one correct
- Difficulty "${difficulty}": ${difficultyGuidance(difficulty)}
- Return exactly ${questionCount} question objects in the array`;
}

function difficultyGuidance(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'fundamental concepts, straightforward recall questions';
    case 'medium':
      return 'applied understanding, some analysis required';
    case 'hard':
      return 'deep understanding, edge cases, nuanced distinctions';
    default:
      return 'balanced mix of recall and application';
  }
}
