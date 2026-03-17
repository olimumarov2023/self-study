export interface PracticalTask {
  taskTitle: string;
  description: string;
  requirements: string[];
  hints: string[];
}

export function buildTaskPrompt(
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

  return `You are an expert educator creating practical hands-on tasks.

Topic: ${itemName}${descriptionPart}
Difficulty: ${difficulty}
Number of tasks: ${questionCount}${commentPart}

Generate exactly ${questionCount} practical tasks that will help someone practice "${itemName}".
Tasks should be actionable and build real understanding through doing.

Respond with ONLY a valid JSON array. No markdown, no explanation, no code fences.
Use this exact structure:
[
  {
    "taskTitle": "Short descriptive task title",
    "description": "Clear description of what to build or do and why it matters",
    "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"],
    "hints": ["Hint 1 to get started", "Hint 2 if stuck"]
  }
]

Rules:
- taskTitle should be concise (5-8 words)
- description should explain what to do and the learning goal (2-3 sentences)
- requirements should list 3-5 specific deliverables or acceptance criteria
- hints should provide 2-3 useful nudges without giving away the solution
- Difficulty "${difficulty}": ${difficultyGuidance(difficulty)}
- Return exactly ${questionCount} task objects in the array`;
}

function difficultyGuidance(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'guided exercises with clear steps, single concept focus';
    case 'medium':
      return 'independent implementation, combining multiple concepts';
    case 'hard':
      return 'open-ended challenges, optimization, real-world complexity';
    default:
      return 'practical exercises that build working knowledge';
  }
}
