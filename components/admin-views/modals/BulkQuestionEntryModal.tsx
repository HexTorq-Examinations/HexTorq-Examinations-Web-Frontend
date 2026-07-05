import React, { useState, useEffect } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { Question, QuestionSchema } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BulkQuestionEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultQuestion: Question = {
  text: '',
  subject: '',
  type: 'Multiple Choice',
  difficulty: 'Medium',
  marks: 1,
  options: ['', '', '', ''],
  correctAnswer: 0,
};

export function BulkQuestionEntryModal({ open, onOpenChange }: BulkQuestionEntryModalProps) {
  const { addQuestions, isLoading } = useAdminStore();
  
  const [questions, setQuestions] = useState<Question[]>([ { ...defaultQuestion } ]);
  const [errors, setErrors] = useState<Record<number, string[]>>({});

  useEffect(() => {
    if (open) {
      setQuestions([ { ...defaultQuestion } ]);
      setErrors({});
    }
  }, [open]);

  const handleAddQuestion = () => {
    // Optionally inherit subject from previous
    const lastSubject = questions.length > 0 ? questions[questions.length - 1].subject : '';
    setQuestions([...questions, { ...defaultQuestion, subject: lastSubject }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    let newQ = { ...updated[index], [field]: value };
    
    if (field === 'type') {
      if (value === 'True/False') {
        newQ.options = ['True', 'False'];
        if ((newQ.correctAnswer ?? 0) > 1) newQ.correctAnswer = 0;
      } else if (value === 'Descriptive') {
        newQ.options = [];
        newQ.correctAnswer = 0;
      } else if (value === 'Multiple Choice' && (!newQ.options || newQ.options.length < 2)) {
        newQ.options = ['', '', '', ''];
      }
    }
    
    updated[index] = newQ;
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    const newOptions = [...(updated[qIndex].options || [])];
    newOptions[optIndex] = value;
    updated[qIndex].options = newOptions;
    setQuestions(updated);
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = [...(updated[qIndex].options || []), ''];
    setQuestions(updated);
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    const newOptions = (updated[qIndex].options || []).filter((_, i) => i !== optIndex);
    updated[qIndex].options = newOptions;
    if (updated[qIndex].correctAnswer === optIndex) {
      updated[qIndex].correctAnswer = 0;
    }
    setQuestions(updated);
  };

  const validateAll = () => {
    let isValid = true;
    const newErrors: Record<number, string[]> = {};

    questions.forEach((q, index) => {
      const result = QuestionSchema.safeParse(q);
      if (!result.success) {
        isValid = false;
        newErrors[index] = result.error.issues.map((issue: any) => issue.message);
      } else if (!q.text.trim()) {
         isValid = false;
         newErrors[index] = ['Question text cannot be empty'];
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSaveAll = async () => {
    if (questions.length === 0) {
      toast.error('Add at least one question');
      return;
    }

    if (!validateAll()) {
      toast.error('Please fix the errors in your questions before saving');
      return;
    }

    await addQuestions(questions);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 shrink-0 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle>Bulk Manual Question Entry</DialogTitle>
          <DialogDescription>
            Add multiple questions in a single session. They will be saved to the Question Bank simultaneously.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50 dark:bg-slate-950/50">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
              {/* Question Header */}
              <div className="bg-slate-100 dark:bg-slate-800/50 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300">Question {qIndex + 1}</h4>
                {questions.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleRemoveQuestion(qIndex)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Error Display */}
              {errors[qIndex] && (
                <div className="bg-red-50 dark:bg-red-950/50 p-3 flex gap-2 border-b border-red-100 dark:border-red-900">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-red-600">
                    <ul className="list-disc pl-4 space-y-1">
                      {errors[qIndex].map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label>Question Text *</Label>
                  <textarea 
                    value={q.text}
                    onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                    className="w-full flex min-h-[60px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:focus-visible:ring-slate-300"
                    placeholder="Type your question here..." 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Input 
                    value={q.subject}
                    onChange={(e) => updateQuestion(qIndex, 'subject', e.target.value)}
                    placeholder="e.g., Mathematics" 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={q.type} onValueChange={(val) => updateQuestion(qIndex, 'type', val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                      <SelectItem value="True/False">True/False</SelectItem>
                      <SelectItem value="Descriptive">Descriptive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={q.difficulty} onValueChange={(val) => updateQuestion(qIndex, 'difficulty', val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Marks *</Label>
                  <Input 
                    type="number" 
                    value={q.marks}
                    onChange={(e) => updateQuestion(qIndex, 'marks', Number(e.target.value))}
                  />
                </div>

                {/* Options Builder */}
                {q.type !== 'Descriptive' && (
                <div className="space-y-3 col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <Label>Options & Correct Answer</Label>
                    {q.type === 'Multiple Choice' && (
                      <Button type="button" variant="outline" size="sm" onClick={() => addOption(qIndex)}>
                        <Plus className="h-3 w-3 mr-1" /> Add Option
                      </Button>
                    )}
                  </div>
                  
                  {q.options?.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name={`correct-${qIndex}`} 
                        checked={q.correctAnswer === optIndex}
                        onChange={() => updateQuestion(qIndex, 'correctAnswer', optIndex)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <Input 
                        value={opt}
                        onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                        placeholder={`Option ${optIndex + 1}`} 
                        className={q.correctAnswer === optIndex ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : ''}
                        readOnly={q.type === 'True/False'}
                      />
                      {q.type === 'Multiple Choice' && (q.options?.length || 0) > 2 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(qIndex, optIndex)}>
                          <Trash2 className="h-4 w-4 text-slate-400" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" className="w-full border-dashed border-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-900 py-6" onClick={handleAddQuestion}>
            <Plus className="h-5 w-5 mr-2 text-slate-500" /> 
            <span className="font-semibold text-slate-600 dark:text-slate-400">Add Another Question</span>
          </Button>

        </div>

        <DialogFooter className="px-6 py-4 shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSaveAll} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isLoading ? 'Saving All...' : `Save All ${questions.length} Questions`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
