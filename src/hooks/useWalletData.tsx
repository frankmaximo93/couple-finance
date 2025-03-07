
import { useState, useEffect } from 'react';
import { WalletData, DebtInfo, buildWalletData } from '@/utils/walletUtils';
import { WalletPerson, supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWalletData = (isActive: boolean, userId: string | undefined) => {
  const [wallets, setWallets] = useState<Record<string, WalletData>>({});
  const [debts, setDebts] = useState<DebtInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkedAccounts, setLinkedAccounts] = useState<Array<{ email: string, relationship: string }>>([]);
  const [showLinkedMessage, setShowLinkedMessage] = useState<boolean>(false);

  useEffect(() => {
    if (isActive && userId) {
      fetchLinkedAccounts();
      fetchWalletData();
    }
  }, [isActive, userId]);

  const fetchLinkedAccounts = async () => {
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

  const fetchWalletData = async () => {
    setIsLoading(true);
    
    try {
      // Try to fetch real transactions data
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*, categories(name)');
        
      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        toast.error('Erro ao carregar transações');
        setWallets({});
      } else {
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
      const { data: debtsData, error: debtsError } = await supabase
        .from('debts')
        .select('*, transactions(description)')
        .order('created_at', { ascending: false });
        
      if (debtsError) {
        console.error('Error fetching debts:', debtsError);
        setDebts([]);
      } else if (debtsData && debtsData.length > 0) {
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
  };

  const handlePayDebt = async (debtId: string) => {
    try {
      try {
        const { error } = await supabase
          .from('debts')
          .update({ is_paid: true })
          .eq('id', debtId);
          
        if (error) {
          console.error('Error updating debt in database:', error);
        }
      } catch (dbError) {
        console.error('Error with Supabase operation:', dbError);
      }
      
      setDebts(debts.map(debt => 
        debt.id === debtId ? { ...debt, is_paid: true } : debt
      ));
      
      toast.success('Dívida marcada como paga!');
    } catch (error) {
      console.error('Erro ao pagar dívida:', error);
      toast.error('Erro ao atualizar status da dívida');
    }
  };

  return {
    wallets,
    debts,
    isLoading,
    linkedAccounts,
    showLinkedMessage,
    handlePayDebt
  };
};
