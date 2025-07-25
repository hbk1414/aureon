import { 
  collection, 
  doc, 
  setDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch,
  increment
} from "firebase/firestore";
import { db } from "./firebase";
import type { 
  ConnectedAccount, 
  Transaction, 
  FinancialGoal, 
  AiTask,
  DebtAccount,
  InvestingAccount 
} from "@shared/schema";

// Connected Accounts
export const createConnectedAccount = async (userId: string, account: Omit<ConnectedAccount, 'id' | 'lastSync'>) => {
  const docRef = await addDoc(collection(db, "connectedAccounts"), {
    ...account,
    userId,
    lastSync: Timestamp.now(),
  });
  return docRef.id;
};

export const getConnectedAccounts = async (userId: string) => {
  const q = query(
    collection(db, "connectedAccounts"),
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    lastSync: doc.data().lastSync?.toDate() || new Date(),
  })) as ConnectedAccount[];
};

export const updateAccountBalance = async (accountId: string, balance: string) => {
  await updateDoc(doc(db, "connectedAccounts", accountId), {
    balance,
    lastSync: Timestamp.now(),
  });
};

// Transactions
export const createTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>) => {
  const docRef = await addDoc(collection(db, "transactions"), {
    ...transaction,
    userId,
  });
  return docRef.id;
};

export const getTransactions = async (userId: string, limitCount = 50) => {
  const q = query(
    collection(db, "transactions"),
    where("userId", "==", userId),
    orderBy("date", "desc"),
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate() || new Date(),
  })) as Transaction[];
};

// Financial Goals
export const createFinancialGoal = async (userId: string, goal: Omit<FinancialGoal, 'id'>) => {
  const docRef = await addDoc(collection(db, "financialGoals"), {
    ...goal,
    userId,
  });
  return docRef.id;
};

export const getFinancialGoals = async (userId: string) => {
  const q = query(
    collection(db, "financialGoals"),
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    deadline: doc.data().deadline?.toDate() || null,
  })) as FinancialGoal[];
};

export const updateFinancialGoal = async (goalId: string, updates: Partial<FinancialGoal>) => {
  await updateDoc(doc(db, "financialGoals", goalId), updates);
};

// AI Tasks
export const createAiTask = async (userId: string, task: Omit<AiTask, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, "aiTasks"), {
    ...task,
    userId,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getAiTasks = async (userId: string, completed?: boolean) => {
  let q = query(
    collection(db, "aiTasks"),
    where("userId", "==", userId)
  );
  
  if (completed !== undefined) {
    q = query(q, where("completed", "==", completed));
  }
  
  q = query(q, orderBy("createdAt", "desc"));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    dueDate: doc.data().dueDate?.toDate() || null,
  })) as AiTask[];
};

export const completeAiTask = async (taskId: string) => {
  await updateDoc(doc(db, "aiTasks", taskId), {
    completed: true,
    completedAt: Timestamp.now(),
  });
};

// Debt Accounts
export const createDebtAccount = async (userId: string, debt: Omit<DebtAccount, 'id'>) => {
  const docRef = await addDoc(collection(db, "debtAccounts"), {
    ...debt,
    userId,
  });
  return docRef.id;
};

export const getDebtAccounts = async (userId: string) => {
  const q = query(
    collection(db, "debtAccounts"),
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as DebtAccount[];
};

// Investing Account
export const createInvestingAccount = async (userId: string, investing: Omit<InvestingAccount, 'id'>) => {
  const docRef = await addDoc(collection(db, "investingAccounts"), {
    ...investing,
    userId,
  });
  return docRef.id;
};

export const getInvestingAccount = async (userId: string) => {
  const q = query(
    collection(db, "investingAccounts"),
    where("userId", "==", userId),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  const docs = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as InvestingAccount[];
  
  return docs.length > 0 ? docs[0] : null;
};

export const updateInvestingAccount = async (accountId: string, updates: Partial<InvestingAccount>) => {
  await updateDoc(doc(db, "investingAccounts", accountId), updates);
};

// Round-up transactions
export const createRoundUpTransaction = async (userId: string, roundUpData: {
  merchant: string;
  amountSpent: number;
  roundUp: number;
  category: string;
  date: Date;
}) => {
  const docRef = await addDoc(collection(db, "users", userId, "roundUps"), {
    ...roundUpData,
    invested: false,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getRoundUpTransactions = async (userId: string) => {
  const q = query(
    collection(db, "users", userId, "roundUps"),
    orderBy("date", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate() || new Date(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  }));
};

export const markRoundUpsAsInvested = async (userId: string, roundUpIds: string[]) => {
  try {
    const batch = writeBatch(db);
    
    for (const id of roundUpIds) {
      const roundUpRef = doc(db, "users", userId, "roundUps", id);
      // Use set with merge to ensure document exists
      batch.set(roundUpRef, { invested: true }, { merge: true });
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking round-ups as invested:', error);
    throw error;
  }
};

// Fund investments
export const getFundInvestments = async (userId: string) => {
  const docRef = doc(db, "users", userId, "settings", "fundInvestments");
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    // Return default fund investments
    return { ftse100: 15.43, global: 22.17, tech: 8.92 };
  }
};

export const updateFundInvestments = async (userId: string, fundInvestments: Record<string, number>) => {
  const docRef = doc(db, "users", userId, "settings", "fundInvestments");
  await setDoc(docRef, fundInvestments, { merge: true });
};

export const addToFundInvestment = async (userId: string, fundId: string, amount: number) => {
  try {
    const docRef = doc(db, "users", userId, "settings", "fundInvestments");
    
    // First try to get the document to see if it exists
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Document exists, use increment
      await updateDoc(docRef, {
        [fundId]: increment(amount)
      });
    } else {
      // Document doesn't exist, create it with initial value
      await setDoc(docRef, {
        [fundId]: amount
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error adding to fund investment:', error);
    throw error;
  }
};

// Round-up settings
export const getRoundUpSettings = async (userId: string) => {
  const docRef = doc(db, "users", userId, "settings", "roundUp");
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return { enabled: true };
  }
};

export const updateRoundUpSettings = async (userId: string, settings: { enabled: boolean }) => {
  const docRef = doc(db, "users", userId, "settings", "roundUp");
  await setDoc(docRef, settings, { merge: true });
};

// Emergency Fund Contributions
export const addEmergencyFundContribution = async (userId: string, amount: number) => {
  const docRef = await addDoc(collection(db, "users", userId, "emergencyFundContributions"), {
    amount,
    date: Timestamp.now(),
  });
  return docRef.id;
};

export const getEmergencyFundContributions = async (userId: string) => {
  const q = query(
    collection(db, "users", userId, "emergencyFundContributions"),
    orderBy("date", "asc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate() || new Date(),
  }));
};

// Default user data structure
const createDefaultUserData = (email: string) => ({
  email,
  creditScore: 720,
  savingsRate: 15, // 15% savings rate
  monthlyBudget: 3000,
  totalSpent: 0,
  emergencyFund: {
    currentAmount: 0,
    targetAmount: 15000,
    monthsOfExpenses: 0,
    targetMonths: 6,
    monthlyContribution: 500 // Default £500 monthly contribution
  },
  accounts: [],
  aiTasks: [
    {
      id: 1,
      title: "Set up emergency fund auto-transfer",
      description: "Automatically transfer £500 monthly to emergency savings to reach your 6-month goal",
      completed: false,
      priority: "high",
      category: "savings",
      createdAt: serverTimestamp()
    },
    {
      id: 2,
      title: "Review monthly budget allocation",
      description: "Optimize your £3,000 monthly budget to increase savings rate",
      completed: false,
      priority: "medium", 
      category: "budgeting",
      createdAt: serverTimestamp()
    }
  ],
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});

export const createUserDocument = async (uid: string, userData: any) => {
  try {
    // Check if document already exists with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 2000)
    );
    
    const existingDoc = await Promise.race([
      getUserDocument(uid),
      timeoutPromise
    ]);
    
    if (existingDoc) {
      console.log('User document already exists');
      return existingDoc;
    }
    
    // Use provided userData or default data
    const dataToSave = userData || createDefaultUserData(userData.email || '');
    await setDoc(doc(db, 'users', uid), {
      ...dataToSave,
      createdAt: serverTimestamp(),
    });
    console.log('User document created successfully');
    return dataToSave;
  } catch (error) {
    console.error('Error creating user document:', error);
    // Don't throw error, just log it to prevent auth flow interruption
    return null;
  }
};

export const getUserDocument = async (uid: string) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log('No user document found');
      return null;
    }
  } catch (error) {
    console.error('Error getting user document:', error);
    // Don't throw error, return null to allow fallback
    return null;
  }
};

export const updateUserDocument = async (uid: string, updates: any) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('User document updated successfully');
  } catch (error) {
    console.error('Error updating user document:', error);
    throw error;
  }
};

export const getOrCreateUserDocument = async (uid: string, email: string) => {
  try {
    let userData = await getUserDocument(uid);
    
    if (!userData) {
      // Create new user document with defaults
      userData = await createUserDocument(uid, email);
    }
    
    return userData;
  } catch (error) {
    console.error('Error getting or creating user document:', error);
    throw error;
  }
};

// Local storage fallback for when Firestore is unavailable
const getLocalAccounts = (uid: string): any[] => {
  try {
    const stored = localStorage.getItem(`accounts_${uid}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading local accounts:', error);
    return [];
  }
};

const setLocalAccounts = (uid: string, accounts: any[]): void => {
  try {
    localStorage.setItem(`accounts_${uid}`, JSON.stringify(accounts));
  } catch (error) {
    console.error('Error saving local accounts:', error);
  }
};

const getLocalTransactions = (uid: string): any[] => {
  try {
    const stored = localStorage.getItem(`transactions_${uid}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading local transactions:', error);
    return [];
  }
};

const setLocalTransactions = (uid: string, transactions: any[]): void => {
  try {
    localStorage.setItem(`transactions_${uid}`, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving local transactions:', error);
  }
};

// Generate realistic spending transactions for connected accounts
const generateSpendingTransactions = (accounts: any[]): any[] => {
  const transactions: any[] = [];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Sample transaction templates with realistic UK spending
  const transactionTemplates = [
    { merchant: 'Tesco Express', category: 'Groceries', amount: 15.47 },
    { merchant: 'Sainsbury\'s', category: 'Groceries', amount: 42.18 },
    { merchant: 'ASDA', category: 'Groceries', amount: 38.92 },
    { merchant: 'Shell', category: 'Transport', amount: 65.00 },
    { merchant: 'BP', category: 'Transport', amount: 58.45 },
    { merchant: 'TfL', category: 'Transport', amount: 12.50 },
    { merchant: 'McDonald\'s', category: 'Dining', amount: 8.99 },
    { merchant: 'Nando\'s', category: 'Dining', amount: 24.50 },
    { merchant: 'Costa Coffee', category: 'Dining', amount: 4.85 },
    { merchant: 'Amazon', category: 'Shopping', amount: 29.99 },
    { merchant: 'ASOS', category: 'Shopping', amount: 67.50 },
    { merchant: 'John Lewis', category: 'Shopping', amount: 89.00 },
    { merchant: 'Netflix', category: 'Entertainment', amount: 15.99 },
    { merchant: 'Spotify', category: 'Entertainment', amount: 9.99 },
    { merchant: 'Vue Cinema', category: 'Entertainment', amount: 12.50 },
    { merchant: 'British Gas', category: 'Utilities', amount: 78.50 },
    { merchant: 'Thames Water', category: 'Utilities', amount: 45.20 },
    { merchant: 'EE Mobile', category: 'Utilities', amount: 35.00 }
  ];

  accounts.forEach((account, accountIndex) => {
    // Generate 15-25 transactions per account for this month
    const numTransactions = Math.floor(Math.random() * 11) + 15;
    
    for (let i = 0; i < numTransactions; i++) {
      const template = transactionTemplates[Math.floor(Math.random() * transactionTemplates.length)];
      const day = Math.floor(Math.random() * 25) + 1; // Days 1-25 of current month
      const transactionDate = new Date(currentYear, currentMonth, day);
      
      // Add some variation to amounts (±20%)
      const variation = (Math.random() * 0.4) - 0.2; // -20% to +20%
      const amount = Math.round((template.amount * (1 + variation)) * 100) / 100;
      
      transactions.push({
        id: `tx_${accountIndex}_${i}_${Date.now()}`,
        accountId: accountIndex + 1,
        amount: -amount, // Negative for spending
        category: template.category,
        merchant: template.merchant,
        description: template.merchant,
        date: transactionDate.toISOString(),
        roundUp: Math.round((Math.ceil(amount) - amount) * 100) / 100
      });
    }
  });

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Account management functions
export const addAccountToUser = async (uid: string, account: any) => {
  try {
    console.log('addAccountToUser called with:', { uid, account });
    
    // Try Firestore first with shorter timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firestore timeout')), 2000)
    );
    
    try {
      const getUserPromise = getUserDocument(uid);
      const userDoc = await Promise.race([getUserPromise, timeoutPromise]);
      console.log('Retrieved user document:', userDoc);
      
      const currentAccounts = userDoc?.accounts || [];
      console.log('Current accounts:', currentAccounts);
      
      const updatedAccounts = [...currentAccounts, account];
      console.log('Updated accounts:', updatedAccounts);
      
      const updatePromise = updateUserDocument(uid, {
        accounts: updatedAccounts
      });
      
      await Promise.race([updatePromise, timeoutPromise]);
      
      console.log('Account added successfully to Firestore');
      
      // Also save to local storage as backup
      setLocalAccounts(uid, updatedAccounts);
      
      return account;
    } catch (firestoreError) {
      console.warn('Firestore failed, using local storage fallback:', firestoreError);
      
      // Fallback to local storage
      const currentAccounts = getLocalAccounts(uid);
      console.log('Current local accounts:', currentAccounts);
      
      const updatedAccounts = [...currentAccounts, account];
      setLocalAccounts(uid, updatedAccounts);
      
      // Save account immediately first
      setLocalAccounts(uid, updatedAccounts);
      
      // Generate spending transactions in background
      setTimeout(() => {
        const existingTransactions = getLocalTransactions(uid);
        const newTransactions = generateSpendingTransactions([account]);
        const allTransactions = [...existingTransactions, ...newTransactions];
        setLocalTransactions(uid, allTransactions);
        console.log('Generated transactions:', newTransactions.length);
      }, 100); // Small delay to ensure account appears first
      
      console.log('Account added successfully to local storage');
      return account;
    }
  } catch (error) {
    console.error('Error adding account:', error);
    throw error;
  }
};

export const removeAccountFromUser = async (uid: string, accountIndex: number) => {
  try {
    // Try Firestore first with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firestore timeout')), 2000)
    );
    
    try {
      const userDoc = await Promise.race([getUserDocument(uid), timeoutPromise]);
      const currentAccounts = userDoc?.accounts || [];
      
      if (accountIndex >= 0 && accountIndex < currentAccounts.length) {
        const updatedAccounts = currentAccounts.filter((_, index) => index !== accountIndex);
        
        await Promise.race([
          updateUserDocument(uid, { accounts: updatedAccounts }),
          timeoutPromise
        ]);
        
        // Also update local storage
        setLocalAccounts(uid, updatedAccounts);
        
        // Remove associated transactions from local storage
        const localTransactions = getLocalTransactions(uid);
        const filteredTransactions = localTransactions.filter(tx => tx.accountId !== accountIndex + 1);
        setLocalTransactions(uid, filteredTransactions);
        
        console.log('Account removed successfully from Firestore');
        return true;
      } else {
        throw new Error('Invalid account index');
      }
    } catch (firestoreError) {
      console.warn('Firestore failed, using local storage fallback:', firestoreError);
      
      // Fallback to local storage
      const currentAccounts = getLocalAccounts(uid);
      
      if (accountIndex >= 0 && accountIndex < currentAccounts.length) {
        const updatedAccounts = currentAccounts.filter((_, index) => index !== accountIndex);
        setLocalAccounts(uid, updatedAccounts);
        
        // Remove associated transactions from local storage
        const localTransactions = getLocalTransactions(uid);
        const filteredTransactions = localTransactions.filter(tx => tx.accountId !== accountIndex + 1);
        setLocalTransactions(uid, filteredTransactions);
        
        console.log('Account removed successfully from local storage');
        return true;
      } else {
        throw new Error('Invalid account index');
      }
    }
  } catch (error) {
    console.error('Error removing account:', error);
    throw error;
  }
};

// User Profile
export const createUserProfile = async (userId: string, profile: any) => {
  await updateDoc(doc(db, "users", userId), profile);
};

export const getUserProfile = async (userId: string) => {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

// Round-up management functions
export async function updateRoundUpSetting(userId: string, enabled: boolean) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      roundUpEnabled: enabled,
      updatedAt: new Date()
    });
    console.log(`Round-up setting updated to: ${enabled}`);
    return true;
  } catch (error) {
    console.error('Error updating round-up setting:', error);
    // Store in localStorage as fallback
    localStorage.setItem(`roundUpEnabled_${userId}`, enabled.toString());
    return false;
  }
}

export async function addRoundUpTransaction(userId: string, roundUpData: {
  merchant: string;
  amountSpent: number;
  roundUp: number;
  date: string;
  category: string;
}) {
  try {
    const roundUpsRef = collection(db, 'users', userId, 'roundUps');
    await addDoc(roundUpsRef, {
      ...roundUpData,
      createdAt: new Date(),
      invested: false
    });
    console.log('Round-up transaction added to Firestore');
    return true;
  } catch (error) {
    console.error('Error adding round-up transaction:', error);
    // Store in localStorage as fallback
    const existing = JSON.parse(localStorage.getItem(`roundUps_${userId}`) || '[]');
    existing.push({
      ...roundUpData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      invested: false
    });
    localStorage.setItem(`roundUps_${userId}`, JSON.stringify(existing));
    return false;
  }
}

export async function investRoundUps(userId: string, totalAmount: number) {
  try {
    const batch = writeBatch(db);
    
    // Update user's total invested amount
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, {
      totalInvested: increment(totalAmount),
      lastInvestmentDate: new Date()
    });
    
    // Mark all uninvested round-ups as invested
    const roundUpsRef = collection(db, 'users', userId, 'roundUps');
    const q = query(roundUpsRef, where('invested', '==', false));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, { invested: true, investedAt: new Date() });
    });
    
    await batch.commit();
    console.log(`Invested £${totalAmount} from round-ups`);
    return true;
  } catch (error) {
    console.error('Error investing round-ups:', error);
    // Fallback to localStorage
    const existing = JSON.parse(localStorage.getItem(`roundUps_${userId}`) || '[]');
    const updated = existing.map((roundUp: any) => ({
      ...roundUp,
      invested: true,
      investedAt: new Date().toISOString()
    }));
    localStorage.setItem(`roundUps_${userId}`, JSON.stringify(updated));
    
    // Update total invested in localStorage
    const currentInvested = parseFloat(localStorage.getItem(`totalInvested_${userId}`) || '0');
    localStorage.setItem(`totalInvested_${userId}`, (currentInvested + totalAmount).toString());
    return false;
  }
}

export async function getUserRoundUps(userId: string, limit: number = 10) {
  try {
    const roundUpsRef = collection(db, 'users', userId, 'roundUps');
    const q = query(
      roundUpsRef, 
      where('invested', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return results.slice(0, limit);
  } catch (error) {
    console.error('Error getting round-ups from Firestore:', error);
    // Fallback to localStorage
    const existing = JSON.parse(localStorage.getItem(`roundUps_${userId}`) || '[]');
    return existing.filter((roundUp: any) => !roundUp.invested).slice(0, limit);
  }
}

export async function getRoundUpSetting(userId: string): Promise<boolean> {
  try {
    const userDoc = await getUserDocument(userId);
    return userDoc?.roundUpEnabled ?? true; // Default to enabled
  } catch (error) {
    console.error('Error getting round-up setting:', error);
    // Fallback to localStorage
    const stored = localStorage.getItem(`roundUpEnabled_${userId}`);
    return stored ? stored === 'true' : true;
  }
}

// Couples Firestore utilities
export async function linkPartnerByEmail(userId, userEmail, partnerEmail) {
  // Create a pending couple doc
  const couplesRef = collection(db, 'couples');
  const docRef = await addDoc(couplesRef, {
    members: [userEmail],
    invitedEmail: partnerEmail,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export async function acceptPartnerInvite(userId, userEmail, coupleId) {
  // Add user to members, set status to active, clear invitedEmail
  const coupleRef = doc(db, 'couples', coupleId);
  const coupleSnap = await getDoc(coupleRef);
  if (!coupleSnap.exists()) throw new Error('Couple not found');
  const data = coupleSnap.data();
  const members = Array.from(new Set([...(data.members || []), userEmail]));
  await updateDoc(coupleRef, {
    members,
    status: 'active',
    invitedEmail: '',
    updatedAt: new Date(),
  });
}

export async function addSharedGoal(coupleId, goalData) {
  const goalsRef = collection(db, 'couples', coupleId, 'sharedGoals');
  const docRef = await addDoc(goalsRef, {
    ...goalData,
    createdAt: new Date(),
    updatedAt: new Date(),
    isCompleted: false,
    currentAmount: 0,
  });
  return docRef.id;
}

export async function editSharedGoal(coupleId, goalId, updates) {
  const goalRef = doc(db, 'couples', coupleId, 'sharedGoals', goalId);
  await updateDoc(goalRef, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteSharedGoal(coupleId, goalId) {
  const goalRef = doc(db, 'couples', coupleId, 'sharedGoals', goalId);
  await deleteDoc(goalRef);
}

// Add a contribution to a goal (with user info)
export async function contributeToGoal(coupleId, goalId, amount, userEmail) {
  const goalRef = doc(db, 'couples', coupleId, 'sharedGoals', goalId);
  // Add to contributions subcollection
  const contribRef = collection(db, 'couples', coupleId, 'sharedGoals', goalId, 'contributions');
  await addDoc(contribRef, {
    userEmail,
    amount,
    createdAt: new Date(),
  });
  // Update currentAmount for fast reads
  await updateDoc(goalRef, {
    currentAmount: increment(amount),
    updatedAt: new Date(),
  });
}

// Fetch all contributions for a goal
export async function getGoalContributions(coupleId, goalId) {
  const contribRef = collection(db, 'couples', coupleId, 'sharedGoals', goalId, 'contributions');
  const snap = await getDocs(contribRef);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getCoupleDataByUserEmail(userEmail) {
  // Find couple where invitedEmail == userEmail or members array contains userEmail
  const couplesRef = collection(db, 'couples');
  const q1 = query(couplesRef, where('invitedEmail', '==', userEmail));
  const q2 = query(couplesRef, where('members', 'array-contains', userEmail));
  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  const results = [];
  snap1.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
  snap2.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
  // Remove duplicates
  const unique = results.filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i);
  return unique;
}

export async function getSharedGoals(coupleId) {
  const goalsRef = collection(db, 'couples', coupleId, 'sharedGoals');
  const snap = await getDocs(goalsRef);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// DEV ONLY: Create a dummy couple and shared goal for testing
export async function createDummyCoupleWithGoal(userEmail) {
  const couplesRef = collection(db, 'couples');
  const coupleDoc = await addDoc(couplesRef, {
    members: [userEmail],
    invitedEmail: '',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const goalsRef = collection(db, 'couples', coupleDoc.id, 'sharedGoals');
  await addDoc(goalsRef, {
    title: 'Test Goal',
    targetAmount: 1000,
    currentAmount: 200,
    category: 'vacation',
    deadline: '2024-12-31',
    createdAt: new Date(),
    updatedAt: new Date(),
    isCompleted: false,
  });
  return coupleDoc.id;
}

