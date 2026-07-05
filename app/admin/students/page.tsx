'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { HierarchyGrid } from '@/components/admin-views/HierarchyGrid';
import { StudentsView } from '@/components/admin-views/StudentsView';
import { EmptyState } from '@/components/common/EmptyState';
import { useAcademicStore } from '@/store/academicStore';

type Level = 'schools' | 'departments' | 'classes' | 'students';

export default function AdminStudents() {
  const {
    selectedBatchId, batches,
    schools, departments, classes,
    fetchSchools, fetchDepartments, fetchClasses,
    addSchool, updateSchool, deleteSchool,
    addDepartment, updateDepartment, deleteDepartment,
    addClass, updateClass, deleteClass,
    isLoading,
  } = useAcademicStore();

  const [level, setLevel] = useState<Level>('schools');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const selectedSchool = schools.find((s) => s.id === selectedSchoolId);
  const selectedDepartment = departments.find((d) => d.id === selectedDepartmentId);
  const selectedClass = classes.find((c) => c.id === selectedClassId);

  // Reset the drill-down whenever the navbar batch selector changes.
  useEffect(() => {
    setLevel('schools');
    setSelectedSchoolId(null);
    setSelectedDepartmentId(null);
    setSelectedClassId(null);
    if (selectedBatchId) fetchSchools(selectedBatchId);
  }, [selectedBatchId, fetchSchools]);

  // Jumps to any level in the trail, clearing everything deeper than it —
  // used by both the breadcrumb links and the innermost "Back" button, so
  // the whole drill-down can always be reset back to any ancestor level.
  const goToLevel = (target: Level) => {
    if (target === 'schools') {
      setSelectedSchoolId(null);
      setSelectedDepartmentId(null);
      setSelectedClassId(null);
    } else if (target === 'departments') {
      setSelectedDepartmentId(null);
      setSelectedClassId(null);
    } else if (target === 'classes') {
      setSelectedClassId(null);
    }
    setLevel(target);
  };

  const goToSchool = (id: string) => {
    setSelectedSchoolId(id);
    setLevel('departments');
    fetchDepartments(id);
  };

  const goToDepartment = (id: string) => {
    setSelectedDepartmentId(id);
    setLevel('classes');
    fetchClasses(id);
  };

  const goToClass = (id: string) => {
    setSelectedClassId(id);
    setLevel('students');
  };

  const breadcrumbs = [
    { label: 'Admin', href: '/admin/dashboard' },
    { label: 'Students', onClick: () => goToLevel('schools') },
    ...(selectedBatch ? [{ label: selectedBatch.name }] : []),
    ...(level !== 'schools' && selectedSchool
      ? [{ label: selectedSchool.name, ...(level !== 'departments' ? { onClick: () => goToLevel('departments') } : {}) }]
      : []),
    ...(['classes', 'students'].includes(level) && selectedDepartment
      ? [{ label: selectedDepartment.name, ...(level !== 'classes' ? { onClick: () => goToLevel('classes') } : {}) }]
      : []),
    ...(level === 'students' && selectedClass ? [{ label: selectedClass.name }] : []),
  ];

  if (!selectedBatchId) {
    return (
      <div className="space-y-6 pb-10">
        <PageHeader title="Student Management" description="Manage the academic structure and student records." breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Students' }]} showSearch={false} />
        <EmptyState
          title="No batch selected"
          description="Create a batch first, then select it from the dropdown in the navbar to manage its schools, departments, classes, and students."
        />
      </div>
    );
  }

  if (level === 'students' && selectedClassId) {
    return (
      <StudentsView
        role="admin"
        classId={selectedClassId}
        className={selectedClass?.name}
        breadcrumbs={breadcrumbs}
        onBack={() => goToLevel('classes')}
      />
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={
          level === 'schools' ? `Schools — ${selectedBatch?.name ?? ''}`
          : level === 'departments' ? `Departments — ${selectedSchool?.name ?? ''}`
          : `Classes — ${selectedDepartment?.name ?? ''}`
        }
        description="Drill in to manage schools, departments, classes, and students for the selected batch."
        breadcrumbs={breadcrumbs}
        showSearch={false}
        actions={
          level !== 'schools' ? (
            <button
              onClick={() => {
                if (level === 'departments') goToLevel('schools');
                else if (level === 'classes') goToLevel('departments');
              }}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              ← Back
            </button>
          ) : undefined
        }
      />

      {level === 'schools' && (
        <HierarchyGrid
          itemLabel="School"
          items={schools}
          isLoading={isLoading}
          emptyDescription="Create a school under this batch to get started."
          onSelect={goToSchool}
          onAdd={(name) => addSchool(name, selectedBatchId)}
          onEdit={updateSchool}
          onDelete={deleteSchool}
        />
      )}

      {level === 'departments' && selectedSchoolId && (
        <HierarchyGrid
          itemLabel="Department"
          items={departments}
          isLoading={isLoading}
          emptyDescription="Create a department under this school to get started."
          onSelect={goToDepartment}
          onAdd={(name) => addDepartment(name, selectedSchoolId)}
          onEdit={updateDepartment}
          onDelete={deleteDepartment}
        />
      )}

      {level === 'classes' && selectedDepartmentId && (
        <HierarchyGrid
          itemLabel="Class"
          items={classes}
          isLoading={isLoading}
          emptyDescription="Create a class under this department to add students."
          onSelect={goToClass}
          onAdd={(name) => addClass(name, selectedDepartmentId)}
          onEdit={updateClass}
          onDelete={deleteClass}
        />
      )}
    </div>
  );
}
