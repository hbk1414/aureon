import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DebtAccount } from "@shared/schema";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Plus } from "lucide-react";
import { createDebtAccount } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface DebtPayoffStrategyProps {
  debtAccounts: DebtAccount[];
}

export default function DebtPayoffStrategy({ debtAccounts }: DebtPayoffStrategyProps) {
  const handleApplyStrategy = () => {
    // TODO: Implement debt strategy application
    console.log('Apply debt strategy');
  };

  const getPriorityBadge = (priority: number | null) => {
    if (!priority) return null;
    
    const priorityMap = {
      1: { label: "Priority #1", className: "bg-red-100 text-red-700" },
      2: { label: "Priority #2", className: "bg-yellow-100 text-yellow-700" },
      3: { label: "Priority #3", className: "bg-blue-100 text-blue-700" },
    };
    
    const config = priorityMap[priority as keyof typeof priorityMap];
    if (!config) return null;
    
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', balance: '', apr: '', minimumPayment: '' });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add a debt.",
        variant: "destructive",
      });
      return;
    }
    try {
      await createDebtAccount(user.uid, {
        name: form.name,
        balance: String(form.balance),
        apr: String(form.apr),
        minimumPayment: String(form.minimumPayment),
        priority: debtAccounts.length + 1,
        suggestedPayment: null,
        userId: Number(user.uid),
      });
      setOpen(false);
      setForm({ name: '', balance: '', apr: '', minimumPayment: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard', user.uid] });
      toast({
        title: "Debt Added!",
        description: `Successfully added debt: ${form.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add debt. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (debtAccounts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Debt Payoff Strategy</h3>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="outline" className="ml-2" aria-label="Add Debt">
                  <Plus className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Debt</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddDebt} className="space-y-4">
                  <Input name="name" placeholder="Debt Name" value={form.name} onChange={handleChange} required />
                  <Input name="balance" placeholder="Balance (£)" type="number" value={form.balance} onChange={handleChange} required />
                  <Input name="apr" placeholder="APR (%)" type="number" step="0.01" value={form.apr} onChange={handleChange} required />
                  <Input name="minimumPayment" placeholder="Minimum Payment (£/month)" type="number" value={form.minimumPayment} onChange={handleChange} required />
                  <DialogFooter>
                    <Button type="submit">Add Debt</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-gray-600">No debt accounts found. Great job staying debt-free!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-800">AI Debt Payoff Strategy</h3>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="ml-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 hover:from-indigo-600 hover:to-purple-700" 
                  aria-label="Add Debt"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-xl border-0 shadow-xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-gray-800">Add New Debt</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddDebt} className="space-y-4">
                  <div>
                    <label className="text-sm uppercase tracking-wide text-gray-600 font-medium mb-2 block">Debt Name</label>
                    <Input 
                      name="name" 
                      placeholder="Enter debt name" 
                      value={form.name} 
                      onChange={handleChange} 
                      required 
                      className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm uppercase tracking-wide text-gray-600 font-medium mb-2 block">Balance</label>
                    <Input 
                      name="balance" 
                      placeholder="Enter balance in £" 
                      type="number" 
                      value={form.balance} 
                      onChange={handleChange} 
                      required 
                      className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm uppercase tracking-wide text-gray-600 font-medium mb-2 block">APR</label>
                    <Input 
                      name="apr" 
                      placeholder="Enter APR percentage" 
                      type="number" 
                      step="0.01" 
                      value={form.apr} 
                      onChange={handleChange} 
                      required 
                      className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm uppercase tracking-wide text-gray-600 font-medium mb-2 block">Minimum Payment</label>
                    <Input 
                      name="minimumPayment" 
                      placeholder="Enter monthly minimum payment" 
                      type="number" 
                      value={form.minimumPayment} 
                      onChange={handleChange} 
                      required 
                      className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 hover:from-indigo-600 hover:to-purple-700"
                    >
                      Add Debt
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Badge variant="secondary" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 rounded-xl px-3 py-1 shadow-md text-sm uppercase tracking-wide font-medium">
            AI Optimized
          </Badge>
        </div>
        
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <Lightbulb className="text-orange-500 mr-2 w-5 h-5" />
            <span className="font-medium text-gray-800">Recommendation</span>
          </div>
          <p className="text-gray-700 text-sm mb-3">
            Focus on your highest interest debt first using the avalanche method. 
            You'll save money on interest and become debt-free sooner.
          </p>
          <Button 
            onClick={handleApplyStrategy}
            className="bg-orange-500 text-white hover:bg-orange-600"
            size="sm"
          >
            Apply Strategy
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {debtAccounts.map((debt) => (
            <div key={debt.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-800">{debt.name}</span>
                {getPriorityBadge(debt.priority)}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Balance</span>
                  <span className="font-medium">£{parseFloat(debt.balance).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">APR</span>
                  <span className="font-medium text-danger">{parseFloat(debt.apr).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {debt.suggestedPayment ? 'Suggested Payment' : 'Minimum Payment'}
                  </span>
                  <span className={`font-medium ${debt.suggestedPayment ? 'text-primary' : ''}`}>
                    £{parseFloat(debt.suggestedPayment || debt.minimumPayment).toLocaleString()}/month
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
