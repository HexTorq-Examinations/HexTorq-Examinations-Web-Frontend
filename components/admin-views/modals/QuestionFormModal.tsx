import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuestionSchema, type Question } from '@/types/admin';
import { useAdminStore } from '@/store/adminStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface QuestionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionToEdit?: Question | null;
}

export function QuestionFormModal({ open, onOpenChange, questionToEdit }: QuestionFormModalProps) {
  const { addQuestion, updateQuestion, isLoading } = useAdminStore();
  
  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Question>({
    resolver: zodResolver(QuestionSchema) as any,
    defaultValues: questionToEdit || {
      type: 'Multiple Choice',
      difficulty: 'Medium',
      marks: 1,
      options: ['', '', '', ''],
      correctAnswer: 0,
    }
  });

  const watchOptions = watch('options') || [];
  const watchAnswer = watch('correctAnswer');
  const watchType = watch('type');

  const appendOption = () => {
    setValue('options', [...watchOptions, '']);
  };

  const removeOption = (index: number) => {
    setValue('options', watchOptions.filter((_, i) => i !== index));
    if (watchAnswer === index) {
      setValue('correctAnswer', 0);
    }
  };

  React.useEffect(() => {
    if (open) {
      if (questionToEdit) {
        reset(questionToEdit);
      } else {
        reset({
          type: 'Multiple Choice',
          difficulty: 'Medium',
          marks: 1,
          options: ['', '', '', ''],
          correctAnswer: 0,
        });
      }
    }
  }, [open, questionToEdit, reset]);

  React.useEffect(() => {
    if (watchType === 'True/False') {
      setValue('options', ['True', 'False']);
      if (watchAnswer > 1) setValue('correctAnswer', 0);
    } else if (watchType === 'Descriptive') {
      setValue('options', []);
      setValue('correctAnswer', 0);
    } else if (watchType === 'Multiple Choice' && watchOptions.length < 2) {
      setValue('options', ['', '', '', '']);
    }
  }, [watchType]);

  const onSubmit = async (data: Question) => {
    if (questionToEdit?.id) {
      await updateQuestion(questionToEdit.id, data);
    } else {
      await addQuestion(data);
    }
    onOpenChange(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{questionToEdit ? 'Edit Question' : 'Create New Question'}</DialogTitle>
          <DialogDescription>
            {questionToEdit ? 'Modify question details.' : 'Add a new question to the central repository.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label htmlFor="text">Question Text *</Label>
              <textarea 
                id="text" 
                {...register('text')} 
                className="w-full flex min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300"
                placeholder="Type your question here..." 
              />
              {errors.text && <p className="text-red-500 text-xs">{errors.text.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input id="subject" {...register('subject')} placeholder="e.g., Physics" />
              {errors.subject && <p className="text-red-500 text-xs">{errors.subject.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                defaultValue={questionToEdit?.type || 'Multiple Choice'} 
                onValueChange={(val) => setValue('type', val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                  <SelectItem value="True/False">True/False</SelectItem>
                  <SelectItem value="Descriptive">Descriptive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select 
                defaultValue={questionToEdit?.difficulty || 'Medium'} 
                onValueChange={(val) => setValue('difficulty', val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marks">Marks *</Label>
              <Input id="marks" type="number" {...register('marks')} placeholder="1" />
              {errors.marks && <p className="text-red-500 text-xs">{errors.marks.message}</p>}
            </div>

            {/* Options Builder */}
            {watchType !== 'Descriptive' && (
            <div className="space-y-4 col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Options & Answer</h4>
                {watchType === 'Multiple Choice' && (
                  <Button type="button" variant="outline" size="sm" onClick={appendOption}>
                    <Plus className="h-4 w-4 mr-1" /> Add Option
                  </Button>
                )}
              </div>
              
              {errors.options && <p className="text-red-500 text-xs">{errors.options.message}</p>}
              
              <div className="space-y-3">
                {watchOptions.map((_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="correctAnswerGroup" 
                      checked={Number(watchAnswer) === index}
                      onChange={() => setValue('correctAnswer', index)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <Input 
                        {...register(`options.${index}` as const)} 
                        placeholder={`Option ${index + 1}`} 
                        className={Number(watchAnswer) === index ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : ''}
                        readOnly={watchType === 'True/False'}
                      />
                    </div>
                    {watchType === 'Multiple Choice' && watchOptions.length > 2 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)}>
                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {errors.correctAnswer && <p className="text-red-500 text-xs">{errors.correctAnswer.message}</p>}
            </div>
            )}

            <div className="space-y-2 col-span-1 md:col-span-2 pt-2">
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <textarea 
                id="explanation" 
                {...register('explanation')} 
                className="w-full flex min-h-[60px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300"
                placeholder="Explain why this answer is correct..." 
              />
            </div>

          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isLoading ? 'Saving...' : 'Save Question'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
