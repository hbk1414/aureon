import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AiTask } from "@shared/schema";

interface AiTasksProps {
  tasks: AiTask[];
}

export default function AiTasks({ tasks }: AiTasksProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return apiRequest("PATCH", `/api/ai/tasks/${taskId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/1"] });
      toast({
        title: "Task Completed",
        description: "Great job completing your financial task!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive",
      });
    },
  });

  const generateTasksMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/ai/generate-tasks/1");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/1"] });
      toast({
        title: "Success",
        description: "New AI tasks generated!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate new tasks",
        variant: "destructive",
      });
    },
  });

  const handleCompleteTask = (taskId: number) => {
    completeTaskMutation.mutate(taskId);
  };

  const handleGenerateTasks = () => {
    generateTasksMutation.mutate();
  };

  const getTaskBorderColor = (category: string) => {
    switch (category) {
      case 'debt':
        return 'border-l-accent';
      case 'savings':
        return 'border-l-primary';
      case 'investing':
        return 'border-l-success';
      case 'budgeting':
        return 'border-l-orange-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const getTaskBgColor = (category: string) => {
    switch (category) {
      case 'debt':
        return 'bg-purple-50';
      case 'savings':
        return 'bg-blue-50';
      case 'investing':
        return 'bg-green-50';
      case 'budgeting':
        return 'bg-orange-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getTaskButtonColor = (category: string) => {
    switch (category) {
      case 'debt':
        return 'bg-accent hover:bg-purple-700';
      case 'savings':
        return 'bg-primary hover:bg-blue-700';
      case 'investing':
        return 'bg-success hover:bg-green-700';
      case 'budgeting':
        return 'bg-orange-500 hover:bg-orange-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">AI Tasks</h3>
          <div className="flex items-center gap-2">
            {tasks.length > 0 && (
              <Badge variant="secondary" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 rounded-xl px-3 py-1 shadow-md text-sm uppercase tracking-wide font-medium">
                {tasks.length} New
              </Badge>
            )}
            <Button 
              onClick={handleGenerateTasks}
              disabled={generateTasksMutation.isPending}
              size="sm"
              variant="outline"
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 hover:from-indigo-600 hover:to-purple-700 text-sm uppercase tracking-wide font-medium"
            >
              Generate
            </Button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-md text-gray-600 mb-4">No active tasks. Generate new AI recommendations!</p>
            <Button 
              onClick={handleGenerateTasks}
              disabled={generateTasksMutation.isPending}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 hover:from-indigo-600 hover:to-purple-700 text-sm uppercase tracking-wide font-medium"
            >
              {generateTasksMutation.isPending ? "Generating..." : "Generate AI Tasks"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.slice(0, 3).map((task) => (
              <div 
                key={task.id}
                className={`border-l-4 ${getTaskBorderColor(task.category)} ${getTaskBgColor(task.category)} rounded-xl p-4 hover:shadow-lg hover:bg-opacity-90 transition-all duration-300 hover:scale-[1.02]`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-md font-bold text-gray-800">{task.title}</span>
                  <span className="text-sm uppercase tracking-wide text-gray-600 font-medium">{task.taskType}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleCompleteTask(task.id)}
                    disabled={completeTaskMutation.isPending}
                    size="sm"
                    className={`text-white text-sm uppercase tracking-wide font-medium rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 ${getTaskButtonColor(task.category)}`}
                  >
                    {task.category === 'debt' ? 'Review' : 
                     task.category === 'savings' ? 'Transfer' : 
                     task.category === 'investing' ? 'Rebalance' : 'Complete'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 text-sm uppercase tracking-wide font-medium hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-all duration-300"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
