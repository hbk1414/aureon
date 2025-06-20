import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Users, Target, Plus, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SharedGoal {
  id: number;
  title: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string | null;
  category: string;
  isCompleted: boolean;
  progress: number;
}

interface Partner {
  name: string;
  relationshipType: string;
}

interface CouplesProps {
  partner: Partner | null;
  sharedGoals: SharedGoal[];
  totalSaved: number;
  monthlyContribution: number;
}

export default function Couples({ partner, sharedGoals, totalSaved, monthlyContribution }: CouplesProps) {
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isLinkPartnerOpen, setIsLinkPartnerOpen] = useState(false);

  const completedGoals = sharedGoals.filter(goal => goal.isCompleted).length;
  const activeGoals = sharedGoals.filter(goal => !goal.isCompleted);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-pink-500" />
            <CardTitle>Couples Savings</CardTitle>
          </div>
          {!partner && (
            <Dialog open={isLinkPartnerOpen} onOpenChange={setIsLinkPartnerOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Link Partner
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Link with Partner</DialogTitle>
                  <DialogDescription>
                    Connect with your spouse, partner, or sibling to save together towards shared goals.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="partner-email">Partner's Email</Label>
                    <Input
                      id="partner-email"
                      placeholder="partner@example.com"
                      type="email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="relationship">Relationship</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsLinkPartnerOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsLinkPartnerOpen(false)}>
                      Send Invitation
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {partner ? (
          <CardDescription>
            Saving together with {partner.name} ({partner.relationshipType})
          </CardDescription>
        ) : (
          <CardDescription>
            Link with a partner to start saving together towards shared goals
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {partner ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-pink-600">
                  £{totalSaved.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Saved Together</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  £{monthlyContribution.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Monthly Contributions</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {completedGoals}/{sharedGoals.length}
                </div>
                <div className="text-sm text-gray-600">Goals Completed</div>
              </div>
            </div>

            {/* Shared Goals */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Shared Goals</h3>
                <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Goal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Shared Goal</DialogTitle>
                      <DialogDescription>
                        Set a savings goal that you and your partner can work towards together.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="goal-title">Goal Title</Label>
                        <Input
                          id="goal-title"
                          placeholder="e.g., Holiday to Italy"
                        />
                      </div>
                      <div>
                        <Label htmlFor="target-amount">Target Amount (£)</Label>
                        <Input
                          id="target-amount"
                          placeholder="5000"
                          type="number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vacation">Holiday</SelectItem>
                            <SelectItem value="house">House Purchase</SelectItem>
                            <SelectItem value="wedding">Wedding</SelectItem>
                            <SelectItem value="emergency">Emergency Fund</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="deadline">Target Date</Label>
                        <Input
                          id="deadline"
                          type="date"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsAddGoalOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => setIsAddGoalOpen(false)}>
                          Create Goal
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {activeGoals.length > 0 ? (
                <div className="space-y-4">
                  {activeGoals.map((goal) => (
                    <div key={goal.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-blue-500" />
                          <h4 className="font-medium">{goal.title}</h4>
                          <Badge variant="secondary">{goal.category}</Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            £{parseFloat(goal.currentAmount).toLocaleString()} / £{parseFloat(goal.targetAmount).toLocaleString()}
                          </div>
                          {goal.deadline && (
                            <div className="text-sm text-gray-500">
                              Due: {new Date(goal.deadline).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <Progress value={goal.progress} className="h-2 mb-2" />
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{goal.progress}% complete</span>
                        <Button size="sm" variant="outline">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Contribute
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No shared goals yet</p>
                  <p className="text-sm">Create your first goal to start saving together</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">Save Together</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Link with your spouse, partner, or sibling to create shared savings goals 
              and track your progress together towards major life milestones.
            </p>
            <Button onClick={() => setIsLinkPartnerOpen(true)}>
              <Heart className="h-4 w-4 mr-2" />
              Get Started
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}