'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Settings2, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type ExportFormat = 'csv' | 'xlsx';

interface ExportMenuProps {
  /** Unique key for this export surface — scopes the saved custom-column selection in this browser. */
  exportKey: string;
  /** Backend export endpoint, e.g. '/exams/export' or `/exams/${examId}/questions/export`. */
  endpoint: string;
  /** All available column labels, in default display order — must match the backend's allColumns. */
  columns: string[];
  /** Base filename (without extension) for the downloaded file. */
  filename: string;
  /** Extra query params to forward (e.g. classId, examId scoping). */
  params?: Record<string, string>;
  /** Disable when there's nothing to export yet. */
  disabled?: boolean;
}

const storageKey = (exportKey: string) => `export-columns:${exportKey}`;

const loadSavedColumns = (exportKey: string, allColumns: string[]): string[] => {
  if (typeof window === 'undefined') return allColumns;
  try {
    const raw = window.localStorage.getItem(storageKey(exportKey));
    if (!raw) return allColumns;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return allColumns;
    const valid = parsed.filter((c) => allColumns.includes(c));
    return valid.length > 0 ? valid : allColumns;
  } catch {
    return allColumns;
  }
};

export function ExportMenu({ exportKey, endpoint, columns, filename, params, disabled }: ExportMenuProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(() => loadSavedColumns(exportKey, columns));
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [isDownloading, setIsDownloading] = useState(false);

  const download = async (fmt: ExportFormat, columnList?: string[]) => {
    setIsDownloading(true);
    try {
      const { data } = await api.get(endpoint, {
        responseType: 'blob',
        params: {
          ...params,
          format: fmt,
          ...(columnList ? { columns: columnList.join(',') } : {}),
        },
      });
      const href = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = `${filename}.${fmt}`;
      anchor.click();
      URL.revokeObjectURL(href);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const openCustom = () => {
    setSelected(loadSavedColumns(exportKey, columns));
    setCustomOpen(true);
  };

  const toggleColumn = (col: string) => {
    setSelected((current) => (current.includes(col) ? current.filter((c) => c !== col) : [...current, col]));
  };

  const handleCustomDownload = async () => {
    if (selected.length === 0) {
      toast.error('Select at least one column');
      return;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey(exportKey), JSON.stringify(selected));
    }
    await download(format, selected);
    setCustomOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={disabled || isDownloading}>
            <Download className="mr-2 h-4 w-4" /> Export <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem className="cursor-pointer" onClick={() => download('xlsx')}>
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> Quick Export (Excel)
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => download('csv')}>
            <FileText className="mr-2 h-4 w-4 text-blue-600" /> Quick Export (CSV)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={openCustom}>
            <Settings2 className="mr-2 h-4 w-4 text-slate-500" /> Custom Export...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Custom Export</DialogTitle>
            <DialogDescription>Choose which columns to include. Your selection is remembered for next time.</DialogDescription>
          </DialogHeader>

          <div className="max-h-64 space-y-2 overflow-y-auto py-2">
            {columns.map((col) => (
              <label key={col} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <Checkbox checked={selected.includes(col)} onCheckedChange={() => toggleColumn(col)} />
                <span className="text-sm text-slate-700 dark:text-slate-200">{col}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t pt-3">
            <span className="text-xs font-medium text-slate-500">Format:</span>
            <Button size="sm" variant={format === 'xlsx' ? 'default' : 'outline'} onClick={() => setFormat('xlsx')}>
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Excel
            </Button>
            <Button size="sm" variant={format === 'csv' ? 'default' : 'outline'} onClick={() => setFormat('csv')}>
              <FileText className="mr-1.5 h-3.5 w-3.5" /> CSV
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomOpen(false)}>Cancel</Button>
            <Button onClick={handleCustomDownload} disabled={isDownloading}>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
