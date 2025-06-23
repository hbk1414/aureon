import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
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