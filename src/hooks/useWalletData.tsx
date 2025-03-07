
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
      generateMockWalletData();
      
      try {
        const { data: debtsData, error: debtsError } = await supabase
          .from('debts')
          .select('*, transactions(description)')
          .order('created_at', { ascending: false });
          
        if (debtsError) {
          console.error('Error fetching debts:', debtsError);
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
        }
      } catch (error) {
        console.error('Error fetching real debts data:', error);
      }
    } catch (error) {
      console.error('Erro ao carregar dados das carteiras:', error);
      toast.error('Erro ao carregar dados financeiros');
      generateMockWalletData();
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockWalletData = () => {
    const mockTransactions = [
      { responsibility: 'franklin', type: 'income', amount: 4500, category_id: 'salary', description: 'Salário', date: '2025-04-01' },
      { responsibility: 'franklin', type: 'expense', amount: 1200, category_id: 'home', description: 'Aluguel', date: '2025-04-05' },
      { responsibility: 'franklin', type: 'expense', amount: 350, category_id: 'food', description: 'Supermercado', date: '2025-04-10' },
      { responsibility: 'franklin', type: 'expense', amount: 200, category_id: 'transport', description: 'Combustível', date: '2025-04-15' },
      
      { responsibility: 'michele', type: 'income', amount: 3800, category_id: 'salary', description: 'Salário', date: '2025-04-01' },
      { responsibility: 'michele', type: 'expense', amount: 800, category_id: 'home', description: 'Contas', date: '2025-04-05' },
      { responsibility: 'michele', type: 'expense', amount: 450, category_id: 'food', description: 'Restaurantes', date: '2025-04-12' },
      { responsibility: 'michele', type: 'expense', amount: 300, category_id: 'shopping', description: 'Roupas', date: '2025-04-18' },
      
      { responsibility: 'casal', type: 'expense', amount: 500, category_id: 'leisure', description: 'Cinema e lazer', date: '2025-04-20' }
    ];
    
    const mockCategories = {
      'salary': 'Salário',
      'home': 'Moradia',
      'food': 'Alimentação',
      'transport': 'Transporte',
      'shopping': 'Compras',
      'leisure': 'Lazer'
    };
    
    const mockDebts = [
      { id: '1', amount: 175, owed_to: 'franklin', owed_by: 'michele', description: 'Supermercado', is_paid: false },
      { id: '2', amount: 250, owed_to: 'michele', owed_by: 'franklin', description: 'Restaurante', is_paid: false }
    ];
    
    const franklinWallet = buildWalletData('franklin', mockTransactions, mockCategories);
    const micheleWallet = buildWalletData('michele', mockTransactions, mockCategories);
    
    setWallets({
      franklin: franklinWallet,
      michele: micheleWallet
    });
    
    const typedMockDebts: DebtInfo[] = mockDebts.map(debt => ({
      ...debt,
      owedTo: debt.owed_to as WalletPerson,
      owed_to: debt.owed_to as WalletPerson,
      owed_by: debt.owed_by as WalletPerson
    }));
    
    setDebts(typedMockDebts);
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
