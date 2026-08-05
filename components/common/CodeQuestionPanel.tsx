'use client';

import { useEffect, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Play, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface CodeQuestionPanelProps {
  examId: string;
  questionId: string;
  initialCode: string;
  onCodeChange: (code: string) => void;
}

interface RunResponse {
  compileError: string | null;
  testResults: { passed: boolean; timedOut: boolean }[] | null;
  passedCount?: number;
  totalCount?: number;
  allPassed?: boolean;
}

const AUTOSAVE_INTERVAL_MS = 15000;

export function CodeQuestionPanel({ examId, questionId, initialCode, onCodeChange }: CodeQuestionPanelProps) {
  const [result, setResult] = useState<RunResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const codeRef = useRef(initialCode);
  const lastSavedRef = useRef(initialCode);

  const flush = () => {
    if (codeRef.current !== lastSavedRef.current) {
      lastSavedRef.current = codeRef.current;
      onCodeChange(codeRef.current);
    }
  };

  useEffect(() => {
    const interval = setInterval(flush, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  const handleMount: OnMount = (editor) => {
    editor.onDidBlurEditorText(flush);
  };

  const handleRun = async () => {
    flush();
    setIsRunning(true);
    setResult(null);
    try {
      const { data } = await api.post(`/exams/${examId}/run-code`, { questionId, code: codeRef.current });
      setResult(data);
      if (data.allPassed) toast.success(`All ${data.totalCount} test case(s) passed — marks recorded`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to run code');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 min-h-0">
      <div className="rounded-lg overflow-hidden border border-slate-300 min-h-0" style={{ height: 420 }}>
        <Editor
          height="100%"
          defaultLanguage="java"
          defaultValue={initialCode}
          theme="vs-dark"
          onChange={(value) => { codeRef.current = value || ''; }}
          onMount={handleMount}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
          }}
        />
      </div>

      {result?.compileError && (
        <div className="rounded-md border border-red-200 bg-slate-950 p-3 font-mono text-xs text-red-400 whitespace-pre-wrap overflow-auto max-h-48">
          {result.compileError}
        </div>
      )}

      {result && !result.compileError && result.testResults && (
        <div className="rounded-md border border-slate-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Test Cases: {result.passedCount}/{result.totalCount} passed
            </span>
            {result.allPassed && (
              <span className="text-xs font-semibold text-emerald-600">All passed — marks recorded</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {result.testResults.map((tc, i) => (
              <span
                key={i}
                title={tc.timedOut ? 'Timed out' : tc.passed ? 'Passed' : 'Failed'}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                  tc.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {tc.timedOut ? <Clock className="w-3 h-3" /> : tc.passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                Test {i + 1}
              </span>
            ))}
          </div>
        </div>
      )}

      <Button type="button" onClick={handleRun} disabled={isRunning} className="w-fit bg-emerald-600 hover:bg-emerald-700 text-white">
        {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
        {isRunning ? 'Running...' : 'Run'}
      </Button>
    </div>
  );
}
