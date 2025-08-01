import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { addAccountToUser } from "@/lib/firestore";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ConnectAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountAdded: () => void;
}

const UK_BANKS = [
  "Barclays",
  "HSBC",
  "Lloyds Bank",
  "Santander",
  "NatWest",
  "Halifax",
  "Monzo",
  "Starling Bank",
  "Nationwide",
  "First Direct",
  "TSB",
  "Metro Bank"
];

const ACCOUNT_TYPES = [
  "Current Account",
  "Savings Account",
  "ISA",
  "Premium Account",
  "Student Account",
  "Business Account"
];

export default function ConnectAccountModal({ open, onOpenChange, onAccountAdded }: ConnectAccountModalProps) {
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState("");
  const [balance, setBalance] = useState("6750");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Debug logging
  console.log("ConnectAccountModal rendered:", { open, user: !!user });

  if (!open) {
    return null;
  }

  const generateLast4 = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleSubmit = async () => {
    console.log("Submit button clicked", { bankName, accountType, balance, user: !!user });
    
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to connect your bank account securely",
        variant: "destructive",
      });
      return;
    }

    if (!bankName || !accountType || !balance) {
      toast({
        title: "Missing Information",
        description: "Please select your bank, account type, and enter your balance",
        variant: "destructive",
      });
      return;
    }

    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      toast({
        title: "Invalid Balance",
        description: "Please enter a valid balance amount (£0 or higher)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log("Starting account creation...");
    
    try {
      const newAccount = {
        bankName,
        type: accountType,
        balance: balanceNum,
        last4: generateLast4(),
        connectedAt: new Date().toISOString()
      };

      console.log("Adding account to user:", newAccount);
      
      // Close modal immediately for instant feedback
      onOpenChange(false);
      
      // Reset form
      setBankName("");
      setAccountType("");
      setBalance("6750");
      
      // Show success message immediately
      toast({
        title: "Account Connected",
        description: `Your ${bankName} ${accountType} has been securely linked to your profile`,
      });
      
      // Trigger optimistic update immediately
      onAccountAdded();
      
      // Add account in background (async)
      addAccountToUser(user.uid, newAccount).then(() => {
        console.log("Account added successfully to storage");
        // Trigger another refresh to ensure data consistency
        onAccountAdded();
      }).catch((error) => {
        console.error('Error adding account:', error);
        toast({
          title: "Warning",
          description: "Account shown but may not be fully synced",
          variant: "destructive",
        });
      });
    } catch (error) {
      console.error("Error connecting account:", error);
      toast({
        title: "Error",
        description: "Failed to connect account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  console.log("Rendering modal with state:", { open, bankName, accountType, balance });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Bank Account</DialogTitle>
          <DialogDescription>
            Add a new bank account to track your finances. Your account details are stored securely.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="bank">Bank</Label>
            <Select value={bankName} onValueChange={setBankName}>
              <SelectTrigger>
                <SelectValue placeholder="Select your bank" />
              </SelectTrigger>
              <SelectContent>
                {UK_BANKS.map((bank) => (
                  <SelectItem key={bank} value={bank}>
                    {bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="type">Account Type</Label>
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="balance">Current Balance (£)</Label>
            <Input
              id="balance"
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="6750"
              min="0"
              step="0.01"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Connecting...
              </>
            ) : (
              "Connect Account"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}