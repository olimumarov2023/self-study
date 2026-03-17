export interface Flashcard {
  front: string;
  back: string;
}

export function buildFlashcardPrompt(
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

  return `You are an expert educator creating flashcards for spaced repetition learning.

Topic: ${itemName}${descriptionPart}
Difficulty: ${difficulty}
Number of flashcards: ${questionCount}${commentPart}

Generate exactly ${questionCount} flashcards about "${itemName}".
Each flashcard should have a concise front (question/prompt) and a clear back (answer).

Respond with ONLY a valid JSON array. No markdown, no explanation, no code fences.
Use this exact structure:
[
  {
    "front": "Question or prompt on the front of the card",
    "back": "Clear, concise answer on the back of the card"
  }
]

Rules:
- Front should be a question, term, or concept prompt
- Back should be the definition, answer, or explanation (1-3 sentences)
- Cover diverse aspects of the topic
- Difficulty "${difficulty}": ${difficultyGuidance(difficulty)}
- Return exactly ${questionCount} flashcard objects in the array`;
}

function difficultyGuidance(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'core terms, basic definitions, foundational facts';
    case 'medium':
      return 'relationships between concepts, how things work';
    case 'hard':
      return 'advanced mechanisms, edge cases, subtle distinctions';
    default:
      return 'mix of definitions and applied concepts';
  }
}
