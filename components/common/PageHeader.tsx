'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download } from 'lucide-react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string; onClick?: () => void }[];
  showSearch?: boolean;
  actions?: React.ReactNode;
  onSearch?: (searchTerm: string) => void;
}

export function PageHeader({ 
  title, 
  description, 
  breadcrumbs,
  showSearch = true,
  actions,
  onSearch
}: PageHeaderProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(searchTerm);
      }
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  return (
    <div className="flex flex-col gap-6 mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
      
      {/* Top Row: Breadcrumbs & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5">
          {/* Breadcrumbs */}
          {breadcrumbs && (
            <nav className="flex items-center text-sm font-medium text-slate-500 mb-3">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : crumb.onClick ? (
                    <button type="button" onClick={crumb.onClick} className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-slate-900 dark:text-slate-100">{crumb.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight className="h-4 w-4 mx-1 text-slate-400" />
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
          
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{title}</h1>
          {description && <p className="text-slate-500 dark:text-slate-400 text-base">{description}</p>}
        </div>
        
        {actions && (
          <div className="flex items-center gap-3 self-start mt-2 sm:mt-0">
            {actions}
          </div>
        )}
      </div>

      {/* Bottom Row: Search, Filters & Export */}
      {showSearch && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9 h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="outline" className="h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm flex-1 sm:flex-none">
              <Filter className="mr-2 h-4 w-4 text-slate-500" />
              Filters
            </Button>
            <Button variant="outline" className="h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm flex-1 sm:flex-none">
              <Download className="mr-2 h-4 w-4 text-slate-500" />
              Export
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
