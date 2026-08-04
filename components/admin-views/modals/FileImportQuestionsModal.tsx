import React, { useRef, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { api, ApiErrorWithRows } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, UploadCloud, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

interface FileImportQuestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
  defaultSubject?: string;
}

const TEMPLATE_FORMATS: { format: 'xlsx' | 'xls' | 'csv'; label: string }[] = [
  { format: 'xlsx', label: '.xlsx' },
  { format: 'xls', label: '.xls' },
  { format: 'csv', label: '.csv' },
];

export function FileImportQuestionsModal({ open, onOpenChange, examId, defaultSubject }: FileImportQuestionsModalProps) {
  const { importQuestionsFromFile, isLoading } = useAdminStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState(defaultSubject || '');
  const [marks, setMarks] = useState('1');
  const [difficulty, setDifficulty] = useState('Medium');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rowErrors, setRowErrors] = useState<{ row: number; error: string }[]>([]);
  const [generalError, setGeneralError] = useState('');

  const resetForm = () => {
    setSubject(defaultSubject || '');
    setMarks('1');
    setDifficulty('Medium');
    setSelectedFile(null);
    setRowErrors([]);
    setGeneralError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  React.useEffect(() => {
    if (open) resetForm();
  }, [open]);

  const handleDownloadTemplate = async (format: 'xlsx' | 'xls' | 'csv') => {
    try {
      const response = await api.get(`/exams/${examId}/questions/template`, {
        params: { format },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `question-import-template.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download template');
    }
  };

  const handleSubmit = async () => {
    setRowErrors([]);
    setGeneralError('');

    if (!subject.trim()) {
      setGeneralError('Subject is required.');
      return;
    }
    if (!selectedFile) {
      setGeneralError('Please choose a .xlsx, .xls, or .csv file to import.');
      return;
    }

    try {
      await importQuestionsFromFile(examId, selectedFile, {
        subject: subject.trim(),
        marks: Number(marks) || 1,
        difficulty,
      });
      onOpenChange(false);
    } catch (err) {
      const apiErr = err as ApiErrorWithRows;
      if (apiErr.rowErrors && apiErr.rowErrors.length > 0) {
        setRowErrors(apiErr.rowErrors);
      } else {
        setGeneralError(apiErr.message || 'Import failed.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Questions from File</DialogTitle>
          <DialogDescription>
            Upload a .xlsx, .xls, or .csv file. Required columns vary by question type (Multiple Choice, True/False, Descriptive, Fill in the Blank, Coding).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Template downloads */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Don't have a file yet? Download a sample template:</p>
            <div className="flex gap-2">
              {TEMPLATE_FORMATS.map(({ format, label }) => (
                <Button
                  key={format}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadTemplate(format)}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Metadata applied to every imported question */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 col-span-1 md:col-span-3">
              <Label htmlFor="import-subject">Subject *</Label>
              <Input
                id="import-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Computer Science"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-marks">Default Marks</Label>
              <Input
                id="import-marks"
                type="number"
                min={1}
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Default Difficulty</Label>
              <Select value={difficulty} onValueChange={(val) => setDifficulty(val || 'Medium')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File picker */}
          <div className="space-y-2">
            <Label>Question File *</Label>
            <label
              htmlFor="import-file"
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 cursor-pointer hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
            >
              {selectedFile ? (
                <>
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{selectedFile.name}</span>
                  <span className="text-xs text-slate-500">Click to choose a different file</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to choose a file</span>
                  <span className="text-xs text-slate-500">.xlsx, .xls, or .csv only</span>
                </>
              )}
              <input
                id="import-file"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {generalError && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400 flex gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {generalError}
            </div>
          )}

          {rowErrors.length > 0 && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
              <div className="flex gap-2 font-semibold mb-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> The file has errors and nothing was imported:
              </div>
              <ul className="list-disc pl-8 space-y-1 max-h-40 overflow-y-auto">
                {rowErrors.map((e, i) => (
                  <li key={i}>Row {e.row}: {e.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isLoading ? 'Importing...' : 'Import Questions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
