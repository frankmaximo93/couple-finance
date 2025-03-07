
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category_id?: string;
  category_name?: string;
};

type WalletStatementProps = {
  owner: string;
  walletId?: string;
};

export const WalletStatement = ({ owner, walletId }: WalletStatementProps) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, owner]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      // Try to fetch real data from Supabase
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('responsibility', owner.toLowerCase())
        .order('date', { ascending: false });
        
      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        generateMockTransactions();
      } else if (transactionsData && transactionsData.length > 0) {
        const processedTransactions = transactionsData.map((transaction: any) => ({
          id: transaction.id,
          description: transaction.description,
          amount: transaction.amount,
          date: transaction.date,
          type: transaction.type,
          category_id: transaction.category_id,
          category_name: transaction.categories?.name || 'Sem categoria'
        }));
        
        setTransactions(processedTransactions);
      } else {
        // If no data or empty result, generate mock data
        generateMockTransactions();
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast.error('Erro ao carregar dados de transações');
      generateMockTransactions();
    } finally {
      setIsLoading(false);
    }
  };

  // Define the category map for mock data
  const categoryMap: Record<string, string> = {
    'salary': 'Salário',
    'home': 'Moradia',
    'food': 'Alimentação',
    'transport': 'Transporte',
    'shopping': 'Compras',
    'leisure': 'Lazer'
  };

  const generateMockTransactions = () => {
    const mockTransactions = [
      { id: '1', description: 'Salário', amount: 4500, date: '2025-04-01', type: 'income', category_id: 'salary' },
      { id: '2', description: 'Aluguel', amount: 1200, date: '2025-04-05', type: 'expense', category_id: 'home' },
      { id: '3', description: 'Supermercado', amount: 350, date: '2025-04-10', type: 'expense', category_id: 'food' },
      { id: '4', description: 'Combustível', amount: 200, date: '2025-04-15', type: 'expense', category_id: 'transport' },
    ];
    
    if (owner.toLowerCase() === 'michele') {
      mockTransactions.splice(0, 1, { id: '5', description: 'Salário', amount: 3800, date: '2025-04-01', type: 'income', category_id: 'salary' });
      mockTransactions.push({ id: '6', description: 'Roupas', amount: 300, date: '2025-04-18', type: 'expense', category_id: 'shopping' });
    }
    
    const processed = mockTransactions.map(transaction => ({
      ...transaction,
      category_name: categoryMap[transaction.category_id] || 'Outros'
    }));
    
    setTransactions(processed);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extrato de {owner}</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Não há transações registradas.</p>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <div className="flex gap-2 text-sm text-gray-500">
                    <span>{formatDate(transaction.date)}</span>
                    <span>•</span>
                    <span>{transaction.category_name}</span>
                  </div>
                </div>
                <div className={`font-bold ${transaction.type === 'income' ? 'text-finance-income' : 'text-finance-expense'}`}>
                  {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletStatement;
