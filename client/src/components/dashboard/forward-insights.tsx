import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

const severityStyles: Record<string, string> = {
  high: 'bg-yellow-100 border-yellow-300 text-yellow-900',
  medium: 'bg-rose-100 border-rose-300 text-rose-900',
  low: 'bg-emerald-100 border-emerald-300 text-emerald-900',
};

export function ForwardInsights() {
  const [insights, setInsights] = useState<{ message: string; severity: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/insights')
      .then(res => res.json())
      .then(data => {
        setInsights(data.insights || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load insights');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading smart insights…</div>;
  }
  if (error) {
    return <div className="py-8 text-center text-red-500">{error}</div>;
  }
  if (!insights.length) {
    return <div className="py-8 text-center text-gray-400">No smart insights available right now.</div>;
  }

  return (
    <div className="grid grid-cols-12 gap-6 mb-8">
      {insights.map((insight, idx) => (
        <div key={idx} className="col-span-12 md:col-span-6 xl:col-span-4">
          <Card className={`shadow group border ${severityStyles[insight.severity] || 'bg-gray-50 border-gray-200 text-gray-900'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bold">
                <Info className="w-4 h-4" /> Smart Insight
              </CardTitle>
            </CardHeader>
            <CardContent className="font-medium">{insight.message}</CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

export default ForwardInsights; 