import { Bot, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import CountUp from "react-countup";

interface WelcomeBannerProps {
  user: {
    firstName: string;
  };
  portfolio: {
    totalBalance: number;
  };
}

export default function WelcomeBanner({ user, portfolio }: WelcomeBannerProps) {
  // Determine greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  
  return (
    <motion.div 
      className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-[0_12px_40px_rgb(0,0,0,0.15)] border-0 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
      <motion.div 
        className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      ></motion.div>
      <motion.div 
        className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      ></motion.div>
      
      <div className="relative z-10 flex items-center justify-between">
        <motion.div 
          className="flex items-start space-x-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <motion.div 
            className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20 shadow-[0_4px_12px_rgb(0,0,0,0.1)]"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Bot className="h-7 w-7 text-white" />
          </motion.div>
          <div>
            <motion.h2 
              className="text-xl font-bold mb-3 flex items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            >
              {getGreeting()}, {user.firstName}!
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="h-6 w-6 ml-3 text-yellow-300" />
              </motion.div>
            </motion.h2>
            <motion.p 
              className="text-md text-white/90 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            >
              Your AI agent suggests 3 ways to optimise your finances today.
            </motion.p>
            <motion.p 
              className="text-sm uppercase tracking-wide text-white/70"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
            >
              Ready to boost your wealth strategy?
            </motion.p>
          </div>
        </motion.div>
        <motion.div 
          className="text-right bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm shadow-[0_8px_25px_rgb(0,0,0,0.1)] hover:bg-white/15 transition-all duration-300 hover:scale-105"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <TrendingUp className="h-5 w-5 text-green-300" />
            </motion.div>
            <span className="text-sm uppercase tracking-wide text-white/80 font-medium">Total Portfolio</span>
          </div>
          <motion.div 
            className="text-4xl font-bold text-white drop-shadow-sm"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 1, ease: "easeOut" }}
          >
            £<CountUp 
              end={portfolio.totalBalance} 
              duration={2.5} 
              separator="," 
              decimals={0}
              useEasing={true}
              start={0}
            />
          </motion.div>
          <div className="text-sm uppercase tracking-wide text-white/70 mt-1">
            Last updated today
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
