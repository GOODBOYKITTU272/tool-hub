import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

const INITIAL_STATE: ErrorBoundaryState = { hasError: false, error: null };

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state = INITIAL_STATE;

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    reload = () => {
        window.location.reload();
    };

    goHome = () => {
        window.location.href = '/dashboard';
    };

    render(): ReactNode {
        const { hasError, error } = this.state;
        const { children, fallback } = this.props;

        if (!hasError) {
            return children;
        }

        if (fallback) {
            return fallback;
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-foreground">
                            Something went wrong
                        </h1>
                        <p className="text-muted-foreground">
                            We're sorry, but something unexpected happened.
                            Please try refreshing the page or go back to the dashboard.
                        </p>
                    </div>

                    {import.meta.env.DEV && error && (
                        <div className="bg-muted p-4 rounded-lg text-left">
                            <p className="text-sm font-mono text-destructive break-all">
                                {error.message}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 justify-center">
                        <Button variant="outline" onClick={this.goHome}>
                            <Home className="w-4 h-4 mr-2" />
                            Go to Dashboard
                        </Button>
                        <Button onClick={this.reload}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh Page
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}
