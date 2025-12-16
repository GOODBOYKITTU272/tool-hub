import { useState } from 'react';
import { mockTools, currentUser } from '@/lib/mockData';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';

export default function Requests() {
  const [toolFilter, setToolFilter] = useState<string>('all');
  const isAdmin = currentUser.role === 'Admin';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">All Requests</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? 'Drag cards between columns to update status'
              : 'View and track request progress'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={toolFilter} onValueChange={setToolFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by tool" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tools</SelectItem>
              {mockTools.map((tool) => (
                <SelectItem key={tool.id} value={tool.id}>
                  {tool.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        editable={isAdmin}
        toolFilter={toolFilter === 'all' ? undefined : toolFilter}
      />
    </div>
  );
}
