"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectFileItem } from '@/components/projects/project-file-item';
import { ProjectFile, TaskFile } from '@/types/database';

interface FileSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  files: (ProjectFile | TaskFile)[];
  onDownload: (file: ProjectFile | TaskFile) => void;
  variant: 'project' | 'task';
  emptyMessage: string;
}

export function FileSection({ 
  title, 
  description, 
  icon, 
  files, 
  onDownload, 
  variant, 
  emptyMessage 
}: FileSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title} ({files.length})
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <ProjectFileItem
                key={file.id}
                file={file}
                onDownload={onDownload}
                variant={variant}
                showTaskInfo={variant === 'task'}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}