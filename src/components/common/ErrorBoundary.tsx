import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ? (
        <>{this.props.fallback}</>
      ) : (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
            <p className="text-sm text-red-700">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div>
              <Button
                variant="outline"
                onClick={this.handleReset}
                className="text-sm bg-white hover:bg-gray-50"
              >
                Try again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
