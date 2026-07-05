import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StudentSchema, type Student } from '@/types/admin';
import { useAdminStore } from '@/store/adminStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Info } from 'lucide-react';

interface StudentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentToEdit?: Student | null;
}

export function StudentFormModal({ open, onOpenChange, studentToEdit }: StudentFormModalProps) {
  const { addStudent, updateStudent, isLoading } = useAdminStore();
  const [showPassword, setShowPassword] = React.useState(false);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Student>({
    resolver: zodResolver(StudentSchema) as any,
    defaultValues: studentToEdit || {
      status: 'Active',
    }
  });

  React.useEffect(() => {
    if (open) {
      if (studentToEdit) {
        reset(studentToEdit);
      } else {
        reset({ status: 'Active' });
      }
    }
  }, [open, studentToEdit, reset]);

  const onSubmit = async (data: Student) => {
    if (studentToEdit?.id) {
      await updateStudent(studentToEdit.id, data);
    } else {
      await addStudent(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{studentToEdit ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          <DialogDescription>
            {studentToEdit ? 'Update the details for this student.' : 'Fill in the details to register a new student to the platform.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" {...register('name')} placeholder="e.g., Jane Doe" />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="registerNumber">Register Number *</Label>
              <Input id="registerNumber" {...register('registerNumber')} placeholder="e.g., ENR-2026-001" />
              {errors.registerNumber && <p className="text-red-500 text-xs">{errors.registerNumber.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Input id="department" {...register('department')} placeholder="e.g., Computer Science" />
              {errors.department && <p className="text-red-500 text-xs">{errors.department.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester *</Label>
              <Input id="semester" {...register('semester')} placeholder="e.g., Semester 5" />
              {errors.semester && <p className="text-red-500 text-xs">{errors.semester.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" {...register('email')} placeholder="student@example.com" />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md" title="If left blank, the student's password will be set to 'password123'">
                  <Info className="h-3.5 w-3.5" />
                  <span>Default: password123</span>
                </div>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} {...register('password')} placeholder="e.g., secret123" className="pr-10" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" {...register('phone')} placeholder="+1 (555) 000-0000" />
              {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                defaultValue={studentToEdit?.status || 'Active'} 
                onValueChange={(val) => setValue('status', val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isLoading ? 'Saving...' : 'Save Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
