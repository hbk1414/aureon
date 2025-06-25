import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, User, Target, PiggyBank, CreditCard, Home, TrendingUp, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createUserDocument } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";

interface OnboardingData {
  // Personal Info
  fullName: string;
  age: string;
  employmentStatus: string;
  monthlyIncome: string;
  
  // Financial Goals
  goals: string[];
  
  // Budgeting Setup
  monthlyBudget: string;
  savingsTarget: string;
  emergencyFundTarget: string;
  
  // Existing Debts
  hasDebts: boolean;
  debts: Array<{
    type: string;
    totalAmount: string;
    monthlyRepayment: string;
    interestRate: string;
  }>;
  
  // Living Situation
  livingSituation: string;
  monthlyHousingCost: string;
  
  // Spending Categories
  spendingCategories: string[];
  
  // Financial Confidence
  financialConfidence: string;
  
  // Upcoming Goals
  upcomingGoals: string;
  
  // Risk Tolerance
  riskTolerance: string;
}

const initialData: OnboardingData = {
  fullName: "",
  age: "",
  employmentStatus: "",
  monthlyIncome: "",
  goals: [],
  monthlyBudget: "3000",
  savingsTarget: "",
  emergencyFundTarget: "6",
  hasDebts: false,
  debts: [],
  livingSituation: "",
  monthlyHousingCost: "",
  spendingCategories: [],
  financialConfidence: "5",
  upcomingGoals: "",
  riskTolerance: "Medium"
};

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const totalSteps = 7;
  const progress = (currentStep / totalSteps) * 100;

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const addDebt = () => {
    setData(prev => ({
      ...prev,
      debts: [...prev.debts, { type: "", totalAmount: "", monthlyRepayment: "", interestRate: "" }]
    }));
  };

  const updateDebt = (index: number, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      debts: prev.debts.map((debt, i) => 
        i === index ? { ...debt, [field]: value } : debt
      )
    }));
  };

  const removeDebt = (index: number) => {
    setData(prev => ({
      ...prev,
      debts: prev.debts.filter((_, i) => i !== index)
    }));
  };

  const toggleGoal = (goal: string) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) 
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const toggleSpendingCategory = (category: string) => {
    setData(prev => ({
      ...prev,
      spendingCategories: prev.spendingCategories.includes(category)
        ? prev.spendingCategories.filter(c => c !== category)
        : [...prev.spendingCategories, category]
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Create comprehensive user document
      const userDocument = {
        // Basic info
        fullName: data.fullName,
        age: data.age ? parseInt(data.age) : null,
        employmentStatus: data.employmentStatus,
        monthlyIncome: parseFloat(data.monthlyIncome) || 0,
        
        // Goals and preferences
        goals: data.goals,
        spendingCategories: data.spendingCategories,
        financialConfidence: parseInt(data.financialConfidence),
        upcomingGoals: data.upcomingGoals,
        riskTolerance: data.riskTolerance,
        
        // Budget and savings
        monthlyBudget: parseFloat(data.monthlyBudget) || 3000,
        savingsTarget: parseFloat(data.savingsTarget) || 0,
        emergencyFundTarget: parseFloat(data.emergencyFundTarget) || 6,
        
        // Housing
        livingSituation: data.livingSituation,
        monthlyHousingCost: parseFloat(data.monthlyHousingCost) || 0,
        
        // Debts
        hasDebts: data.hasDebts,
        debts: data.debts.filter(debt => debt.type && debt.totalAmount),
        
        // Default financial data
        creditScore: 720,
        totalSpent: 0,
        savingsRate: 0.15,
        emergencyFund: {
          currentAmount: 0,
          targetAmount: (parseFloat(data.monthlyBudget) || 3000) * (parseFloat(data.emergencyFundTarget) || 6),
          isCompleted: false
        },
        accounts: [],
        aiTasks: [],
        
        // Onboarding completion
        onboardingCompleted: true,
        createdAt: new Date().toISOString()
      };

      await createUserDocument(user.uid, userDocument);
      
      toast({
        title: "Welcome to AUREON!",
        description: "Your profile has been created successfully"
      });
      
      setLocation("/dashboard");
    } catch (error) {
      console.error("Error creating user profile:", error);
      toast({
        title: "Error",
        description: "Failed to create your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return data.fullName && data.employmentStatus && data.monthlyIncome;
      case 2:
        return data.goals.length > 0;
      case 3:
        return data.monthlyBudget;
      case 4:
        return !data.hasDebts || data.debts.length > 0;
      case 5:
        return data.livingSituation;
      case 6:
        return data.spendingCategories.length > 0;
      case 7:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Personal Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={data.fullName}
                  onChange={(e) => updateData('fullName', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <Label htmlFor="age">Age (optional)</Label>
                <Input
                  id="age"
                  type="number"
                  value={data.age}
                  onChange={(e) => updateData('age', e.target.value)}
                  placeholder="Enter your age"
                />
              </div>
              
              <div>
                <Label>Employment Status *</Label>
                <Select value={data.employmentStatus} onValueChange={(value) => updateData('employmentStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employed">Employed</SelectItem>
                    <SelectItem value="Self-employed">Self-employed</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Unemployed">Unemployed</SelectItem>
                    <SelectItem value="Retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="monthlyIncome">Monthly Income (£) *</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  value={data.monthlyIncome}
                  onChange={(e) => updateData('monthlyIncome', e.target.value)}
                  placeholder="Enter your monthly income"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Financial Goals</h2>
            </div>
            
            <div>
              <Label className="text-base">What do you want to get out of this app? *</Label>
              <p className="text-sm text-gray-600 mb-4">Select all that apply</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Pay off debt",
                  "Build emergency savings", 
                  "Track spending",
                  "Save for a big goal",
                  "Invest spare change",
                  "Achieve financial freedom"
                ].map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={data.goals.includes(goal)}
                      onCheckedChange={() => toggleGoal(goal)}
                    />
                    <Label htmlFor={goal} className="text-sm">{goal}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <PiggyBank className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Budgeting Setup</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="monthlyBudget">Monthly Budget (£) *</Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  value={data.monthlyBudget}
                  onChange={(e) => updateData('monthlyBudget', e.target.value)}
                  placeholder="3000"
                />
              </div>
              
              <div>
                <Label htmlFor="savingsTarget">Savings Target per Month (£)</Label>
                <Input
                  id="savingsTarget"
                  type="number"
                  value={data.savingsTarget}
                  onChange={(e) => updateData('savingsTarget', e.target.value)}
                  placeholder="Optional"
                />
              </div>
              
              <div>
                <Label htmlFor="emergencyFundTarget">Emergency Fund Target (months of expenses)</Label>
                <Input
                  id="emergencyFundTarget"
                  type="number"
                  value={data.emergencyFundTarget}
                  onChange={(e) => updateData('emergencyFundTarget', e.target.value)}
                  placeholder="6"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Existing Debts</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-base">Do you currently have any debts?</Label>
                <div className="flex space-x-4 mt-2">
                  <Button
                    variant={data.hasDebts ? "default" : "outline"}
                    onClick={() => updateData('hasDebts', true)}
                    size="sm"
                  >
                    Yes
                  </Button>
                  <Button
                    variant={!data.hasDebts ? "default" : "outline"}
                    onClick={() => updateData('hasDebts', false)}
                    size="sm"
                  >
                    No
                  </Button>
                </div>
              </div>
              
              {data.hasDebts && (
                <div className="space-y-4">
                  {data.debts.map((debt, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Debt Type</Label>
                            <Select 
                              value={debt.type} 
                              onValueChange={(value) => updateDebt(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select debt type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Credit Card">Credit Card</SelectItem>
                                <SelectItem value="Student Loan">Student Loan</SelectItem>
                                <SelectItem value="Mortgage">Mortgage</SelectItem>
                                <SelectItem value="Personal Loan">Personal Loan</SelectItem>
                                <SelectItem value="Buy Now Pay Later">Buy Now Pay Later</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Total Amount (£)</Label>
                            <Input
                              type="number"
                              value={debt.totalAmount}
                              onChange={(e) => updateDebt(index, 'totalAmount', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          
                          <div>
                            <Label>Monthly Repayment (£)</Label>
                            <Input
                              type="number"
                              value={debt.monthlyRepayment}
                              onChange={(e) => updateDebt(index, 'monthlyRepayment', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          
                          <div>
                            <Label>Interest Rate (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={debt.interestRate}
                              onChange={(e) => updateDebt(index, 'interestRate', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeDebt(index)}
                          className="mt-3"
                        >
                          Remove Debt
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button onClick={addDebt} variant="outline">
                    Add Another Debt
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <Home className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Living Situation</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Current Living Situation *</Label>
                <Select value={data.livingSituation} onValueChange={(value) => updateData('livingSituation', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select living situation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Renting">Renting</SelectItem>
                    <SelectItem value="Own with mortgage">Own with mortgage</SelectItem>
                    <SelectItem value="Own outright">Own outright</SelectItem>
                    <SelectItem value="Living with parents">Living with parents</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="monthlyHousingCost">Monthly Housing Cost (£)</Label>
                <Input
                  id="monthlyHousingCost"
                  type="number"
                  value={data.monthlyHousingCost}
                  onChange={(e) => updateData('monthlyHousingCost', e.target.value)}
                  placeholder="Enter monthly rent/mortgage"
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Spending Insights</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-base">Where do you think most of your money goes? *</Label>
                <p className="text-sm text-gray-600 mb-4">Select all that apply</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Groceries",
                    "Transport",
                    "Subscriptions",
                    "Eating Out",
                    "Shopping",
                    "Bills & Utilities",
                    "Childcare",
                    "Other"
                  ].map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={data.spendingCategories.includes(category)}
                        onCheckedChange={() => toggleSpendingCategory(category)}
                      />
                      <Label htmlFor={category} className="text-sm">{category}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="financialConfidence">Financial Confidence (1-10)</Label>
                <p className="text-sm text-gray-600 mb-2">How confident do you feel managing your money?</p>
                <Input
                  id="financialConfidence"
                  type="range"
                  min="1"
                  max="10"
                  value={data.financialConfidence}
                  onChange={(e) => updateData('financialConfidence', e.target.value)}
                  className="w-full"
                />
                <div className="text-center mt-1 text-sm text-gray-600">
                  {data.financialConfidence}/10
                </div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Future Planning</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="upcomingGoals">Major Financial Goals (Next 12 Months)</Label>
                <p className="text-sm text-gray-600 mb-2">e.g., "Save for a wedding", "Buy a car", "Start a business"</p>
                <Textarea
                  id="upcomingGoals"
                  value={data.upcomingGoals}
                  onChange={(e) => updateData('upcomingGoals', e.target.value)}
                  placeholder="Describe any major financial goals..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Risk Tolerance</Label>
                <p className="text-sm text-gray-600 mb-2">For future investing features</p>
                <Select value={data.riskTolerance} onValueChange={(value) => updateData('riskTolerance', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low (Security &gt; Returns)</SelectItem>
                    <SelectItem value="Medium">Medium (Balanced approach)</SelectItem>
                    <SelectItem value="High">High (Higher returns, comfortable with volatility)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Welcome to AUREON</CardTitle>
                <CardDescription>
                  Let's set up your personalized financial dashboard
                </CardDescription>
              </div>
              <div className="text-sm text-gray-500">
                Step {currentStep} of {totalSteps}
              </div>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
          
          <CardContent>
            {renderStep()}
            
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <Button
                onClick={nextStep}
                disabled={!canContinue() || isSubmitting}
              >
                {currentStep === totalSteps ? 
                  (isSubmitting ? "Creating Profile..." : "Complete Setup") : 
                  "Next"
                }
                {currentStep < totalSteps && <ChevronRight className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}