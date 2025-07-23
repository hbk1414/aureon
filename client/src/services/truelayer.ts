// TrueLayer API service for fetching account and transaction data

interface TrueLayerAccount {
  account_id: string;
  account_type: string;
  display_name: string;
  currency: string;
  account_number?: {
    iban?: string;
    number?: string;
    sort_code?: string;
  };
  provider?: {
    display_name: string;
    logo_uri?: string;
    provider_id: string;
  };
}

interface TrueLayerTransaction {
  transaction_id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  transaction_type: string;
  transaction_category: string;
  transaction_classification?: string[];
  merchant_name?: string;
  running_balance?: {
    amount: number;
    currency: string;
  };
}

interface TrueLayerAccountsResponse {
  results: TrueLayerAccount[];
}

interface TrueLayerTransactionsResponse {
  results: TrueLayerTransaction[];
}

/**
 * Fetches all connected accounts from TrueLayer
 * @param token - Bearer token for authentication
 * @returns Promise with account data
 */
export async function fetchAccounts(token: string): Promise<TrueLayerAccountsResponse> {
  try {
    console.log('Fetching TrueLayer accounts...');
    
    const response = await fetch('https://api.truelayer.com/data/v1/accounts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch accounts: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as TrueLayerAccountsResponse;
    console.log('TrueLayer accounts response:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching TrueLayer accounts:', error);
    throw error;
  }
}

/**
 * Fetches transactions for a specific account from TrueLayer
 * @param token - Bearer token for authentication
 * @param accountId - The account ID to fetch transactions for
 * @returns Promise with transaction data
 */
export async function fetchTransactions(token: string, accountId: string): Promise<TrueLayerTransactionsResponse> {
  try {
    console.log(`Fetching TrueLayer transactions for account: ${accountId}`);
    
    const response = await fetch(`https://api.truelayer.com/data/v1/accounts/${accountId}/transactions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as TrueLayerTransactionsResponse;
    console.log(`TrueLayer transactions response for ${accountId}:`, data);
    
    return data;
  } catch (error) {
    console.error(`Error fetching TrueLayer transactions for ${accountId}:`, error);
    throw error;
  }
}

/**
 * Utility function to fetch all accounts and their transactions
 * @param token - Bearer token for authentication
 * @returns Promise with accounts and their transactions
 */
export async function fetchAccountsWithTransactions(token: string) {
  try {
    console.log('Fetching all TrueLayer data...');
    
    // First fetch all accounts
    const accountsData = await fetchAccounts(token);
    
    // Then fetch transactions for each account
    const accountsWithTransactions = await Promise.all(
      accountsData.results.map(async (account) => {
        try {
          const transactions = await fetchTransactions(token, account.account_id);
          return {
            ...account,
            transactions: transactions.results,
          };
        } catch (error) {
          console.error(`Failed to fetch transactions for account ${account.account_id}:`, error);
          return {
            ...account,
            transactions: [],
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );
    
    console.log('Complete TrueLayer data:', accountsWithTransactions);
    return accountsWithTransactions;
  } catch (error) {
    console.error('Error fetching complete TrueLayer data:', error);
    throw error;
  }
}