export interface BugAnalysisItem {
  codeSnippet: string;
  language: string;
  bugs: string[];
  fixDescription: string;
}

export function buildBugAnalysisPrompt(
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

  return `You are an expert educator creating bug-finding exercises to teach debugging skills.

Topic: ${itemName}${descriptionPart}
Difficulty: ${difficulty}
Number of exercises: ${questionCount}${commentPart}

Generate exactly ${questionCount} buggy code snippets related to "${itemName}".
Each snippet should contain deliberate bugs that the learner must identify and fix.

Respond with ONLY a valid JSON array. No markdown, no explanation, no code fences.
Use this exact structure:
[
  {
    "codeSnippet": "// Buggy code here\\nfunction example() {\\n  // ...\\n}",
    "language": "javascript",
    "bugs": ["Description of bug 1", "Description of bug 2"],
    "fixDescription": "Explanation of how to fix the bugs and why they are bugs"
  }
]

Rules:
- codeSnippet must be a realistic, self-contained code snippet (10-30 lines)
- Use \\n for newlines inside the JSON string value
- language should be the programming language (e.g., "javascript", "python", "typescript")
- bugs should list each bug as a clear, specific description (not the fix)
- fixDescription should explain the correct approach and why the original was wrong
- Difficulty "${difficulty}": ${difficultyGuidance(difficulty)}
- Return exactly ${questionCount} exercise objects in the array`;
}

function difficultyGuidance(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'obvious syntax errors, simple logic mistakes, off-by-one errors';
    case 'medium':
      return 'subtle logic errors, async issues, incorrect data handling';
    case 'hard':
      return 'concurrency bugs, security vulnerabilities, performance issues, edge cases';
    default:
      return 'mix of syntax and logic bugs';
  }
}
