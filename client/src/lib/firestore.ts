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
  serverTimestamp
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

