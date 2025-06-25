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

export const createUserDocument = async (uid: string, email: string) => {
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
    
    const defaultData = createDefaultUserData(email);
    await setDoc(doc(db, 'users', uid), defaultData);
    console.log('User document created successfully');
    return defaultData;
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

// Account management functions
export const addAccountToUser = async (uid: string, account: any) => {
  try {
    console.log('addAccountToUser called with:', { uid, account });
    
    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timeout')), 5000)
    );
    
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
    
    console.log('Account added successfully');
    return account;
  } catch (error) {
    console.error('Error adding account:', error);
    throw error;
  }
};

export const removeAccountFromUser = async (uid: string, accountIndex: number) => {
  try {
    const userDoc = await getUserDocument(uid);
    const currentAccounts = userDoc?.accounts || [];
    
    if (accountIndex >= 0 && accountIndex < currentAccounts.length) {
      const updatedAccounts = currentAccounts.filter((_, index) => index !== accountIndex);
      
      await updateUserDocument(uid, {
        accounts: updatedAccounts
      });
      
      console.log('Account removed successfully');
      return true;
    } else {
      throw new Error('Invalid account index');
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