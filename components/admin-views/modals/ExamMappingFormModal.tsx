import React, { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useAcademicStore } from '@/store/academicStore';
import { Exam, ExamMapping } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ExamMappingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: Exam | null;
  mappingToEdit?: ExamMapping | null;
}

export function ExamMappingFormModal({ open, onOpenChange, exam, mappingToEdit }: ExamMappingFormModalProps) {
  const { addExamMapping, updateExamMapping, isLoading } = useAdminStore();
  const { selectedBatchId, schools, departments, classes, fetchSchools, fetchDepartments, fetchClasses } = useAcademicStore();

  const [schoolId, setSchoolId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hall, setHall] = useState('Virtual');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (mappingToEdit) {
      setClassId(mappingToEdit.classId);
      setDate(mappingToEdit.date.slice(0, 10));
      setStartTime(mappingToEdit.startTime);
      setEndTime(mappingToEdit.endTime);
      setHall(mappingToEdit.hall);
    } else {
      setSchoolId('');
      setDepartmentId('');
      setClassId('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setHall('Virtual');
    }
    if (selectedBatchId) fetchSchools(selectedBatchId);
  }, [open, mappingToEdit, selectedBatchId, fetchSchools]);

  const handleSchoolChange = (id: string | null) => {
    if (!id) return;
    setSchoolId(id);
    setDepartmentId('');
    setClassId('');
    fetchDepartments(id);
  };

  const handleDepartmentChange = (id: string | null) => {
    if (!id) return;
    setDepartmentId(id);
    setClassId('');
    fetchClasses(id);
  };

  const handleSubmit = async () => {
    if (!classId || !date || !startTime || !endTime) {
      setError('Class, date, start time, and end time are all required.');
      return;
    }
    if (!exam?.id) return;

    if (mappingToEdit?.id) {
      await updateExamMapping(mappingToEdit.id, { date, startTime, endTime, hall });
    } else {
      await addExamMapping({ examId: exam.id, classId, date, startTime, endTime, hall, status: 'Scheduled' });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-140">
        <DialogHeader>
          <DialogTitle>{mappingToEdit ? 'Edit Exam Mapping' : 'Map Exam to Class'}</DialogTitle>
          <DialogDescription>
            {exam ? `Schedule "${exam.title}" for a class.` : 'Select the class and schedule.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {!mappingToEdit && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>School *</Label>
                <Select value={schoolId} onValueChange={handleSchoolChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school">
                      {(value: string | null) => schools.find((s) => s.id === value)?.name ?? 'Select school'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((s) => <SelectItem key={s.id} value={s.id!}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select value={departmentId} onValueChange={handleDepartmentChange} disabled={!schoolId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department">
                      {(value: string | null) => departments.find((d) => d.id === value)?.name ?? 'Select department'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id!}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={classId} onValueChange={(id) => id && setClassId(id)} disabled={!departmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class">
                      {(value: string | null) => classes.find((c) => c.id === value)?.name ?? 'Select class'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id!}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mapping-date">Date *</Label>
              <Input id="mapping-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mapping-start">Start Time *</Label>
              <Input id="mapping-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mapping-end">End Time *</Label>
              <Input id="mapping-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mapping-hall">Hall / Venue</Label>
            <Input id="mapping-hall" value={hall} onChange={(e) => setHall(e.target.value)} placeholder="e.g., Virtual, Hall A" />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isLoading ? 'Saving...' : 'Save Mapping'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
