import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'blue' | 'green' | 'yellow' | 'pink';
  href?: string;
}

const variantClasses = {
  default: 'bg-card border-2 border-border',
  blue: 'bg-secondary text-secondary-foreground',
  green: 'bg-accent text-accent-foreground',
  yellow: 'bg-yellow-400 text-yellow-900',
  pink: 'bg-primary text-primary-foreground',
};

const iconVariantClasses = {
  default: 'bg-muted text-muted-foreground',
  blue: 'bg-white/20 text-current',
  green: 'bg-white/20 text-current',
  yellow: 'bg-white/20 text-current',
  pink: 'bg-white/20 text-current',
};

export function StatsCard({ title, value, icon: Icon, variant = 'default', href }: StatsCardProps) {
  const content = (
    <Card className={cn(
      'transition-all duration-200',
      href ? 'hover:scale-[1.02] hover:shadow-md cursor-pointer' : 'hover:scale-[1.02]',
      variantClasses[variant]
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={cn('text-sm font-medium mb-1', variant === 'default' ? 'text-muted-foreground' : 'opacity-80')}>
              {title}
            </p>
            <p className="text-3xl font-display font-bold">{value}</p>
          </div>
          <div className={cn('p-3 rounded-xl', iconVariantClasses[variant])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}
