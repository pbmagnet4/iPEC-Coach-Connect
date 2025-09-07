import React, { useEffect, useRef, useState } from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { cn } from '../../lib/utils';

// Screen reader optimized heading component
interface AccessibleHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  id?: string;
  announce?: boolean;
}

export function AccessibleHeading({ 
  level, 
  children, 
  className,
  id,
  announce = false
}: AccessibleHeadingProps) {
  const { liveRegions } = useAccessibility();
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;

  useEffect(() => {
    if (announce && typeof children === 'string') {
  void liveRegions.announcePolite(`Heading level ${level}: ${children}`);
    }
  }, [announce, children, level, liveRegions]);

  return (
    <HeadingTag
      id={id}
      className={cn(
        "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
        className
      )}
      tabIndex={-1} // Allow programmatic focus
    >
      {children}
    </HeadingTag>
  );
}

// Screen reader optimized list component
interface AccessibleListProps {
  items: React.ReactNode[];
  ordered?: boolean;
  className?: string;
  announce?: boolean;
  itemClassName?: string;
}

export function AccessibleList({ 
  items, 
  ordered = false,
  className,
  announce = false,
  itemClassName 
}: AccessibleListProps) {
  const { liveRegions } = useAccessibility();
  const ListTag = ordered ? 'ol' : 'ul';

  useEffect(() => {
    if (announce) {
  void liveRegions.announcePolite(`List with ${items.length} items`);
    }
  }, [announce, items.length, liveRegions]);

  return (
    <ListTag 
      className={className}
      role="list"
      aria-label={`${ordered ? 'Ordered' : 'Unordered'} list with ${items.length} items`}
    >
      {items.map((item, index) => (
        <li 
          key={index}
          className={itemClassName}
          role="listitem"
          aria-setsize={items.length}
          aria-posinset={index + 1}
        >
          {item}
        </li>
      ))}
    </ListTag>
  );
}

// Screen reader optimized table component
interface AccessibleTableProps {
  headers: string[];
  rows: string[][];
  caption?: string;
  className?: string;
  sortable?: boolean;
  onSort?: (columnIndex: number, direction: 'asc' | 'desc') => void;
}

export function AccessibleTable({ 
  headers, 
  rows, 
  caption,
  className,
  sortable = false,
  onSort
}: AccessibleTableProps) {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { liveRegions } = useAccessibility();

  const handleSort = (columnIndex: number) => {
    if (!sortable || !onSort) return;

    const newDirection = sortColumn === columnIndex && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(columnIndex);
    setSortDirection(newDirection);
    onSort(columnIndex, newDirection);
    
    liveRegions.announcePolite(
      `Table sorted by ${headers[columnIndex]} in ${newDirection}ending order`
    );
  };

  return (
    <table 
      className={cn("w-full", className)}
      role="table"
      aria-label={caption || `Table with ${headers.length} columns and ${rows.length} rows`}
    >
      {caption && (
        <caption className="sr-only">
          {caption}
        </caption>
      )}
      
      <thead>
        <tr role="row">
          {headers.map((header, index) => (
            <th
              key={index}
              className={cn(
                "px-4 py-2 text-left font-medium text-gray-900 border-b",
                sortable && "cursor-pointer hover:bg-gray-50 focus:bg-gray-50",
                "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-inset"
              )}
              role="columnheader"
              scope="col"
              tabIndex={sortable ? 0 : -1}
              onClick={() => handleSort(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
  void e.preventDefault();
                  handleSort(index);
                }
              }}
              aria-sort={
                sortColumn === index 
                  ? sortDirection === 'asc' ? 'ascending' : 'descending'
                  : sortable ? 'none' : undefined
              }
            >
              <div className="flex items-center justify-between">
                <span>{header}</span>
                {sortable && (
                  <span className="ml-2 text-gray-400" aria-hidden="true">
                    {sortColumn === index ? (
                      sortDirection === 'asc' ? '↑' : '↓'
                    ) : (
                      '↕'
                    )}
                  </span>
                )}
              </div>
            </th>
          ))}
        </tr>
      </thead>
      
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr 
            key={rowIndex}
            role="row"
            className="border-b hover:bg-gray-50"
          >
            {row.map((cell, cellIndex) => (
              <td
                key={cellIndex}
                className="px-4 py-2 text-gray-900"
                role="cell"
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Screen reader optimized form section
interface AccessibleFormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}

export function AccessibleFormSection({ 
  title, 
  description, 
  children, 
  className,
  required = false
}: AccessibleFormSectionProps) {
  const sectionId = React.useId();
  const descriptionId = `${sectionId}-description`;

  return (
    <fieldset 
      className={cn("border border-gray-200 rounded-lg p-4", className)}
      aria-labelledby={`${sectionId}-title`}
      aria-describedby={description ? descriptionId : undefined}
    >
      <legend className="sr-only">
        {title}{required && ' (required)'}
      </legend>
      
      <div className="space-y-4">
        <div>
          <h3 
            id={`${sectionId}-title`}
            className="text-lg font-medium text-gray-900"
          >
            {title}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">*</span>
            )}
          </h3>
          {description && (
            <p 
              id={descriptionId}
              className="mt-1 text-sm text-gray-600"
            >
              {description}
            </p>
          )}
        </div>
        
        {children}
      </div>
    </fieldset>
  );
}

// Screen reader optimized progress indicator
interface AccessibleProgressProps {
  value: number;
  max: number;
  label: string;
  className?: string;
  showPercentage?: boolean;
  announce?: boolean;
}

export function AccessibleProgress({ 
  value, 
  max, 
  label,
  className,
  showPercentage = true,
  announce = false
}: AccessibleProgressProps) {
  const percentage = Math.round((value / max) * 100);
  const { liveRegions } = useAccessibility();
  const previousPercentage = useRef(0);

  useEffect(() => {
    if (announce && percentage !== previousPercentage.current) {
  void liveRegions.announcePolite(`${label}: ${percentage}% complete`);
      previousPercentage.current = percentage;
    }
  }, [announce, percentage, label, liveRegions]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">
          {label}
        </span>
        {showPercentage && (
          <span className="text-sm text-gray-500">
            {percentage}%
          </span>
        )}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-brand-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`${label}: ${percentage}% complete`}
        />
      </div>
    </div>
  );
}

// Screen reader optimized status indicator
interface AccessibleStatusProps {
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  className?: string;
  announce?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function AccessibleStatus({ 
  status, 
  message, 
  className,
  announce = true,
  dismissible = false,
  onDismiss
}: AccessibleStatusProps) {
  const { liveRegions } = useAccessibility();

  const statusConfig = {
    success: {
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      icon: '✓',
      ariaLabel: 'Success',
    },
    warning: {
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200',
      icon: '⚠',
      ariaLabel: 'Warning',
    },
    error: {
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      icon: '✕',
      ariaLabel: 'Error',
    },
    info: {
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200',
      icon: 'ℹ',
      ariaLabel: 'Information',
    },
  };

  const config = statusConfig[status];

  useEffect(() => {
    if (announce) {
      const priority = status === 'error' ? 'assertive' : 'polite';
      liveRegions[priority === 'assertive' ? 'announceAssertive' : 'announcePolite'](
        `${config.ariaLabel}: ${message}`
      );
    }
  }, [announce, status, message, config.ariaLabel, liveRegions]);

  return (
    <div
      className={cn(
        "rounded-md p-4 border",
        config.bgColor,
        config.textColor,
        config.borderColor,
        className
      )}
      role="alert"
      aria-live={status === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-lg" aria-hidden="true">
            {config.icon}
          </span>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">
            <span className="sr-only">{config.ariaLabel}: </span>
            {message}
          </p>
        </div>
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className={cn(
                "inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2",
                config.textColor,
                "hover:bg-opacity-20 focus:ring-offset-transparent"
              )}
              aria-label="Dismiss"
            >
              <span className="sr-only">Dismiss</span>
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Screen reader optimized breadcrumb navigation
interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface AccessibleBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: string;
}

export function AccessibleBreadcrumb({ 
  items, 
  className,
  separator = '/'
}: AccessibleBreadcrumbProps) {
  return (
    <nav 
      className={className}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2 text-sm text-gray-600">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400" aria-hidden="true">
                {separator}
              </span>
            )}
            
            {item.href && !item.current ? (
              <a
                href={item.href}
                className="hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 rounded"
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </a>
            ) : (
              <span
                className={cn(
                  item.current && "font-medium text-gray-900"
                )}
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Screen reader optimized tab navigation
interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface AccessibleTabsProps {
  items: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function AccessibleTabs({ 
  items, 
  defaultTab, 
  onChange,
  className 
}: AccessibleTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id);
  const { liveRegions } = useAccessibility();

  const handleTabChange = (tabId: string) => {
    const tab = items.find(item => item.id === tabId);
    if (tab && !tab.disabled) {
      setActiveTab(tabId);
      onChange?.(tabId);
  void liveRegions.announcePolite(`Selected tab: ${tab.label}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    const currentIndex = items.findIndex(item => item.id === tabId);
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowLeft':
        nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

  void e.preventDefault();
    const nextTab = items[nextIndex];
    if (nextTab && !nextTab.disabled) {
      handleTabChange(nextTab.id);
      // Focus the next tab
      setTimeout(() => {
        const nextElement = document.getElementById(`tab-${nextTab.id}`);
        nextElement?.focus();
      }, 0);
    }
  };

  const activeTabContent = items.find(item => item.id === activeTab)?.content;

  return (
    <div className={className}>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" role="tablist">
          {items.map((item) => (
            <button
              key={item.id}
              id={`tab-${item.id}`}
              className={cn(
                "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
                activeTab === item.id
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => handleTabChange(item.id)}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              role="tab"
              aria-selected={activeTab === item.id}
              aria-controls={`panel-${item.id}`}
              tabIndex={activeTab === item.id ? 0 : -1}
              disabled={item.disabled}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-4">
        {items.map((item) => (
          <div
            key={item.id}
            id={`panel-${item.id}`}
            className={cn(
              activeTab === item.id ? "block" : "hidden"
            )}
            role="tabpanel"
            aria-labelledby={`tab-${item.id}`}
            tabIndex={0}
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}