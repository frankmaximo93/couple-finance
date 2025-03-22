
import { useState, useEffect, useCallback } from 'react';
import { WalletData, DebtInfo, buildWalletData } from '@/utils/walletUtils';
import { WalletPerson, supabase, isSessionActive } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWalletData = (isActive: boolean, userId: string | undefined) => {
  const [wallets, setWallets] = useState<Record<string, WalletData>>({});
  const [debts, setDebts] = useState<DebtInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkedAccounts, setLinkedAccounts] = useState<Array<{ email: string, relationship: string }>>([]);
  const [showLinkedMessage, setShowLinkedMessage] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const isActive = await isSessionActive();
      setIsAuthenticated(isActive);
      console.log('Authentication status:', isActive ? 'Authenticated' : 'Not authenticated');
    };
    
    checkAuth();
  }, []);

  // Use useCallback to memoize the fetchWalletData function
  const fetchWalletData = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping data fetch');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Fetching wallet data...');
      
      // Try to fetch real transactions data
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*, categories(name)');
        
      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        toast.error('Erro ao carregar transações');
        setWallets({});
      } else {
        console.log(`Fetched ${transactionsData?.length || 0} transactions`);
        
        // Fetch categories for mapping
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name');
          
        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
        }
        
        // Create category mapping
        const categoryMap: {[key: string]: string} = {};
        if (categoriesData) {
          categoriesData.forEach((cat: any) => {
            categoryMap[cat.id] = cat.name;
          });
        }
        
        // Build wallet data from real transactions
        const franklinWallet = buildWalletData('franklin', transactionsData || [], categoryMap);
        const micheleWallet = buildWalletData('michele', transactionsData || [], categoryMap);
        
        setWallets({
          franklin: franklinWallet,
          michele: micheleWallet
        });
      }
      
      // Fetch real debts data
      try {
        const { data: debtsData, error: debtsError } = await supabase
          .from('debts')
          .select('*, transactions(description)')
          .order('created_at', { ascending: false });
          
        if (debtsError) {
          console.error('Error fetching debts:', debtsError);
          setDebts([]);
        } else if (debtsData && debtsData.length > 0) {
          console.log(`Fetched ${debtsData.length} debts`);
          
          const processedDebts: DebtInfo[] = debtsData.map((debt: any) => ({
            id: debt.id,
            amount: debt.amount,
            owedTo: debt.owed_to as WalletPerson,
            owed_to: debt.owed_to as WalletPerson,
            owed_by: debt.owed_by as WalletPerson,
            description: debt.transactions?.description || 'Dívida',
            is_paid: debt.is_paid
          }));
          
          setDebts(processedDebts);
        } else {
          console.log('No debts found');
          setDebts([]);
        }
      } catch (debtError) {
        console.error('Error in debt fetching process:', debtError);
        setDebts([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados das carteiras:', error);
      toast.error('Erro ao carregar dados financeiros');
      setWallets({});
      setDebts([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchLinkedAccounts = async () => {
    if (!isAuthenticated || !userId) {
      console.log('Not authenticated or no userId, skipping linked accounts fetch');
      return;
    }
    
    try {
      try {
        const { data, error } = await supabase.rpc('get_linked_users');
        
        if (error) {
          console.error('Error fetching linked accounts:', error);
          
          if (error.message.includes('Could not find the function')) {
            const { data: relationships, error: relError } = await supabase
              .from('user_relationships')
              .select('*')
              .eq('user_id', userId);
              
            if (!relError && relationships && relationships.length > 0) {
              setLinkedAccounts([
                { email: 'usuário vinculado', relationship: 'spouse' }
              ]);
              setShowLinkedMessage(false);
              return;
            }
          }
        }
        
        if (data && Array.isArray(data)) {
          setLinkedAccounts(data);
          console.log('Linked accounts:', data);
          setShowLinkedMessage(data.length === 0);
        } else {
          setShowLinkedMessage(true);
        }
      } catch (error) {
        console.error('Error with RPC call:', error);
        setShowLinkedMessage(true);
      }
    } catch (error) {
      console.error('Error loading linked accounts:', error);
      setShowLinkedMessage(true);
    }
  };

  useEffect(() => {
    if (isActive && isAuthenticated && userId) {
      fetchLinkedAccounts();
      fetchWalletData();
      
      // Set up real-time subscription for transactions
      const transactionsSubscription = supabase
        .channel('transactions_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'transactions' }, 
          () => {
            console.log('Transactions updated, refreshing wallet data');
            fetchWalletData();
          }
        )
        .subscribe();
        
      // Set up real-time subscription for debts
      const debtsSubscription = supabase
        .channel('debts_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'debts' }, 
          () => {
            console.log('Debts updated, refreshing wallet data');
            fetchWalletData();
          }
        )
        .subscribe();
        
      return () => {
        transactionsSubscription.unsubscribe();
        debtsSubscription.unsubscribe();
      };
    }
  }, [isActive, userId, isAuthenticated, fetchWalletData]);

  const handlePayDebt = async (debtId: string) => {
    if (!isAuthenticated) {
      toast.error('Você precisa estar conectado para realizar esta ação');
      return;
    }
    
    try {
      try {
        const { error } = await supabase
          .from('debts')
          .update({ is_paid: true })
          .eq('id', debtId);
          
        if (error) {
          console.error('Error updating debt in database:', error);
          throw error;
        }
      } catch (dbError) {
        console.error('Error with Supabase operation:', dbError);
        throw dbError;
      }
      
      // Update local state
      setDebts(debts.map(debt => 
        debt.id === debtId ? { ...debt, is_paid: true } : debt
      ));
      
      toast.success('Dívida marcada como paga!');
      
      // Refresh wallet data to reflect the changes
      fetchWalletData();
    } catch (error) {
      console.error('Erro ao pagar dívida:', error);
      toast.error('Erro ao atualizar status da dívida');
    }
  };

  // Add the refreshWallets function
  const refreshWallets = () => {
    console.log('Refreshing wallet data...');
    fetchWalletData();
  };

  return {
    wallets,
    debts,
    isLoading,
    linkedAccounts,
    showLinkedMessage,
    handlePayDebt,
    refreshWallets,
    isAuthenticated
  };
};
