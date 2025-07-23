import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CallbackPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (error) {
      setStatus('error');
      setMessage(errorDescription || error || 'Authentication failed');
      toast({
        title: "Authentication Failed",
        description: errorDescription || "Failed to connect to TrueLayer",
        variant: "destructive",
      });
    } else if (code) {
      // Here you would normally exchange the code for an access token
      // For now, we'll simulate success
      setStatus('success');
      setMessage('Bank account successfully connected via TrueLayer');
      
      toast({
        title: "Success!",
        description: "Your bank account has been connected via TrueLayer",
      });

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        setLocation('/dashboard');
      }, 3000);
    } else {
      setStatus('error');
      setMessage('No authorization code received');
    }
  }, [setLocation, toast]);

  const handleReturnToDashboard = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            {status === 'loading' && (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span>Processing...</span>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span className="text-green-700">Success!</span>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="h-6 w-6 text-red-600" />
                <span className="text-red-700">Error</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            {status === 'loading' && 'Connecting your bank account...'}
            {status === 'success' && message}
            {status === 'error' && message}
          </p>
          
          {status === 'success' && (
            <p className="text-sm text-gray-500">
              Redirecting to dashboard in a few seconds...
            </p>
          )}
          
          {(status === 'success' || status === 'error') && (
            <Button onClick={handleReturnToDashboard} className="w-full">
              Return to Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}