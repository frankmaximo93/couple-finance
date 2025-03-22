
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletPerson } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/walletUtils';

type TransactionsListProps = {
  walletKey: WalletPerson;
  refreshWallets: () => void;
};

type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: string;
  category_id?: string;
  category_name?: string;
  responsibility: string;
  payment_method?: 'cash' | 'credit' | null;
  status?: 'pending' | 'paid' | 'overdue';
  split_expense?: boolean;
  paid_by?: string;
};

const TransactionsList = ({ walletKey, refreshWallets }: TransactionsListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      const fetchTransactions = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('transactions')
            .select('*, categories(name)')
            .eq('responsibility', walletKey)
            .order('date', { ascending: false });
            
          if (error) {
            console.error('Error fetching transactions:', error);
            toast.error('Erro ao carregar transações');
            setTransactions([]);
          } else {
            console.log(`Fetched ${data?.length || 0} transactions for ${walletKey}`);
            
            if (!data || data.length === 0) {
              setTransactions([]);
              setIsLoading(false);
              return;
            }
            
            // Transform the data to match the Transaction type
            const formattedTransactions: Transaction[] = data.map((t: any) => ({
              id: t.id,
              description: t.description,
              amount: t.amount,
              date: t.date,
              type: t.type,
              category_id: t.category_id,
              category_name: t.categories?.name,
              responsibility: t.responsibility,
              payment_method: t.payment_method,
              status: t.status || 'pending',
              split_expense: t.split_expense,
              paid_by: t.paid_by
            }));
            
            setTransactions(formattedTransactions);
          }
        } catch (error) {
          console.error('Error fetching transactions:', error);
          toast.error('Erro ao carregar transações');
          setTransactions([]);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchTransactions();
      
      // Set up real-time subscription for this wallet's transactions
      const subscription = supabase
        .channel(`transactions_${walletKey}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'transactions',
            filter: `responsibility=eq.${walletKey}`
          }, 
          (payload) => {
            console.log('Transaction change detected:', payload);
            refreshWallets();
            
            // Refresh the transactions list
            supabase
              .from('transactions')
              .select('*, categories(name)')
              .eq('responsibility', walletKey)
              .order('date', { ascending: false })
              .then(({ data, error }) => {
                if (!error && data) {
                  const formattedTransactions: Transaction[] = data.map((t: any) => ({
                    id: t.id,
                    description: t.description,
                    amount: t.amount,
                    date: t.date,
                    type: t.type,
                    category_id: t.category_id,
                    category_name: t.categories?.name,
                    responsibility: t.responsibility,
                    payment_method: t.payment_method,
                    status: t.status || 'pending',
                    split_expense: t.split_expense,
                    paid_by: t.paid_by
                  }));
                  
                  setTransactions(formattedTransactions);
                }
              });
          }
        )
        .subscribe();
        
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, walletKey, refreshWallets]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getTypeLabel = (type: string) => {
    return type === 'income' ? 'Receita' : 'Despesa';
  };

  const getSplitInfo = (transaction: Transaction) => {
    if (!transaction.split_expense) return '';
    
    const paidBy = transaction.paid_by === 'franklin' ? 'Franklim' : 'Michele';
    const owedBy = transaction.paid_by === 'franklin' ? 'Michele' : 'Franklim';
    const halfAmount = (transaction.amount / 2).toFixed(2);
    
    return `${paidBy} pagou (${owedBy} deve R$ ${halfAmount})`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transações recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="animate-pulse-shadow h-8 w-8 rounded-full bg-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const transactionsToShow = showAllTransactions ? transactions : transactions.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Transações recentes</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">Nenhuma transação registrada ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Divisão</th>
                </tr>
              </thead>
              <tbody>
                {transactionsToShow.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 text-sm">{transaction.description}</td>
                    <td className={`py-2 text-sm ${transaction.type === 'income' ? 'text-finance-income font-medium' : 'text-finance-expense font-medium'}`}>
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="py-2 text-sm">{formatDate(transaction.date)}</td>
                    <td className="py-2 text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {getTypeLabel(transaction.type)}
                      </span>
                    </td>
                    <td className="py-2 text-sm">{transaction.category_name || 'Sem categoria'}</td>
                    <td className="py-2 text-sm">{getSplitInfo(transaction)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {transactions.length > 5 && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAllTransactions(!showAllTransactions)}
                >
                  {showAllTransactions ? 'Mostrar menos' : `Ver todas (${transactions.length})`}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsList;
