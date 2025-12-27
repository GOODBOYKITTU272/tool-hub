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

      console.log('📊 [Dashboard] Fetching dashboard data...');

      // Fetch tools count and recent tools
      const { data: tools, error: toolsError } = await supabase
        .from('tools')
        .select('*')
        .order('created_at', { ascending: false });

      if (toolsError) {
        console.error('❌ [Dashboard] Error fetching tools:', toolsError);
        if (toolsError.code === '42P01') {
          console.error('Error: "tools" table does not exist. Please run supabase-schema.sql');
        }
      } else {
        console.log('✅ [Dashboard] Fetched tools:', tools?.length || 0);
      }

      // Fetch requests count
      const { data: requests, error: requestsError } = await supabase
        .from('requests')
        .select('*');

      if (requestsError && requestsError.code !== '42P01') {
        console.error('❌ [Dashboard] Error fetching requests:', requestsError);
      } else {
        console.log('✅ [Dashboard] Fetched requests:', requests?.length || 0);
      }

      // Calculate stats based on TOOLS approval status and user role
      let pendingTools = 0;

      if (isAdmin) {
        // Admin sees ALL pending tools
        pendingTools = tools?.filter(t => t.approval_status === 'pending').length || 0;
      } else if (isOwner) {
        // Owner sees ONLY their own pending tools
        pendingTools = tools?.filter(t =>
          t.approval_status === 'pending' && t.created_by === currentUser?.id
        ).length || 0;
      }
      // Observers: pendingTools stays 0

      const approvedTools = tools?.filter(t => t.approval_status === 'approved').length || 0;

      console.log('📊 [Dashboard] Stats:', {
        totalTools: tools?.length || 0,
        pendingTools,
        approvedTools,
        totalRequests: requests?.length || 0,
        userRole: currentUser?.role,
      });

      // Filter tools by ownership and role before showing on dashboard
      const userTools = tools?.filter(tool => {
        const isMyTool = tool.owner_id === currentUser?.id || tool.created_by === currentUser?.id;

        if (isAdmin) return true; // Admin sees all tools
        if (isOwner) return isMyTool; // Owner sees only their own tools

        // Observer sees only approved tools
        return tool.approval_status === 'approved';
      }) || [];

      // Calculate Total Tools = ONLY APPROVED tools (not pending)
      const approvedUserTools = userTools.filter(tool => tool.approval_status === 'approved');
      const totalToolsCount = isAdmin
        ? approvedTools  // Admin sees all approved tools count
        : approvedUserTools.length;  // Owner/Observer sees their approved tools count

      setStats({
        totalTools: totalToolsCount,  // Only approved tools (NOT pending)
        totalRequests: requests?.length || 0,
        pending: pendingTools,      // Pending tools shown separately
        completed: approvedTools,   // Count approved TOOLS
      });


      // Show top 5 tools relevant to the user
      setMyTools(userTools.slice(0, 5));
    } catch (error) {
      console.error('❌ [Dashboard] Exception:', error);
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
          href="/tools"
        />
        <StatsCard
          title="Total Requests"
          value={stats.totalRequests}
          icon={MessageSquare}
          variant="default"
          href="/requests"
        />
        <StatsCard
          title="Pending Approval"
          value={stats.pending}
          icon={Clock}
          variant="yellow"
          href={isAdmin ? "/pending-tools" : "/tools"}
        />
        <StatsCard
          title="Approved"
          value={stats.completed}
          icon={CheckCircle}
          variant="green"
          href="/tools"
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
