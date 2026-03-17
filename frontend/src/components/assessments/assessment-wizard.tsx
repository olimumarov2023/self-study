import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useGenerateAssessment } from '@/queries/use-assessments';
import { useLearningItems } from '@/queries/use-learning-items';
import { AssessmentMode } from '@/types/enums';

import type { AssessmentMode as AssessmentModeType } from '@/types/enums';

interface AssessmentWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MODE_OPTIONS: { value: AssessmentModeType; label: string; description: string }[] = [
  {
    value: AssessmentMode.QUIZ,
    label: 'Quiz',
    description: 'Multiple choice questions with single correct answer',
  },
  {
    value: AssessmentMode.QA,
    label: 'Q&A',
    description: 'Open-ended questions graded by AI',
  },
  {
    value: AssessmentMode.TASK,
    label: 'Task',
    description: 'Practical coding or written task with requirements',
  },
  {
    value: AssessmentMode.FLASHCARD,
    label: 'Flashcard',
    description: 'Flip cards with self-rating for spaced repetition',
  },
  {
    value: AssessmentMode.TEACH_BACK,
    label: 'Teach Back',
    description: 'Explain a concept as if teaching someone else',
  },
  {
    value: AssessmentMode.BUG_ANALYSIS,
    label: 'Bug Analysis',
    description: 'Identify and explain bugs in code snippets',
  },
];

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20] as const;

type Step = 'configure' | 'generating';

export function AssessmentWizard({ open, onOpenChange }: AssessmentWizardProps) {
  const navigate = useNavigate();
  const generateMutation = useGenerateAssessment();

  const { data: itemsData } = useLearningItems({ limit: 100, offset: 0 });

  const [step, setStep] = useState<Step>('configure');
  const [learningItemId, setLearningItemId] = useState('');
  const [mode, setMode] = useState<AssessmentModeType>(AssessmentMode.QUIZ);
  const [difficulty, setDifficulty] = useState(3);
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15 | 20>(10);
  const [comment, setComment] = useState('');

  function resetForm() {
    setStep('configure');
    setLearningItemId('');
    setMode(AssessmentMode.QUIZ);
    setDifficulty(3);
    setQuestionCount(10);
    setComment('');
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  function handleGenerate() {
    if (!learningItemId) return;

    setStep('generating');

    generateMutation.mutate(
      {
        learningItemId,
        mode,
        difficulty,
        questionCount,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          onOpenChange(false);
          resetForm();
          navigate(`/assessments/${data.id}/run`);
        },
        onError: () => {
          setStep('configure');
        },
      },
    );
  }

  const isConfigureValid = !!learningItemId;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {step === 'configure' ? (
          <>
            <DialogHeader>
              <DialogTitle>New Assessment</DialogTitle>
              <DialogDescription>
                Configure your assessment. AI will generate questions tailored to the topic.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Learning item selector */}
              <div className="space-y-2">
                <Label htmlFor="aw-item">Learning Item</Label>
                <Select value={learningItemId} onValueChange={setLearningItemId}>
                  <SelectTrigger id="aw-item">
                    <SelectValue placeholder="Select a topic to be assessed on" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemsData?.data.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode cards */}
              <div className="space-y-2">
                <Label>Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  {MODE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMode(opt.value)}
                      className={cn(
                        'rounded-md border px-3 py-2.5 text-left transition-colors',
                        mode === opt.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-muted-foreground/50 hover:bg-accent',
                      )}
                    >
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {opt.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Difficulty</Label>
                  <span className="text-sm font-medium text-muted-foreground">{difficulty} / 5</span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[difficulty]}
                  onValueChange={([v]) => setDifficulty(v)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Easy</span>
                  <span>Hard</span>
                </div>
              </div>

              {/* Question count */}
              <div className="space-y-2">
                <Label>Number of Questions</Label>
                <div className="flex gap-2">
                  {QUESTION_COUNT_OPTIONS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={cn(
                        'flex-1 rounded-md border py-1.5 text-sm font-medium transition-colors',
                        questionCount === count
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-muted-foreground/50 hover:bg-accent',
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional comment */}
              <div className="space-y-2">
                <Label htmlFor="aw-comment">
                  Focus Areas{' '}
                  <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="aw-comment"
                  placeholder="e.g. Focus on async/await patterns and error handling"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={!isConfigureValid}>
                Generate Assessment
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Generating Assessment</DialogTitle>
              <DialogDescription>
                AI is crafting your questions. This usually takes a few seconds.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4 py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating your assessment...</p>
              <div className="flex gap-2">
                <Badge variant="secondary">{mode.replace('_', ' ')}</Badge>
                <Badge variant="outline">{questionCount} questions</Badge>
                <Badge variant="outline">Difficulty {difficulty}/5</Badge>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
