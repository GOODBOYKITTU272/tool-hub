import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckSquare, Trash2, Play, X } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface BulkActionBarProps {
    selectedCount: number;
    onMarkInProgress: () => void;
    onMarkCompleted: () => void;
    onDelete: () => void;
    onClearSelection: () => void;
}

export function BulkActionBar({
    selectedCount,
    onMarkInProgress,
    onMarkCompleted,
    onDelete,
    onClearSelection,
}: BulkActionBarProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    if (selectedCount === 0) return null;

    const handleDelete = () => {
        onDelete();
        setShowDeleteDialog(false);
    };

    return (
        <>
            <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckSquare className="w-5 h-5 text-primary" />
                        <div>
                            <p className="font-semibold">
                                {selectedCount} request{selectedCount !== 1 ? 's' : ''} selected
                            </p>
                            <p className="text-xs text-muted-foreground">Bulk actions available</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onMarkInProgress}
                            className="h-8"
                        >
                            <Play className="w-3 h-3 mr-1" />
                            Mark In Progress
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onMarkCompleted}
                            className="h-8"
                        >
                            <CheckSquare className="w-3 h-3 mr-1" />
                            Mark Completed
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setShowDeleteDialog(true)}
                            className="h-8"
                        >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onClearSelection}
                            className="h-8"
                        >
                            <X className="w-3 h-3 mr-1" />
                            Clear
                        </Button>
                    </div>
                </div>
            </Card>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedCount} requests?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the selected
                            requests from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
