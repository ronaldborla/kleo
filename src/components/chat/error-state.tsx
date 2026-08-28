import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Alert variant="destructive" className="max-w-lg">
        <AlertCircle />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{message}</p>
          {onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    </div>
  );
}
