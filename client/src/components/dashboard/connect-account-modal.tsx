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

  const generateLast4 = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleSubmit = async () => {
    if (!user?.uid) {
      toast({
        title: "Error",
        description: "Please sign in to connect an account",
        variant: "destructive",
      });
      return;
    }

    if (!bankName || !accountType || !balance) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid balance amount",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const newAccount = {
        bankName,
        type: accountType,
        balance: balanceNum,
        last4: generateLast4(),
        connectedAt: new Date().toISOString()
      };

      await addAccountToUser(user.uid, newAccount);
      
      toast({
        title: "Success",
        description: `${bankName} ${accountType} connected successfully`,
      });

      // Reset form
      setBankName("");
      setAccountType("");
      setBalance("6750");
      
      onAccountAdded();
      onOpenChange(false);
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