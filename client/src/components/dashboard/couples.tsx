
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Users, Trophy, TrendingUp, Plus, Target, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import {
  useCoupleData,
  useSharedGoals,
  useLinkPartner,
  useAcceptPartnerInvite,
  useAddSharedGoal,
  useEditSharedGoal,
  useDeleteSharedGoal,
  useContributeToGoal,
  useGoalContributions
} from '@/hooks/use-couples';
import { getGoalContributions } from '@/lib/firestore';
import { createDummyCoupleWithGoal, contributeToGoal } from '@/lib/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import ConfettiExplosion from 'react-confetti-explosion';
import { useEffect, useRef, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

// Partner avatar utility
function getInitials(email: string): string {
  if (!email) return '';
  const [name] = email.split('@');
  return name.slice(0, 2).toUpperCase();
}

type Contribution = {
  id: string;
  userEmail: string;
  amount: number;
  createdAt?: Date | string;
};

type CoupleGoalCardProps = {
  goal: SharedGoal;
  coupleId: string;
  userEmail: string;
  partnerEmail: string;
  couple: any;
  setEditGoalId: (id: string) => void;
  setEditGoalTitle: (title: string) => void;
  setEditGoalTarget: (target: string) => void;
  setEditGoalCategory: (cat: string) => void;
  setEditGoalDeadline: (deadline: string) => void;
  setIsEditGoalOpen: (open: boolean) => void;
  deleteGoalMutation: any;
  contributeMutation: any;
  contributionInputs: Record<string, string>;
  setContributionInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
};

function CoupleGoalCard({ goal, coupleId, userEmail, partnerEmail, couple, setEditGoalId, setEditGoalTitle, setEditGoalTarget, setEditGoalCategory, setEditGoalDeadline, setIsEditGoalOpen, deleteGoalMutation, contributeMutation, contributionInputs, setContributionInputs }: CoupleGoalCardProps) {
  const targetAmount = typeof goal.targetAmount === 'number' ? goal.targetAmount : parseFloat(goal.targetAmount);
  const currentAmount = typeof goal.currentAmount === 'number' ? goal.currentAmount : parseFloat(goal.currentAmount);
  const progress = targetAmount ? Math.round((currentAmount / targetAmount) * 100) : 0;
  const inputValue = contributionInputs[goal.id] || '';
  const isContributing = contributeMutation.isPending && contributeMutation.variables?.goalId === goal.id;
  // Fetch contributions for this goal
  const goalContribQuery = useGoalContributions(coupleId, goal.id);
  const contributions: Contribution[] = (goalContribQuery.data as Contribution[] || []).filter(c => c && typeof c.userEmail === 'string' && c.amount !== undefined);
  const loadingContributions = goalContribQuery.isLoading;
  
  // Debug output
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Goal ${goal.id} contributions:`, contributions);
  }
  
  // Calculate totals per user
  const userContrib = contributions.filter((c: Contribution) => c.userEmail === userEmail).reduce((sum, c) => sum + (typeof c.amount === 'string' ? parseFloat(c.amount as any) : c.amount), 0);
  const partnerContrib = partnerEmail ? contributions.filter((c: Contribution) => c.userEmail === partnerEmail).reduce((sum, c) => sum + (typeof c.amount === 'string' ? parseFloat(c.amount as any) : c.amount), 0) : 0;
  const totalContrib = userContrib + partnerContrib;
  const remaining = Math.max((targetAmount || 0) - totalContrib, 0);
  // Clamp segment widths so bar never exceeds 100%
  const userPct = targetAmount ? Math.min((userContrib / targetAmount) * 100, 100) : 0;
  const partnerPct = targetAmount ? Math.min((partnerContrib / targetAmount) * 100, 100 - userPct) : 0;
  const totalPct = userPct + partnerPct;
  const remainingPct = Math.max(100 - totalPct, 0);
  // Confetti if goal reached or exceeded
  const isGoalCompleted = totalContrib >= targetAmount;
  const [showConfetti, setShowConfetti] = useState(false);
  const wasCompleted = useRef(false);
  
  // Debug confetti logic
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Goal ${goal.id} confetti debug:`, {
      totalContrib,
      targetAmount,
      isGoalCompleted,
      wasCompleted: wasCompleted.current,
      showConfetti,
      contributionsCount: contributions.length
    });
  }
  
  useEffect(() => {
    if (!wasCompleted.current && totalContrib >= targetAmount && targetAmount > 0) {
      console.log(`🎉 GOAL COMPLETED! Triggering confetti for goal ${goal.id}`);
      setShowConfetti(true);
      wasCompleted.current = true;
      setTimeout(() => {
        setShowConfetti(false);
        console.log(`Confetti hidden for goal ${goal.id}`);
      }, 2000);
    }
    if (totalContrib < targetAmount) {
      wasCompleted.current = false;
    }
  }, [totalContrib, targetAmount, goal.id]);

  if (isGoalCompleted) {
    return (
      <motion.div
        key={goal.id}
        style={{
          background: 'rgba(255,255,255,0.2)',
          position: 'relative',
          borderRadius: '1.25rem',
          overflow: 'hidden',
          minWidth: '320px',
          minHeight: '300px',
          maxWidth: '420px',
          margin: '0 auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255,255,255,0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, Poppins, system-ui, sans-serif',
          color: '#1f2937',
        }}
        className="group"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
      >
        {/* Confetti pops up for 2s when goal is achieved */}
        {showConfetti && (
          <div className="absolute left-0 right-0 top-0 flex flex-col items-center z-50 pointer-events-none">
            <ConfettiExplosion />
          </div>
        )}
        {/* Manual confetti trigger for testing */}
        {process.env.NODE_ENV !== 'production' && (
          <button
            className="absolute top-2 left-2 z-50 bg-yellow-400 text-black px-2 py-1 rounded text-xs"
            onClick={() => {
              console.log('Manual confetti trigger for goal', goal.id);
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 2000);
            }}
          >
            🎉 Test Confetti
          </button>
        )}
        {/* Glass overlay for extra glassmorphism pop */}
        <div className="absolute inset-0 z-10 pointer-events-none" style={{
          background: 'rgba(255,255,255,0.10)',
          borderRadius: '1.2rem',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }} />
        {/* Finalized badge with icon and gradient */}
        <div className="absolute top-3 right-3 z-30">
          <span
            className="flex items-center gap-1 px-3 py-1 rounded-full font-semibold shadow"
            style={{
              background: 'linear-gradient(90deg, #ec4899 0%, #a855f7 100%)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontFamily: 'Inter, Poppins, system-ui, sans-serif',
              boxShadow: '0 1px 4px 0 rgba(168,85,247,0.10)',
              letterSpacing: '0.01em',
              fontSize: '0.75rem',
              padding: '0.25rem 0.75rem',
              minWidth: 'unset',
              justifyContent: 'center',
            }}
          >
            <span className="text-base" style={{filter:'drop-shadow(0 1px 2px rgba(0,0,0,0.12))'}}>🎯</span>
            Finalized
          </span>
        </div>
        <div className="relative z-20 flex flex-col items-center w-full mt-12">
          <div className="text-2xl font-bold mb-3 text-center w-full tracking-tight" style={{color:'#1f2937',textShadow:'0 1px 2px rgba(255,255,255,0.5)',fontWeight:700,fontFamily:'Inter, Poppins, system-ui, sans-serif'}}>
            {goal.title}
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl font-extrabold" style={{color:'#1f2937',textShadow:'0 1px 2px rgba(255,255,255,0.5)',fontWeight:800,fontFamily:'Inter, Poppins, system-ui, sans-serif'}}>£{totalContrib.toLocaleString()}</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-2 w-full">
            <span className="flex items-center gap-2 text-sm font-medium" style={{color:'#1f2937',textShadow:'0 1px 2px rgba(255,255,255,0.5)',fontFamily:'Inter, Poppins, system-ui, sans-serif'}}>
              <span className="inline-block w-3 h-3 rounded-full bg-blue-400" />
              <span role="img" aria-label="You">👤</span> You: <span className="text-lg font-bold" style={{color:'#1f2937',textShadow:'0 1px 2px rgba(255,255,255,0.5)',fontWeight:700}}>£{userContrib.toLocaleString()}</span>
            </span>
            {partnerEmail && (
              <span className="flex items-center gap-2 text-sm font-medium" style={{color:'#1f2937',textShadow:'0 1px 2px rgba(255,255,255,0.5)',fontFamily:'Inter, Poppins, system-ui, sans-serif'}}>
                <span className="inline-block w-3 h-3 rounded-full bg-pink-400" />
                <span role="img" aria-label="Partner">🤝</span> Partner: <span className="text-lg font-bold" style={{color:'#1f2937',textShadow:'0 1px 2px rgba(255,255,255,0.5)',fontWeight:700}}>£{partnerContrib.toLocaleString()}</span>
              </span>
            )}
          </div>
          <div className="text-base font-medium text-center w-full mt-4" style={{color:'#1f2937',textShadow:'0 1px 2px rgba(255,255,255,0.5)',fontWeight:600,fontFamily:'Inter, Poppins, system-ui, sans-serif'}}>
            Contributed by you and your partner
          </div>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      key={goal.id}
      className={`relative bg-white rounded-xl p-6 flex flex-col justify-between border border-blue-50 group transition-shadow duration-300 ${isGoalCompleted ? 'bg-blue-50 opacity-80 pointer-events-none' : ''}`}
      style={{
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        borderRadius: '1.25rem',
        minHeight: '300px',
      }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      whileHover={{ scale: 1.03, boxShadow: '0 8px 32px 0 rgba(56,189,248,0.15)' }}
    >
      {/* Blue overlay and Finalized badge if completed */}
      {isGoalCompleted && (
        <>
          <div className="absolute inset-0 bg-blue-200/60 rounded-xl z-10" />
          <div className="absolute top-4 left-4 z-20 bg-blue-600 text-white px-4 py-2 rounded-full font-extrabold shadow text-lg tracking-wide">
            Finalized
          </div>
        </>
      )}
      {/* Confetti pops up for 2s when goal is achieved */}
      {showConfetti && (
        <div className="absolute left-0 right-0 top-0 flex flex-col items-center z-20 pointer-events-none">
          <ConfettiExplosion />
        </div>
      )}
      {/* Achieved badge in top-right corner if goal completed */}
      {isGoalCompleted && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full shadow font-semibold text-sm"
        >
          <CheckCircle className="w-5 h-5 text-emerald-500 animate-pulse" />
          Achieved: {goal.title} — £{totalContrib.toLocaleString()}
        </motion.div>
      )}
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-bold text-blue-900 capitalize">{goal.category}</span>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 w-fit">{goal.title}</Badge>
        </div>
        <div className="flex gap-2">
          {!isGoalCompleted && (
            <>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button size="icon" variant="outline" className="rounded-full" onClick={() => {
                  setEditGoalId(String(goal.id));
                  setEditGoalTitle(goal.title);
                  setEditGoalTarget(String(goal.targetAmount));
                  setEditGoalCategory(goal.category);
                  setEditGoalDeadline(goal.deadline || '');
                  setIsEditGoalOpen(true);
                }}>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button size="icon" variant="destructive" className="rounded-full" onClick={() => deleteGoalMutation.mutate({ coupleId, goalId: goal.id })} disabled={deleteGoalMutation.isPending}>
                  ×
                </Button>
              </motion.div>
            </>
          )}
        </div>
      </div>
      <div className="text-right text-sm text-gray-500 mb-1">
        £{totalContrib.toLocaleString()} / £{parseFloat(goal.targetAmount).toLocaleString()}
      </div>
      {goal.deadline && (
        <div className="text-xs text-gray-400 mb-2">Due: {new Date(goal.deadline).toLocaleDateString()}</div>
      )}
      {/* Segmented Progress Bar */}
      <div className="w-full h-5 rounded-full bg-gray-200 flex overflow-hidden mb-4" style={{padding:'2px'}}>
        {loadingContributions ? (
          <div className="w-full bg-gray-300 animate-pulse" />
        ) : (
          <>
            <div style={{ width: `${userPct}%`, background: 'linear-gradient(90deg, #7e5bef, #f94d92)' }} className="transition-all duration-700 h-full rounded-l-full" />
            <div style={{ width: `${partnerPct}%`, background: 'linear-gradient(90deg, #f94d92, #7e5bef)' }} className="transition-all duration-700 h-full" />
            <div style={{ width: `${remainingPct}%` }} className="bg-gray-300 transition-all duration-700 h-full rounded-r-full" />
          </>
        )}
      </div>
      {/* Legend */}
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-blue-400" /><span role="img" aria-label="You">👤</span> You: £{userContrib.toLocaleString()}</span>
        {partnerEmail && (
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-pink-400" /><span role="img" aria-label="Partner">🤝</span> Partner: £{partnerContrib.toLocaleString()}</span>
        )}
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-gray-300" /> Remaining: £{remaining.toLocaleString()}</span>
      </div>
      {isGoalCompleted && (
        <div className="flex items-center justify-center gap-8 my-4 z-20 relative">
          <span className="flex items-center gap-1 text-base font-bold text-blue-700">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-400" />
            You contributed: £{userContrib.toLocaleString()}
          </span>
          {partnerEmail && (
            <span className="flex items-center gap-1 text-base font-bold text-pink-600">
              <span className="inline-block w-3 h-3 rounded-full bg-pink-400" />
              Partner contributed: £{partnerContrib.toLocaleString()}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between text-sm mt-2">
        <span className="font-semibold text-blue-700">{progress}% complete</span>
        {!isGoalCompleted && (
          <motion.div whileTap={{ scale: 0.96 }} className="flex gap-2 items-center">
            <input
              type="number"
              min="1"
              placeholder="Amount"
              className="w-20 px-2 py-1 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
              value={inputValue}
              onChange={e => setContributionInputs(inputs => ({ ...inputs, [goal.id]: e.target.value }))}
              disabled={isContributing}
            />
            <Button
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1 font-semibold shadow"
              style={{
                borderRadius: '0.75rem',
                transition: 'all 0.2s ease',
              }}
              onClick={() => {
                if (inputValue && !isNaN(Number(inputValue)) && Number(inputValue) > 0) {
                  contributeMutation.mutate({ coupleId, goalId: goal.id, amount: Number(inputValue), userEmail });
                  setContributionInputs(inputs => ({ ...inputs, [goal.id]: '' }));
                }
              }}
              disabled={!inputValue || isNaN(Number(inputValue)) || Number(inputValue) <= 0 || isContributing}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 12px rgba(0,0,0,0.1)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
            >
              {isContributing ? 'Adding...' : 'Contribute'}
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function Couples() {
  const { user } = useAuth();
  const userEmail = user?.email;

  // Couples Firestore hooks
  const { data: coupleData, isLoading: loadingCouple, error: errorCouple } = useCoupleData(userEmail);
  const couple = coupleData && coupleData.length > 0 ? coupleData[0] : null;
  const coupleId = couple?.id;
  const isPending = couple?.status === 'pending';
  const isActive = couple?.status === 'active';

  // Monthly contributions state and effect (must be at top level)
  const [monthlyContribution, setMonthlyContribution] = useState(0);

  // Debug output
  if (process.env.NODE_ENV !== 'production') {
    console.log('Couples Debug:', { userEmail, coupleData });
    if (coupleData) {
      coupleData.forEach(c => {
        console.log('COUPLE:', c.id, c);
      });
    }
  }

  const { data: sharedGoals, isLoading: loadingGoals, error: errorGoals } = useSharedGoals(coupleId);

  const linkPartnerMutation = useLinkPartner();
  const acceptInviteMutation = useAcceptPartnerInvite();
  const addGoalMutation = useAddSharedGoal();
  const editGoalMutation = useEditSharedGoal();
  const deleteGoalMutation = useDeleteSharedGoal();
  const contributeMutation = useContributeToGoal();

  useEffect(() => {
    // Calculate monthly contributions by fetching all contributions and filtering by current month
    const safeGoals: SharedGoal[] = isSharedGoalArray(sharedGoals) ? sharedGoals : [];
    const fetchMonthlyContributions = async () => {
      if (!coupleId || !safeGoals.length) {
        setMonthlyContribution(0);
        return;
      }
      try {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        let totalMonthlyContributions = 0;
        for (const goal of safeGoals) {
          const contributions = await getGoalContributions(coupleId, goal.id);
          if (contributions && Array.isArray(contributions)) {
            contributions.forEach((contribution: any) => {
              if (contribution && contribution.createdAt) {
                const contributionDate = contribution.createdAt.toDate ? contribution.createdAt.toDate() : new Date(contribution.createdAt);
                if (
                  contributionDate.getMonth() === currentMonth &&
                  contributionDate.getFullYear() === currentYear &&
                  contribution.userEmail === userEmail // Only count current user's contributions
                ) {
                  totalMonthlyContributions += contribution.amount || 0;
                }
              }
            });
          }
        }
        setMonthlyContribution(Math.round(totalMonthlyContributions));
      } catch (error) {
        console.error('Error fetching monthly contributions:', error);
        setMonthlyContribution(0);
      }
    };
    fetchMonthlyContributions();
  }, [coupleId, sharedGoals, contributeMutation.isSuccess]);

  // UI state for dialogs
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isLinkPartnerOpen, setIsLinkPartnerOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  // Add goal form state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCategory, setGoalCategory] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  // Edit goal dialog state
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [editGoalId, setEditGoalId] = useState('');
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [editGoalTarget, setEditGoalTarget] = useState('');
  const [editGoalCategory, setEditGoalCategory] = useState('');
  const [editGoalDeadline, setEditGoalDeadline] = useState('');
  // Add state for custom contribution amount per goal
  const [contributionInputs, setContributionInputs] = useState({});
  // Add state for invitees
  const [invitees, setInvitees] = useState<string[]>([]);
  const [inviteInput, setInviteInput] = useState('');
  const [addGoalError, setAddGoalError] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [search, setSearch] = useState('');

  // Type guard for SharedGoal[]
  function isSharedGoalArray(arr: any): arr is SharedGoal[] {
    return Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'object' && 'title' in arr[0] && 'targetAmount' in arr[0] && 'currentAmount' in arr[0] && 'isCompleted' in arr[0];
  }

  // Helper: validate email
  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Loading and error states
  if (loadingCouple) return <div>Loading couple data...</div>;
  if (errorCouple) return <div>Error loading couple data</div>;

  // No couple: show invite dialog
  if (!couple) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Couples Savings</CardTitle>
          <CardDescription>Link with a partner to start saving together towards shared goals</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsLinkPartnerOpen(true)}>Invite Partner</Button>
          <Dialog open={isLinkPartnerOpen} onOpenChange={setIsLinkPartnerOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Partner</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Partner's Email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  type="email"
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsLinkPartnerOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      await (linkPartnerMutation.mutateAsync as any)({ userId: user?.uid, userEmail: userEmail || '', partnerEmail: inviteEmail });
                      setIsLinkPartnerOpen(false);
                    }}
                    disabled={linkPartnerMutation.isPending}
                  >
                    {linkPartnerMutation.isPending ? 'Inviting...' : 'Send Invitation'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  // Pending invite: show accept button if user is the invited partner
  if (isPending && couple.invitedEmail === userEmail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Couples Savings</CardTitle>
          <CardDescription>You have been invited to join a couple. Accept to start saving together!</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={async () => {
              await (acceptInviteMutation.mutateAsync as any)({ userId: user?.uid, userEmail: userEmail || '', coupleId });
            }}
            disabled={acceptInviteMutation.isPending}
          >
            {acceptInviteMutation.isPending ? 'Accepting...' : 'Accept Invitation'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Active couple: show shared goals and partner info
  if (isActive) {
    // Calculate stats
    const safeGoals: SharedGoal[] = isSharedGoalArray(sharedGoals) ? sharedGoals : [];
    const totalSaved = safeGoals.length > 0 ? safeGoals.reduce((sum, g) => sum + (typeof g.currentAmount === 'number' ? g.currentAmount : parseFloat(g.currentAmount)), 0) : 0;
    
    const totalGoals = safeGoals.length;

    // Dummy partner for demo (replace with real partner info if available)
    const partnerEmail = couple && couple.members && couple.members.length > 1 ? couple.members.find((e: string) => e !== userEmail) : '';
    const partnerInitials = getInitials(partnerEmail || '');
    const userInitials = getInitials(userEmail || '');

    return (
      <Card className="mt-8 relative overflow-hidden">
        <CardHeader className="pb-4 border-b bg-gradient-to-r from-blue-50 to-emerald-50 rounded-t-lg relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Partner Avatars */}
              <div className="flex -space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow-lg">
                  {userInitials}
                </div>
                {partnerEmail && (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow-lg">
                    {partnerInitials}
                  </div>
                )}
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-blue-900">Couples Savings</CardTitle>
                <CardDescription className="mt-1 text-blue-700">
                  Saving together with your partner
                </CardDescription>
              </div>
            </div>
            {process.env.NODE_ENV !== 'production' && userEmail && (
              <div className="flex gap-2">
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          {/* Stats Row with animation */}
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.7 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 mt-6"
            >
              <div className="text-center p-4 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg shadow">
                <div className="text-2xl font-bold text-blue-700">£{totalSaved.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Saved Together</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-emerald-100 to-emerald-50 rounded-lg shadow">
                <div className="text-2xl font-bold text-emerald-700">£{monthlyContribution.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Monthly Contributions</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-blue-50 rounded-lg shadow">
                <div className="flex items-center justify-center gap-2 text-xl font-bold text-purple-700">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  {safeGoals.filter((g: SharedGoal) => {
                    // Use the same completion logic as CoupleGoalCard
                    const targetAmount = typeof g.targetAmount === 'number' ? g.targetAmount : parseFloat(g.targetAmount);
                    const currentAmount = typeof g.currentAmount === 'number' ? g.currentAmount : parseFloat(g.currentAmount);
                    const isCompleted = currentAmount >= targetAmount;
                    return isCompleted;
                  }).length}/{totalGoals}
                </div>
                <div className="text-sm text-gray-600">Goals Completed</div>
              </div>
            </motion.div>
          </AnimatePresence>
          {/* Add Goal Button */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex gap-2">
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-full shadow" onClick={() => setIsAddGoalOpen(true)}>
                <Plus className="h-5 w-5 mr-2" /> Add Shared Goal
              </Button>
            </motion.div>
          </div>
          {/* Shared Goals Grid with animation */}
          {loadingGoals ? (
            <div>Loading shared goals...</div>
          ) : errorGoals ? (
            <div>Error loading shared goals</div>
          ) : safeGoals && safeGoals.length > 0 ? (
            <>
              {/* Search/filter if >10 goals */}
              {safeGoals.length > 10 && (
                <div className="mb-4 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search goals..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ minWidth: 200 }}
                  />
                </div>
              )}
              {/* Toggle for completed goals */}
              <div className="mb-4 flex items-center gap-3">
                <button
                  className="px-4 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium border border-gray-200 hover:bg-gray-200 transition"
                  onClick={() => {
                    console.log('Toggle clicked! Current showCompleted:', showCompleted);
                    setShowCompleted(v => {
                      console.log('Setting showCompleted to:', !v);
                      return !v;
                    });
                  }}
                >
                  {showCompleted ? 'Hide Completed Goals' : 'Show Completed Goals'}
                </button>
              </div>
              {/* Active goals grid */}
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.12 } },
                }}
              >
                {(() => {
                  const filteredGoals = search
                    ? safeGoals.filter((g: SharedGoal) => g.title && g.title.toLowerCase().includes(search.toLowerCase()))
                    : safeGoals;
                  const activeGoals = filteredGoals.filter((g: SharedGoal) => {
                    // Use the same completion logic as CoupleGoalCard
                    const targetAmount = typeof g.targetAmount === 'number' ? g.targetAmount : parseFloat(g.targetAmount);
                    const currentAmount = typeof g.currentAmount === 'number' ? g.currentAmount : parseFloat(g.currentAmount);
                    const isCompleted = currentAmount >= targetAmount;
                    return !isCompleted;
                  });
                  return (
                    <>
                      {activeGoals.map((goal: SharedGoal) => (
                        <CoupleGoalCard
                          key={String(goal.id)}
                          goal={goal}
                          coupleId={coupleId}
                          userEmail={userEmail || ''}
                          partnerEmail={partnerEmail || ''}
                          couple={couple}
                          setEditGoalId={setEditGoalId}
                          setEditGoalTitle={setEditGoalTitle}
                          setEditGoalTarget={setEditGoalTarget}
                          setEditGoalCategory={setEditGoalCategory}
                          setEditGoalDeadline={setEditGoalDeadline}
                          setIsEditGoalOpen={setIsEditGoalOpen}
                          deleteGoalMutation={deleteGoalMutation}
                          contributeMutation={contributeMutation}
                          contributionInputs={contributionInputs}
                          setContributionInputs={setContributionInputs}
                        />
                      ))}
                    </>
                  );
                })()}
              </motion.div>
              {/* Completed goals section */}
              {(() => {
                const completedGoals = safeGoals.filter((g: SharedGoal) => {
                  // Use the same completion logic as CoupleGoalCard
                  const targetAmount = typeof g.targetAmount === 'number' ? g.targetAmount : parseFloat(g.targetAmount);
                  const currentAmount = typeof g.currentAmount === 'number' ? g.currentAmount : parseFloat(g.currentAmount);
                  const isCompleted = currentAmount >= targetAmount;
                  return isCompleted;
                });
                console.log('Completed goals check:', { showCompleted, completedGoalsCount: completedGoals.length, completedGoals });
                return showCompleted && completedGoals.length > 0;
              })() && (
                <div className="mt-10 transition-all duration-300">
                  <div className="mb-2 text-sm text-gray-400 font-semibold tracking-wide flex items-center gap-2">
                    <span role="img" aria-label="Completed">✅</span> Completed Goals
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                    {safeGoals.filter((g: SharedGoal) => {
                      // Use the same completion logic as CoupleGoalCard
                      const targetAmount = typeof g.targetAmount === 'number' ? g.targetAmount : parseFloat(g.targetAmount);
                      const currentAmount = typeof g.currentAmount === 'number' ? g.currentAmount : parseFloat(g.currentAmount);
                      const isCompleted = currentAmount >= targetAmount;
                      return isCompleted;
                    }).map((goal: SharedGoal) => (
                      <div className="opacity-70 grayscale transition-all duration-300" key={String(goal.id)}>
                        <CoupleGoalCard
                          goal={goal}
                          coupleId={coupleId}
                          userEmail={userEmail || ''}
                          partnerEmail={partnerEmail || ''}
                          couple={couple}
                          setEditGoalId={setEditGoalId}
                          setEditGoalTitle={setEditGoalTitle}
                          setEditGoalTarget={setEditGoalTarget}
                          setEditGoalCategory={setEditGoalCategory}
                          setEditGoalDeadline={setEditGoalDeadline}
                          setIsEditGoalOpen={setIsEditGoalOpen}
                          deleteGoalMutation={deleteGoalMutation}
                          contributeMutation={contributeMutation}
                          contributionInputs={contributionInputs}
                          setContributionInputs={setContributionInputs}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <motion.div
              className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Heart className="h-12 w-12 text-pink-200 mb-2 animate-bounce" />
              <p className="text-lg text-gray-500 font-semibold mb-1">No shared goals yet</p>
              <p className="text-sm text-gray-400">Create your first goal to start saving together</p>
            </motion.div>
          )}
          {/* Add/Edit Goal Dialogs remain unchanged */}
          {/* Edit Goal Dialog */}
          <Dialog open={isEditGoalOpen} onOpenChange={setIsEditGoalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Shared Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Goal Title"
                  value={editGoalTitle}
                  onChange={e => setEditGoalTitle(e.target.value)}
                />
                <Input
                  placeholder="Target Amount (£)"
                  type="number"
                  value={editGoalTarget}
                  onChange={e => setEditGoalTarget(e.target.value)}
                />
                <Select value={editGoalCategory} onValueChange={setEditGoalCategory}>
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
                <Input
                  placeholder="Target Date"
                  type="date"
                  value={editGoalDeadline}
                  onChange={e => setEditGoalDeadline(e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditGoalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      await (editGoalMutation.mutateAsync as any)({
                        coupleId,
                        goalId: editGoalId,
                        updates: {
                          title: editGoalTitle,
                          targetAmount: parseFloat(editGoalTarget),
                          category: editGoalCategory,
                          deadline: editGoalDeadline,
                        },
                      });
                      setIsEditGoalOpen(false);
                    }}
                    disabled={editGoalMutation.isPending || !editGoalTitle || !editGoalTarget || !editGoalCategory}
                  >
                    {editGoalMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {/* Add Goal Dialog */}
          <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Shared Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Goal Title"
                  value={goalTitle}
                  onChange={e => setGoalTitle(e.target.value)}
                />
                <Input
                  placeholder="Budget Amount (£)"
                  type="number"
                  value={goalTarget}
                  onChange={e => setGoalTarget(e.target.value)}
                />
                <div>
                  <Label>Deadline</Label>
                  <Calendar
                    mode="single"
                    selected={goalDeadline ? new Date(goalDeadline) : undefined}
                    onSelect={date => setGoalDeadline(date ? date.toLocaleDateString('en-CA') : '')}
                  />
                </div>
                <Select value={goalCategory} onValueChange={setGoalCategory}>
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
                {/* Invitees */}
                <div>
                  <Label>Invite People (optional)</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Enter email and press Add"
                      type="email"
                      value={inviteInput}
                      onChange={e => setInviteInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          if (isValidEmail(inviteInput) && !invitees.includes(inviteInput)) {
                            setInvitees([...invitees, inviteInput]);
                            setInviteInput('');
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (isValidEmail(inviteInput) && !invitees.includes(inviteInput)) {
                          setInvitees([...invitees, inviteInput]);
                          setInviteInput('');
                        }
                      }}
                      disabled={!isValidEmail(inviteInput) || invitees.includes(inviteInput)}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {invitees.map(email => (
                      <div key={email} className="flex items-center bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold">
                        <Avatar className="w-5 h-5 mr-1"><AvatarFallback>{getInitials(email)}</AvatarFallback></Avatar>
                        {email}
                        <button className="ml-2 text-blue-400 hover:text-red-500" onClick={() => setInvitees(invitees.filter(e => e !== email))}>&times;</button>
                      </div>
                    ))}
                  </div>
                </div>
                {addGoalError && <div className="text-red-500 text-sm">{addGoalError}</div>}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddGoalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      setAddGoalError('');
                      if (!goalTitle || !goalTarget || !goalDeadline) {
                        setAddGoalError('Please fill in all required fields.');
                        return;
                      }
                      if (isNaN(Number(goalTarget)) || Number(goalTarget) <= 0) {
                        setAddGoalError('Budget must be a positive number.');
                        return;
                      }
                      // Add goal
                      await (addGoalMutation.mutateAsync as any)({
                        coupleId,
                        goalData: {
                          title: goalTitle,
                          targetAmount: parseFloat(goalTarget),
                          category: goalCategory,
                          deadline: goalDeadline,
                        },
                      });
                      // Invite new people (not already in couple)
                      const currentMembers = couple?.members || [];
                      for (const email of invitees) {
                        if (!currentMembers.includes(email)) {
                          await (linkPartnerMutation.mutateAsync as any)({ userId: user?.uid, userEmail: userEmail || '', partnerEmail: email });
                        }
                      }
                      setIsAddGoalOpen(false);
                      setGoalTitle('');
                      setGoalTarget('');
                      setGoalCategory('');
                      setGoalDeadline('');
                      setInvitees([]);
                      setInviteInput('');
                    }}
                    disabled={addGoalMutation.isPending || !goalTitle || !goalTarget || !goalDeadline}
                  >
                    {addGoalMutation.isPending ? 'Adding...' : 'Add Goal'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  // Fallback
  return null;
}