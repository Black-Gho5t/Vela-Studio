import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-6 text-foreground select-none">
          <div className="flex max-w-md flex-col items-center text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-6" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              Algo salió mal en la interfaz
            </h1>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Ocurrió un error inesperado al renderizar la aplicación.
            </p>
            {this.state.error?.message && (
              <div className="mt-4 max-h-32 w-full overflow-auto rounded-md border border-destructive/20 bg-destructive/5 p-3 text-left font-mono text-[11px] text-destructive">
                {this.state.error.message}
              </div>
            )}
            <Button
              onClick={this.handleReload}
              variant="outline"
              size="sm"
              className="mt-6 gap-2 text-xs cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>Recargar interfaz</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
