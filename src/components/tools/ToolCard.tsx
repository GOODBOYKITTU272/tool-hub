// Tool type from Supabase
interface Tool {
  id: string;
  name: string;
  description: string;
  category: string | null;
  type: string | null;
  tags: string[] | null;
  url: string | null;
  owner_id: string | null;
  owner_team: string | null;
  created_by: string;
  approved_by: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ToolCardProps {
  tool: Tool;
  variant?: 'blue' | 'green' | 'white';
}

const variantClasses = {
  blue: 'feature-card feature-card-blue',
  green: 'feature-card feature-card-green',
  white: 'feature-card feature-card-white',
};

export function ToolCard({ tool, variant = 'white' }: ToolCardProps) {
  const isLight = variant === 'white';

  return (
    <Card className={variantClasses[variant]}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <h3 className="font-display font-bold text-lg">{tool.name}</h3>
          {tool.approval_status === 'pending' && (
            <Badge
              variant={isLight ? 'secondary' : 'outline'}
              className={!isLight ? 'border-current' : ''}
            >
              Pending
            </Badge>
          )}
        </div>
        <p className={`text-sm ${isLight ? 'text-muted-foreground' : 'opacity-80'}`}>
          {tool.owner_team || 'No team assigned'}
        </p>
      </CardHeader>
      <CardContent className="pb-4">
        <p className={`text-sm line-clamp-2 ${isLight ? '' : 'opacity-90'}`}>
          {tool.description}
        </p>
      </CardContent>
      <CardFooter className="pt-0 flex gap-2">
        <Button
          asChild
          variant={isLight ? 'default' : 'secondary'}
          size="sm"
          className={!isLight ? 'bg-card/20 hover:bg-card/30 text-current border-0' : ''}
        >
          <Link to={`/tools/${tool.id}`}>
            View Details
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
        {tool.url && (
          <Button
            variant="ghost"
            size="sm"
            className={!isLight ? 'hover:bg-card/20' : ''}
            asChild
          >
            <a href={tool.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
