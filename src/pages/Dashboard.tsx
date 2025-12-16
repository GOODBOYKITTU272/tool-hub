import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { getDashboardStats, mockRequests, mockTools, getToolById, getToolsByOwner } from '@/lib/mockData';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ToolCard } from '@/components/tools/ToolCard';
import { RequestCard } from '@/components/kanban/RequestCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { testSupabaseConnection } from '@/lib/testSupabase';
import {
  Wrench,
  MessageSquare,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';


const stats = getDashboardStats();
const recentRequests = [...mockRequests]
  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  .slice(0, 5);

const toolVariants: ('blue' | 'green' | 'white')[] = ['blue', 'green', 'white', 'white', 'blue'];

export default function Dashboard() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'Admin';
  const isOwner = currentUser?.role === 'Owner';
  const canAddTools = isAdmin || isOwner;

  // Filter tools and requests for Owner
  const myTools = isOwner ? getToolsByOwner(currentUser?.id || '') : mockTools.slice(0, 5);
  const myRequests = isOwner
    ? mockRequests.filter(request => {
      const tool = getToolById(request.toolId);
      return tool?.ownerId === currentUser?.id;
    })
    : recentRequests;

  // Test Supabase connection on mount
  useEffect(() => {
    testSupabaseConnection();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {currentUser?.name.split(' ')[0] || 'User'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your tools today.
          </p>
        </div>
        <div className="flex gap-3">
          {canAddTools && (
            <Button asChild>
              <Link to="/tools">
                <Plus className="w-4 h-4 mr-2" />
                Add Tool
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/requests">
              <MessageSquare className="w-4 h-4 mr-2" />
              New Request
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Tools"
          value={stats.totalTools}
          icon={Wrench}
          variant="blue"
        />
        <StatsCard
          title="Total Requests"
          value={stats.totalRequests}
          icon={MessageSquare}
          variant="default"
        />
        <StatsCard
          title="Pending"
          value={stats.pendingRequests}
          icon={Clock}
          variant="yellow"
        />
        <StatsCard
          title="Completed"
          value={stats.completedRequests}
          icon={CheckCircle}
          variant="green"
        />
      </div>

      {/* Quick Access Tools */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold">
            {isOwner ? 'My Tools' : 'Your Tools'}
          </h2>
          <Button variant="ghost" asChild>
            <Link to="/tools">
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myTools.slice(0, 3).map((tool, index) => (
            <ToolCard key={tool.id} tool={tool} variant={toolVariants[index]} />
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold">
            {isOwner ? 'Requests for My Tools' : 'Recent Activity'}
          </h2>
          <Button variant="ghost" asChild>
            <Link to="/requests">
              View all requests
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-3">
              {myRequests.slice(0, 5).map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  draggable={false}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
