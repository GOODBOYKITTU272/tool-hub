import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FilterState {
    status: string;
    dateRange: string;
    search: string;
}

interface RequestFiltersProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    onClearFilters: () => void;
}

export function RequestFilters({ filters, onFiltersChange, onClearFilters }: RequestFiltersProps) {
    const hasActiveFilters = filters.status !== 'all' || filters.dateRange !== 'all' || filters.search !== '';

    return (
        <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Filters</h3>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="ml-auto h-7 text-xs"
                    >
                        <X className="w-3 h-3 mr-1" />
                        Clear All
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                    <Label htmlFor="status-filter" className="text-xs">Status</Label>
                    <Select
                        value={filters.status}
                        onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
                    >
                        <SelectTrigger id="status-filter" className="h-9">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Requested">Requested</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                    <Label htmlFor="date-filter" className="text-xs">Date Range</Label>
                    <Select
                        value={filters.dateRange}
                        onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value })}
                    >
                        <SelectTrigger id="date-filter" className="h-9">
                            <SelectValue placeholder="All Time" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="3months">Last 3 Months</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Search Filter */}
                <div className="space-y-2">
                    <Label htmlFor="search-filter" className="text-xs">Search</Label>
                    <Input
                        id="search-filter"
                        type="text"
                        placeholder="Search requests..."
                        value={filters.search}
                        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                        className="h-9"
                    />
                </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">Active filters:</p>
                    {filters.status !== 'all' && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                            Status: {filters.status}
                        </span>
                    )}
                    {filters.dateRange !== 'all' && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                            Date: {filters.dateRange}
                        </span>
                    )}
                    {filters.search && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                            Search: "{filters.search}"
                        </span>
                    )}
                </div>
            )}
        </Card>
    );
}
