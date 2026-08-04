'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Flag, ShieldCheck, X } from 'lucide-react';
import { sanitizeQuestionOptions } from '@/lib/questionOptions';

export interface PreviewExam {
  id?: string;
  title: string;
  subject: string;
  duration: number;
  totalMarks: number;
  questions: { id: string; text: string; options: string[]; marks: number; type?: string }[];
}

// Types with no fixed option list — students type a free-text answer instead.
const FREE_TEXT_TYPES = new Set(['Descriptive', 'Fill in the Blank']);

export function StudentExamPreview({ exam, onClose }: { exam: PreviewExam; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const question = exam.questions[index] ? sanitizeQuestionOptions(exam.questions[index]) : undefined;
  const toggleFlag = () => setFlagged(current => {
    if (!question) return current;
    const next = new Set(current);
    if (next.has(question.id)) {
      next.delete(question.id);
    } else {
      next.add(question.id);
    }
    return next;
  });

  return <div className="fixed inset-0 z-[100] flex flex-col bg-slate-100 text-slate-900" role="dialog" aria-modal="true" aria-label={`Student preview of ${exam.title}`}>
    <div className="flex items-center justify-between gap-4 bg-slate-950 px-4 py-3 text-white md:px-6">
      <div className="min-w-0"><p className="truncate font-semibold">{exam.title}</p><p className="text-xs text-slate-400">{exam.subject} · Student portal preview</p></div>
      <div className="flex items-center gap-3">
        <span className="hidden rounded bg-amber-500/15 px-3 py-1 text-xs text-amber-300 sm:block">Preview only — nothing is saved</span>
        <div className="flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2 font-mono" role="timer"><Clock className="h-4 w-4" />{String(Math.floor(exam.duration / 60)).padStart(2, '0')}:{String(exam.duration % 60).padStart(2, '0')}:00</div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-slate-800 hover:text-white" aria-label="Close student preview"><X /></Button>
      </div>
    </div>

    {question ? <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto p-4 lg:grid-cols-[1fr_300px] lg:p-6">
      <Card className="flex min-h-[520px] flex-col p-5 md:p-8">
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <span className="text-sm font-medium text-slate-500">Question {index + 1} of {exam.questions.length}</span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">{question.marks} mark{question.marks === 1 ? '' : 's'}</span>
        </div>
        <fieldset className="flex-1">
          <legend className="mb-6 text-lg font-semibold leading-relaxed md:text-xl">{question.text}</legend>
          {question.type === 'Coding' ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Coding questions run in a live sandboxed environment and can't be tested from this preview.
            </div>
          ) : FREE_TEXT_TYPES.has(question.type || '') ? (
            <textarea
              key={question.id}
              defaultValue={answers[question.id] || ''}
              onBlur={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
              placeholder="Type your answer here..."
              className="w-full min-h-[140px] rounded-lg border p-4 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <div className="space-y-3">{question.options.map((option, optionIndex) => {
              const selected = answers[question.id] === option;
              return <label key={optionIndex} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${selected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-slate-50'}`}>
                <input type="radio" name={`preview-${question.id}`} checked={selected} onChange={() => setAnswers({ ...answers, [question.id]: option })} className="mt-1" />
                <span><strong className="mr-2">{String.fromCharCode(65 + optionIndex)}.</strong>{option}</span>
              </label>;
            })}</div>
          )}
        </fieldset>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <Button variant="outline" onClick={() => setIndex(value => value - 1)} disabled={index === 0}><ChevronLeft className="mr-2 h-4 w-4" />Previous</Button>
          <Button variant="outline" onClick={toggleFlag} className={flagged.has(question.id) ? 'border-amber-400 bg-amber-50 text-amber-700' : ''}><Flag className="mr-2 h-4 w-4" />{flagged.has(question.id) ? 'Marked for review' : 'Mark for review'}</Button>
          <Button onClick={() => setIndex(value => value + 1)} disabled={index === exam.questions.length - 1}>Next<ChevronRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </Card>

      <aside className="space-y-4">
        <Card className="p-5"><h2 className="mb-4 font-semibold">Question palette</h2><div className="grid grid-cols-5 gap-2">{exam.questions.map((item, itemIndex) => {
          const answered = !!answers[item.id]; const isFlagged = flagged.has(item.id);
          return <button key={item.id} onClick={() => setIndex(itemIndex)} aria-label={`Question ${itemIndex + 1}${answered ? ', answered' : ''}${isFlagged ? ', marked for review' : ''}`} aria-current={itemIndex === index ? 'step' : undefined} className={`aspect-square rounded-md border text-sm font-semibold ${itemIndex === index ? 'ring-2 ring-blue-500' : ''} ${isFlagged ? 'border-amber-400 bg-amber-100 text-amber-800' : answered ? 'border-emerald-500 bg-emerald-100 text-emerald-800' : 'bg-white'}`}>{itemIndex + 1}</button>;
        })}</div><div className="mt-5 space-y-2 text-xs text-slate-500"><p><span className="mr-2 inline-block h-3 w-3 rounded bg-emerald-100" />Answered: {Object.keys(answers).length}</p><p><span className="mr-2 inline-block h-3 w-3 rounded bg-amber-100" />Review: {flagged.size}</p></div></Card>
        <Card className="p-5"><div className="mb-3 flex items-center gap-2 text-emerald-700"><ShieldCheck className="h-5 w-5" /><strong>Preview mode</strong></div><p className="text-sm text-slate-600">This reproduces the student question experience. It does not start the server timer, create an attempt, save answers, or generate violations.</p></Card>
        <Button className="w-full" disabled>Submit exam (disabled in preview)</Button>
      </aside>
    </div> : <div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><AlertTriangle className="mb-3 h-10 w-10 text-amber-500" /><h2 className="text-xl font-semibold">No questions available</h2><p className="mt-2 text-slate-500">Add questions before reviewing the student portal.</p></div>}
  </div>;
}
