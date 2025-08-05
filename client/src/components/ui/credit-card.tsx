import React from 'react';
import { Wifi } from 'lucide-react';

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
  // Format account number to show last 4 digits
  const formatAccountNumber = (number: string) => {
    const lastFour = number.slice(-4);
    return `**** **** **** ${lastFour}`;
  };

  // Format balance
  const formatBalance = (amount: number) => {
    return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className={`relative w-full max-w-sm mx-auto ${className}`}>
      <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
        {/* Wireless Icon - Top Right */}
        <div className="absolute top-4 right-4">
          <Wifi className="w-6 h-6 text-white/80" />
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
            <p className="text-lg font-bold">{formatBalance(balance)}</p>
          </div>
        </div>

        {/* Visa Logo - Bottom Right */}
        <div className="absolute bottom-4 right-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
            <span className="text-white font-bold text-sm tracking-wider">VISA</span>
          </div>
        </div>

        {/* Card Chip - Bottom Left */}
        <div className="absolute bottom-4 left-4">
          <div className="w-8 h-6 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-sm"></div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default CreditCard;