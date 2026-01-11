import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary - Catches JavaScript errors in child components
 * Shows user-friendly error message instead of crashing the app
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error for monitoring (keep this for production debugging)
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // TODO: Send to error tracking service (Sentry, etc.)
        // if (typeof window !== 'undefined' && window.Sentry) {
        //   window.Sentry.captureException(error);
        // }
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
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

                        {/* Show error details only in development */}
                        {import.meta.env.DEV && this.state.error && (
                            <div className="bg-muted p-4 rounded-lg text-left">
                                <p className="text-sm font-mono text-destructive break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 justify-center">
                            <Button variant="outline" onClick={this.handleGoHome}>
                                <Home className="w-4 h-4 mr-2" />
                                Go to Dashboard
                            </Button>
                            <Button onClick={this.handleReload}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
