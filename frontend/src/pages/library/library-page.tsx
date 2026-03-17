import { useState } from 'react';
import { BookOpen, Video, Loader2, Library } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLibraryResources, useDeleteResource } from '@/queries/use-library';
import { ResourceCard } from './components/resource-card';
import { ResourceForm } from './components/resource-form';

import type { LibraryResource, ResourceType } from '@/types/library.types';

type FilterTab = 'all' | 'books' | 'videos' | 'in_progress';

function getEmptyMessage(tab: FilterTab): string {
  if (tab === 'books') return 'No books added yet. Add your first book to get started.';
  if (tab === 'videos') return 'No videos added yet. Add a video course to track your progress.';
  if (tab === 'in_progress') return 'No resources are currently in progress.';
  return 'Your library is empty. Add a book or video to start tracking your reading and watching.';
}

export function LibraryPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [formDefaultType, setFormDefaultType] = useState<ResourceType>('BOOK');
  const [editResource, setEditResource] = useState<LibraryResource | null>(null);

  // Build query params from active tab
  const queryParams =
    activeTab === 'books'
      ? { type: 'BOOK' }
      : activeTab === 'videos'
        ? { type: 'VIDEO' }
        : activeTab === 'in_progress'
          ? { status: 'IN_PROGRESS' }
          : undefined;

  const { data: resources, isLoading, isError } = useLibraryResources(queryParams);
  const deleteResource = useDeleteResource();

  function openCreate(type: ResourceType) {
    setFormDefaultType(type);
    setEditResource(null);
    setFormOpen(true);
  }

  function handleEdit(resource: LibraryResource) {
    setEditResource(resource);
    setFormOpen(true);
  }

  function handleDelete(id: string) {
    if (window.confirm('Delete this resource? This cannot be undone.')) {
      deleteResource.mutate(id);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
          <p className="text-muted-foreground">
            Track your books and video courses.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openCreate('BOOK')}>
            <BookOpen className="h-4 w-4" />
            Add Book
          </Button>
          <Button onClick={() => openCreate('VIDEO')}>
            <Video className="h-4 w-4" />
            Add Video
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load library resources. Please try again.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && (resources?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <Library className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="font-medium">Nothing here yet</p>
            <p className="text-sm text-muted-foreground">{getEmptyMessage(activeTab)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openCreate('BOOK')}>
              <BookOpen className="h-4 w-4" />
              Add Book
            </Button>
            <Button onClick={() => openCreate('VIDEO')}>
              <Video className="h-4 w-4" />
              Add Video
            </Button>
          </div>
        </div>
      )}

      {/* Resource grid */}
      {!isLoading && !isError && (resources?.length ?? 0) > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources!.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onEdit={() => handleEdit(resource)}
              onDelete={() => handleDelete(resource.id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit form */}
      <ResourceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        resource={editResource ?? undefined}
        defaultType={formDefaultType}
      />
    </div>
  );
}
