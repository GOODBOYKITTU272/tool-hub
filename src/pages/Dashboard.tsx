import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ToolCard } from '@/components/tools/ToolCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import {
  Wrench,
  MessageSquare,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import { Database } from '@/lib/supabase';

interface DashboardStats {
  totalTools: number;
  totalRequests: number;
  pending: number;
  completed: number;
}

type Tool = Database['public']['Tables']['tools']['Row'];

const toolVariants: ('blue' | 'green' | 'white')[] = ['blue', 'green', 'white', 'white', 'blue'];

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ totalTools: 0, totalRequests: 0, pending: 0, completed: 0 });
  const [myTools, setMyTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.role === 'Admin';
  const isOwner = currentUser?.role === 'Owner';
  const canAddTools = isAdmin || isOwner;

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch tools count and recent tools
      const { data: tools, error: toolsError } = await supabase
        .from('tools')
        .select('*')
        .order('created_at', { ascending: false });

      if (toolsError) {
        if (toolsError.code === '42P01') {
          console.error('Error: "tools" table does not exist. Please run supabase-schema.sql');
        } else {
          throw toolsError;
        }
      }

      // Fetch requests count
      const { data: requests, error: requestsError } = await supabase
        .from('requests')
        .select('*');

      if (requestsError && requestsError.code !== '42P01') {
        throw requestsError;
      }

      // Calculate stats based on real database records
      const pending = requests?.filter(r => r.status === 'pending' || r.status === 'Requested').length || 0;
      const completed = requests?.filter(r => r.status === 'completed' || r.status === 'Completed').length || 0;

      setStats({
        totalTools: tools?.length || 0,
        totalRequests: requests?.length || 0,
        pending,
        completed,
      });

      // Show top 3 tools on dashboard
      setMyTools(tools?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
          value={stats.pending}
          icon={Clock}
          variant="yellow"
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
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
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : myTools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTools.slice(0, 3).map((tool, index) => (
              <ToolCard key={tool.id} tool={tool} variant={toolVariants[index]} />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No tools yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Get started by adding your first tool.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
