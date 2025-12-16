import { useState } from 'react';
import { mockTools } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { ToolCard } from '@/components/tools/ToolCard';
import { AddToolDialog } from '@/components/tools/AddToolDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search } from 'lucide-react';
import type { Tool } from '@/lib/mockData';

const toolVariants: ('blue' | 'green' | 'white')[] = ['blue', 'green', 'white', 'white', 'blue', 'green'];

export default function Tools() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tools, setTools] = useState<Tool[]>(mockTools);
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'Admin';
  const isOwner = currentUser?.role === 'Owner';
  const canAddTools = isAdmin || isOwner;

  // Filter tools by ownership for Owner role
  const myTools = tools.filter(tool => tool.ownerId === currentUser?.id);
  const allTools = tools;

  const filterTools = (toolList: Tool[]) => {
    return toolList.filter(
      (tool) =>
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.owner.toLowerCase().includes(search.toLowerCase()) ||
        tool.description.toLowerCase().includes(search.toLowerCase())
    );
  };

  const handleToolAdded = (newTool: Tool) => {
    setTools([newTool, ...tools]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tools</h1>
          <p className="text-muted-foreground mt-1">
            Manage and explore your internal tools
          </p>
        </div>
        {canAddTools && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tool
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs for Owner, regular view for others */}
      {isOwner ? (
        <Tabs defaultValue="my-tools" className="w-full">
          <TabsList>
            <TabsTrigger value="my-tools">My Tools ({filterTools(myTools).length})</TabsTrigger>
            <TabsTrigger value="all-tools">All Tools ({filterTools(allTools).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="my-tools" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterTools(myTools).map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} variant={toolVariants[index % toolVariants.length]} />
              ))}
            </div>
            {filterTools(myTools).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No tools found
              </div>
            )}
          </TabsContent>

          <TabsContent value="all-tools" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterTools(allTools).map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} variant={toolVariants[index % toolVariants.length]} />
              ))}
            </div>
            {filterTools(allTools).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No tools found
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Showing {filterTools(allTools).length} of {allTools.length} tools
          </p>
          {filterTools(allTools).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterTools(allTools).map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} variant={toolVariants[index % toolVariants.length]} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tools found matching your search.</p>
            </div>
          )}
        </>
      )}

      {/* Add Tool Dialog */}
      <AddToolDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onToolAdded={handleToolAdded}
      />
    </div>
  );
}
