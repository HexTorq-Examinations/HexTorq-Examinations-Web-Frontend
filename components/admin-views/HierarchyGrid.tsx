'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MoreVertical, Edit, Trash2, ChevronRight, FolderOpen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NameFormDialog } from './modals/NameFormDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';

interface HierarchyItem {
  id?: string;
  name: string;
  studentCount?: number;
  schoolCount?: number;
  departmentCount?: number;
  classCount?: number;
}

interface HierarchyGridProps {
  itemLabel: string;
  /** Singular label for the child entity these cards count (e.g. "school", "department", "class", "student"). */
  childLabel?: string;
  items: HierarchyItem[];
  isLoading: boolean;
  emptyDescription: string;
  onSelect: (id: string) => void;
  onAdd: (name: string) => Promise<void>;
  onEdit: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const getChildCount = (item: HierarchyItem): number | undefined =>
  item.schoolCount ?? item.departmentCount ?? item.classCount ?? item.studentCount;

export function HierarchyGrid({ itemLabel, childLabel = 'student', items, isLoading, emptyDescription, onSelect, onAdd, onEdit, onDelete }: HierarchyGridProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<HierarchyItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleAdd = () => {
    setItemToEdit(null);
    setFormOpen(true);
  };

  const handleEdit = (item: HierarchyItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToEdit(item);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await onDelete(itemToDelete);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const handleFormSubmit = async (name: string) => {
    if (itemToEdit?.id) {
      await onEdit(itemToEdit.id, name);
    } else {
      await onAdd(name);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add {itemLabel}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-slate-200 dark:border-slate-800 animate-pulse h-24" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => {
            const childCount = getChildCount(item);
            return (
            <Card
              key={item.id}
              onClick={() => item.id && onSelect(item.id)}
              className="border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md transition-all"
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                  {childCount !== undefined && (
                    <p className="text-xs text-slate-500">{childCount} {childLabel}{childCount === 1 ? '' : 's'}</p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 focus:outline-none shrink-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem className="cursor-pointer" onClick={(e) => handleEdit(item, e)}>
                      <Edit className="mr-2 h-4 w-4 text-blue-500" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950" onClick={(e) => handleDeleteClick(item.id!, e)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 shrink-0" />
              </CardContent>
            </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={`No ${itemLabel.toLowerCase()}s found`}
          description={emptyDescription}
          actionLabel={`Add ${itemLabel}`}
          onAction={handleAdd}
        />
      )}

      <NameFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setTimeout(() => setItemToEdit(null), 200);
        }}
        title={itemToEdit ? `Rename ${itemLabel}` : `Add ${itemLabel}`}
        description={itemToEdit ? `Update the name for this ${itemLabel.toLowerCase()}.` : `Create a new ${itemLabel.toLowerCase()}.`}
        label={itemLabel}
        initialValue={itemToEdit?.name}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete ${itemLabel}`}
        description={`Are you sure you want to delete this ${itemLabel.toLowerCase()}? This will also delete everything under it. This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
