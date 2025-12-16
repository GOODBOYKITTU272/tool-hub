import { useState } from 'react';
import { mockRequests, getToolById } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const { currentUser } = useAuth();
  const isOwner = currentUser?.role === 'Owner';

  // Filter requests for Owner's tools
  const myRequests = mockRequests.filter(request => {
    const tool = getToolById(request.toolId);
    return tool?.ownerId === currentUser?.id;
  });

  const allRequests = mockRequests;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track tool requests
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={toolFilter} onValueChange={setToolFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by tool" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tools</SelectItem>
              {/* Add tool filter options here */}
            </SelectContent>
          </Select>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      {/* Tabs for Owner, regular view for others */}
      {isOwner ? (
        <Tabs defaultValue="my-requests" className="w-full">
          <TabsList>
            <TabsTrigger value="my-requests">My Requests ({myRequests.length})</TabsTrigger>
            <TabsTrigger value="all-requests">All Requests ({allRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="my-requests" className="mt-6">
            <KanbanBoard
              requests={myRequests}
              toolFilter={toolFilter === 'all' ? undefined : toolFilter}
            />
          </TabsContent>

          <TabsContent value="all-requests" className="mt-6">
            <KanbanBoard
              requests={allRequests}
              toolFilter={toolFilter === 'all' ? undefined : toolFilter}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <KanbanBoard toolFilter={toolFilter === 'all' ? undefined : toolFilter} />
      )}
    </div>
  );
}
