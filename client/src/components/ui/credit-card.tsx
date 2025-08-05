import React, { useState } from 'react';
import { Wifi } from 'lucide-react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

interface CreditCardProps {
  bankName: string;
  accountName: string;
  accountNumber: string;
  balance: number;
  accountType: string;
  className?: string;
}

const CreditCard: React.FC<CreditCardProps> = ({
  bankName,
  accountName,
  accountNumber,
  balance,
  accountType,
  className = ""
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Format account number to show last 4 digits
  const formatAccountNumber = (number: string) => {
    const lastFour = number.slice(-4);
    return `**** **** **** ${lastFour}`;
  };

  // Generate mock CVV and expiry for demo
  const mockCVV = "123";
  const mockExpiry = "12/28";

  return (
    <div className={`relative w-full max-w-sm mx-auto ${className}`}>
      <div 
        className="relative perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          className="relative w-full h-60 preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Front Side */}
          <div className="absolute inset-0 w-full h-full backface-hidden">
            <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-2xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_30px_rgba(0,0,0,0.15)] h-full">
              {/* Wireless Icon - Top Right */}
              <div className="absolute top-4 right-4">
                <Wifi className="w-6 h-6 text-white/80" />
              </div>

              {/* Visa Logo - Top Right Glass Badge */}
              <div className="absolute top-12 right-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 shadow-inner border border-white/30 transform transition-all duration-200 hover:bg-white/25">
                  <span className="text-white font-bold text-sm tracking-wider drop-shadow-sm">VISA</span>
                </div>
              </div>

              {/* Bank Name */}
              <div className="mb-8">
                <h3 className="text-lg font-bold tracking-wider">{bankName}</h3>
                <p className="text-sm text-white/80 capitalize">{accountType} Account</p>
              </div>

              {/* Account Number */}
              <div className="mb-6">
                <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Account Number</p>
                <p className="text-lg font-mono tracking-widest">{formatAccountNumber(accountNumber)}</p>
              </div>

              {/* Account Holder and Balance */}
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Account Holder</p>
                  <p className="text-sm font-semibold">{accountName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Balance</p>
                  <p className="text-lg font-bold">
                    <CountUp 
                      start={0}
                      end={balance} 
                      decimals={2} 
                      duration={2.5}
                      separator=","
                      prefix="£"
                      preserveValue={true}
                    />
                  </p>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-2xl pointer-events-none">
                {/* Animated circular background glow */}
                <motion.div 
                  className="absolute top-8 left-8 w-40 h-40 rounded-full blur-3xl bg-white/10"
                  animate={{
                    scale: isHovered ? 1.2 : 1,
                    x: isHovered ? 10 : 0,
                    y: isHovered ? -5 : 0,
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
            <div className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl p-6 text-white shadow-2xl h-full">
              {/* Magnetic Stripe */}
              <div className="absolute top-6 left-0 right-0 h-12 bg-black"></div>
              
              {/* CVV Section */}
              <div className="mt-16 mb-6">
                <div className="bg-white text-black p-2 rounded text-right font-mono text-sm">
                  <span className="text-xs text-gray-600">CVV</span><br/>
                  <span className="text-sm font-bold">{mockCVV}</span>
                </div>
              </div>

              {/* Expiry Date */}
              <div className="mb-4">
                <p className="text-xs text-gray-300 uppercase tracking-wide mb-1">Valid Thru</p>
                <p className="text-xl font-mono font-bold text-white">{mockExpiry}</p>
              </div>

              {/* Bank Info */}
              <div className="absolute bottom-6 left-6">
                <p className="text-sm font-semibold">{bankName}</p>
                <p className="text-xs text-gray-400">Customer Service: 0800 123 4567</p>
              </div>

              {/* Visa Logo */}
              <div className="absolute bottom-6 right-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                  <span className="text-white font-bold text-sm tracking-wider">VISA</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreditCard;