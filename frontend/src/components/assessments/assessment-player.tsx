import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AssessmentMode } from '@/types/enums';

import type {
  AssessmentResponse,
  AssessmentAnswers,
  QuizQuestions,
  QaQuestions,
  TaskQuestions,
  FlashcardQuestions,
  TeachBackQuestions,
  BugAnalysisQuestions,
  QuizAnswers,
  QaAnswers,
  TaskAnswers,
  FlashcardAnswers,
  TeachBackAnswers,
  BugAnalysisAnswers,
} from '@/types/assessment.types';

interface AssessmentPlayerProps {
  assessment: AssessmentResponse;
  onSubmit: (answers: AssessmentAnswers) => void;
  isSubmitting: boolean;
}

// ---------------------------------------------------------------------------
// Quiz player
// ---------------------------------------------------------------------------

function QuizPlayer({
  questions,
  onSubmit,
  isSubmitting,
}: {
  questions: QuizQuestions;
  onSubmit: (answers: QuizAnswers) => void;
  isSubmitting: boolean;
}) {
  const [selected, setSelected] = useState<Record<number, number>>({});

  const allAnswered = questions.questions.every((_, i) => selected[i] !== undefined);

  function handleSubmit() {
    const responses = Object.entries(selected).map(([qi, oi]) => ({
      questionIndex: Number(qi),
      selectedOptionIndex: oi,
    }));
    onSubmit({ responses });
  }

  return (
    <div className="space-y-6">
      {questions.questions.map((q, qi) => (
        <Card key={qi}>
          <CardHeader>
            <CardTitle className="text-base">
              <span className="mr-2 text-muted-foreground">Q{qi + 1}.</span>
              {q.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                type="button"
                onClick={() => setSelected((prev) => ({ ...prev, [qi]: oi }))}
                className={cn(
                  'flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left text-sm transition-colors',
                  selected[qi] === oi
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-muted-foreground/40 hover:bg-accent',
                )}
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-xs">
                  {String.fromCharCode(65 + oi)}
                </span>
                {opt}
              </button>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!allAnswered || isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Submit Assessment
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Q&A player (also used for TEACH_BACK)
// ---------------------------------------------------------------------------

function QaPlayer({
  questions,
  onSubmit,
  isSubmitting,
}: {
  questions: QaQuestions;
  onSubmit: (answers: QaAnswers) => void;
  isSubmitting: boolean;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const allAnswered = questions.questions.every(
    (_, i) => (answers[i] ?? '').trim().length > 0,
  );

  function handleSubmit() {
    const responses = questions.questions.map((_, i) => ({
      questionIndex: i,
      answer: answers[i] ?? '',
    }));
    onSubmit({ responses });
  }

  return (
    <div className="space-y-6">
      {questions.questions.map((q, qi) => (
        <Card key={qi}>
          <CardHeader>
            <CardTitle className="text-base">
              <span className="mr-2 text-muted-foreground">Q{qi + 1}.</span>
              {q.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor={`qa-answer-${qi}`} className="sr-only">
              Your answer
            </Label>
            <Textarea
              id={`qa-answer-${qi}`}
              placeholder="Write your answer here..."
              rows={4}
              value={answers[qi] ?? ''}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [qi]: e.target.value }))
              }
            />
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!allAnswered || isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Submit Assessment
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Teach Back player
// ---------------------------------------------------------------------------

function TeachBackPlayer({
  questions,
  onSubmit,
  isSubmitting,
}: {
  questions: TeachBackQuestions;
  onSubmit: (answers: TeachBackAnswers) => void;
  isSubmitting: boolean;
}) {
  const [explanations, setExplanations] = useState<Record<number, string>>({});

  const allAnswered = questions.prompts.every(
    (_, i) => (explanations[i] ?? '').trim().length > 0,
  );

  function handleSubmit() {
    const responses = questions.prompts.map((_, i) => ({
      promptIndex: i,
      explanation: explanations[i] ?? '',
    }));
    onSubmit({ responses });
  }

  return (
    <div className="space-y-6">
      {questions.prompts.map((p, pi) => (
        <Card key={pi}>
          <CardHeader>
            <CardTitle className="text-base">{p.topic}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{p.scenario}</p>
            <Label htmlFor={`tb-answer-${pi}`} className="sr-only">
              Your explanation
            </Label>
            <Textarea
              id={`tb-answer-${pi}`}
              placeholder="Explain the concept as if teaching someone else..."
              rows={5}
              value={explanations[pi] ?? ''}
              onChange={(e) =>
                setExplanations((prev) => ({ ...prev, [pi]: e.target.value }))
              }
            />
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!allAnswered || isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Submit Assessment
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task player
// ---------------------------------------------------------------------------

function TaskPlayer({
  questions,
  onSubmit,
  isSubmitting,
}: {
  questions: TaskQuestions;
  onSubmit: (answers: TaskAnswers) => void;
  isSubmitting: boolean;
}) {
  const [solutions, setSolutions] = useState<Record<number, string>>({});

  const allAnswered = questions.tasks.every(
    (_, i) => (solutions[i] ?? '').trim().length > 0,
  );

  function handleSubmit() {
    const responses = questions.tasks.map((task, i) => ({
      taskIndex: i,
      solution: solutions[i] ?? '',
      language: task.language,
    }));
    onSubmit({ responses });
  }

  return (
    <div className="space-y-6">
      {questions.tasks.map((task, ti) => (
        <Card key={ti}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">{task.description}</CardTitle>
              {task.language && (
                <Badge variant="secondary" className="shrink-0">
                  {task.language}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {task.requirements.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Requirements
                </p>
                <ul className="space-y-1">
                  {task.requirements.map((req, ri) => (
                    <li key={ri} className="flex gap-2 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {task.sampleInput && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Sample Input
                </p>
                <pre className="rounded-md bg-muted px-3 py-2 text-xs">
                  <code>{task.sampleInput}</code>
                </pre>
              </div>
            )}
            <Label htmlFor={`task-solution-${ti}`} className="sr-only">
              Your solution
            </Label>
            <Textarea
              id={`task-solution-${ti}`}
              placeholder="Write your solution here..."
              rows={6}
              value={solutions[ti] ?? ''}
              onChange={(e) =>
                setSolutions((prev) => ({ ...prev, [ti]: e.target.value }))
              }
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!allAnswered || isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Submit Assessment
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Flashcard player
// ---------------------------------------------------------------------------

function FlashcardPlayer({
  questions,
  onSubmit,
  isSubmitting,
}: {
  questions: FlashcardQuestions;
  onSubmit: (answers: FlashcardAnswers) => void;
  isSubmitting: boolean;
}) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [selfRatings, setSelfRatings] = useState<Record<number, 1 | 2 | 3>>({});

  const allRated = questions.cards.every((_, i) => selfRatings[i] !== undefined);

  function handleSubmit() {
    const responses = questions.cards.map((_, i) => ({
      cardIndex: i,
      userAnswer: userAnswers[i] ?? '',
      selfRating: selfRatings[i] ?? (1 as 1 | 2 | 3),
    }));
    onSubmit({ responses });
  }

  const RATINGS: { value: 1 | 2 | 3; label: string; color: string }[] = [
    { value: 1, label: 'Missed', color: 'border-red-400 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' },
    { value: 2, label: 'Partial', color: 'border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' },
    { value: 3, label: 'Got it', color: 'border-green-400 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
  ];

  return (
    <div className="space-y-6">
      {questions.cards.map((card, ci) => (
        <Card key={ci}>
          <CardContent className="pt-6 space-y-4">
            {/* Front */}
            <div className="rounded-md bg-muted px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                Front
              </p>
              <p className="text-sm font-medium">{card.front}</p>
            </div>

            {/* User writes answer before flipping */}
            {!flipped[ci] && (
              <div className="space-y-2">
                <Label htmlFor={`fc-answer-${ci}`} className="text-sm">
                  Your answer (optional — write before revealing)
                </Label>
                <Textarea
                  id={`fc-answer-${ci}`}
                  placeholder="Write your answer before flipping..."
                  rows={2}
                  value={userAnswers[ci] ?? ''}
                  onChange={(e) =>
                    setUserAnswers((prev) => ({ ...prev, [ci]: e.target.value }))
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFlipped((prev) => ({ ...prev, [ci]: true }))}
                >
                  Reveal Answer
                </Button>
              </div>
            )}

            {/* Back (revealed) */}
            {flipped[ci] && (
              <div className="space-y-3">
                <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                    Answer
                  </p>
                  <p className="text-sm">{card.back}</p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    How well did you know this?
                  </p>
                  <div className="flex gap-2">
                    {RATINGS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() =>
                          setSelfRatings((prev) => ({ ...prev, [ci]: r.value }))
                        }
                        className={cn(
                          'flex-1 rounded-md border py-2 text-xs font-medium transition-colors',
                          selfRatings[ci] === r.value
                            ? r.color
                            : 'border-border hover:bg-accent',
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!allRated || isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Submit Assessment
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bug Analysis player
// ---------------------------------------------------------------------------

function BugAnalysisPlayer({
  questions,
  onSubmit,
  isSubmitting,
}: {
  questions: BugAnalysisQuestions;
  onSubmit: (answers: BugAnalysisAnswers) => void;
  isSubmitting: boolean;
}) {
  const [bugsText, setBugsText] = useState<Record<number, string>>({});
  const [fixesText, setFixesText] = useState<Record<number, string>>({});
  const [explanations, setExplanations] = useState<Record<number, string>>({});

  const allAnswered = questions.snippets.every(
    (_, i) =>
      (bugsText[i] ?? '').trim().length > 0 &&
      (explanations[i] ?? '').trim().length > 0,
  );

  function handleSubmit() {
    const responses = questions.snippets.map((_, i) => ({
      snippetIndex: i,
      // Split on newlines for a simple multi-entry format
      identifiedBugs: (bugsText[i] ?? '')
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean),
      proposedFixes: (fixesText[i] ?? '')
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
      explanation: explanations[i] ?? '',
    }));
    onSubmit({ responses });
  }

  return (
    <div className="space-y-6">
      {questions.snippets.map((snippet, si) => (
        <Card key={si}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Snippet {si + 1}</CardTitle>
              <Badge variant="secondary">{snippet.language}</Badge>
            </div>
            {snippet.context && (
              <p className="text-sm text-muted-foreground">{snippet.context}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="overflow-x-auto rounded-md bg-muted px-4 py-3 text-xs leading-relaxed">
              <code>{snippet.code}</code>
            </pre>

            <div className="space-y-2">
              <Label htmlFor={`ba-bugs-${si}`}>
                Identified Bugs{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  (one per line)
                </span>
              </Label>
              <Textarea
                id={`ba-bugs-${si}`}
                placeholder="Line 5: Off-by-one error in loop condition&#10;Line 12: Unchecked null dereference"
                rows={3}
                value={bugsText[si] ?? ''}
                onChange={(e) =>
                  setBugsText((prev) => ({ ...prev, [si]: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`ba-fixes-${si}`}>
                Proposed Fixes{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  (one per line, optional)
                </span>
              </Label>
              <Textarea
                id={`ba-fixes-${si}`}
                placeholder="Change i <= n to i < n&#10;Add a null check before accessing .value"
                rows={3}
                value={fixesText[si] ?? ''}
                onChange={(e) =>
                  setFixesText((prev) => ({ ...prev, [si]: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`ba-explanation-${si}`}>Explanation</Label>
              <Textarea
                id={`ba-explanation-${si}`}
                placeholder="Explain why these bugs are problematic and how they manifest..."
                rows={3}
                value={explanations[si] ?? ''}
                onChange={(e) =>
                  setExplanations((prev) => ({ ...prev, [si]: e.target.value }))
                }
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!allAnswered || isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Submit Assessment
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root player — dispatches to mode-specific sub-component
// ---------------------------------------------------------------------------

export function AssessmentPlayer({
  assessment,
  onSubmit,
  isSubmitting,
}: AssessmentPlayerProps) {
  const { mode, questions } = assessment;

  if (!questions) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Assessment questions are not available yet. Please refresh the page.
      </div>
    );
  }

  if (mode === AssessmentMode.QUIZ) {
    // questions is QuizQuestions when mode is QUIZ
    const q = questions as QuizQuestions;
    return (
      <QuizPlayer
        questions={q}
        onSubmit={(answers) => onSubmit(answers)}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (mode === AssessmentMode.QA) {
    const q = questions as QaQuestions;
    return (
      <QaPlayer
        questions={q}
        onSubmit={(answers) => onSubmit(answers)}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (mode === AssessmentMode.TEACH_BACK) {
    const q = questions as TeachBackQuestions;
    return (
      <TeachBackPlayer
        questions={q}
        onSubmit={(answers) => onSubmit(answers)}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (mode === AssessmentMode.TASK) {
    const q = questions as TaskQuestions;
    return (
      <TaskPlayer
        questions={q}
        onSubmit={(answers) => onSubmit(answers)}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (mode === AssessmentMode.FLASHCARD) {
    const q = questions as FlashcardQuestions;
    return (
      <FlashcardPlayer
        questions={q}
        onSubmit={(answers) => onSubmit(answers)}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (mode === AssessmentMode.BUG_ANALYSIS) {
    const q = questions as BugAnalysisQuestions;
    return (
      <BugAnalysisPlayer
        questions={q}
        onSubmit={(answers) => onSubmit(answers)}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <div className="rounded-lg border p-4 text-sm text-muted-foreground">
      Unknown assessment mode: {mode}
    </div>
  );
}
