import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchAccounts, fetchAccountsWithTransactions } from "@/services/truelayer";

export default function CallbackPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [accountsData, setAccountsData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      // Parse URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
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
        return;
      }

      if (!token) {
        setStatus('error');
        setMessage('No access token received');
        toast({
          title: "Error",
          description: "No access token received from TrueLayer",
          variant: "destructive",
        });
        return;
      }

      try {
        setMessage('Fetching account data from TrueLayer...');
        
        // Test the TrueLayer API functions
        console.log('Testing TrueLayer API with token:', token);
        
        // Fetch accounts first
        const accounts = await fetchAccounts(token);
        console.log('Received accounts:', accounts);
        
        // If we have accounts, fetch all data including transactions
        if (accounts.results && accounts.results.length > 0) {
          const completeData = await fetchAccountsWithTransactions(token);
          setAccountsData(completeData);
          
          setStatus('success');
          setMessage(`Successfully connected ${accounts.results.length} account(s) via TrueLayer`);
          
          toast({
            title: "Success!",
            description: `Connected ${accounts.results.length} account(s) from TrueLayer`,
          });
        } else {
          setStatus('success');
          setMessage('TrueLayer connection successful, but no accounts found');
          
          toast({
            title: "Connected",
            description: "TrueLayer connected successfully",
          });
        }

        // Redirect to dashboard after 5 seconds to give time to see the data
        setTimeout(() => {
          setLocation('/dashboard');
        }, 5000);

      } catch (error) {
        console.error('Error fetching TrueLayer data:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to fetch account data');
        
        toast({
          title: "API Error",
          description: "Failed to fetch account data from TrueLayer",
          variant: "destructive",
        });
      }
    };

    handleCallback();
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

          {accountsData && status === 'success' && (
            <div className="text-left bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium text-gray-700 mb-2">Connected Accounts:</p>
              {accountsData.map((account: any, index: number) => (
                <div key={account.account_id} className="text-xs text-gray-600 mb-1">
                  {index + 1}. {account.display_name} ({account.account_type})
                  {account.transactions && (
                    <span className="text-green-600"> - {account.transactions.length} transactions</span>
                  )}
                </div>
              ))}
            </div>
          )}
          
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