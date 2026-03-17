export interface TeachBackItem {
  concept: string;
  prompt: string;
  keyPointsToMention: string[];
}

export function buildTeachBackPrompt(
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

  return `You are an expert educator creating teach-back exercises that develop deep understanding.

Topic: ${itemName}${descriptionPart}
Difficulty: ${difficulty}
Number of exercises: ${questionCount}${commentPart}

Generate exactly ${questionCount} teach-back exercises about "${itemName}".
Each exercise asks the learner to explain a concept as if teaching it to someone else.

Respond with ONLY a valid JSON array. No markdown, no explanation, no code fences.
Use this exact structure:
[
  {
    "concept": "The specific concept to explain",
    "prompt": "Explain [concept] to a [audience] as if you are teaching them from scratch. Include [specific aspects].",
    "keyPointsToMention": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"]
  }
]

Rules:
- concept should name the specific sub-topic within "${itemName}"
- prompt should specify the target audience and what aspects to cover (2-3 sentences)
- keyPointsToMention should list 4-6 essential points a good explanation must include
- The audience in the prompt should vary: junior developer, non-technical stakeholder, fellow engineer, etc.
- Difficulty "${difficulty}": ${difficultyGuidance(difficulty)}
- Return exactly ${questionCount} teach-back objects in the array`;
}

function difficultyGuidance(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'explain core concepts to a complete beginner';
    case 'medium':
      return 'explain to someone with basic knowledge, including trade-offs';
    case 'hard':
      return 'explain advanced aspects, internals, and design decisions to a peer';
    default:
      return 'explain clearly with appropriate depth and examples';
  }
}
