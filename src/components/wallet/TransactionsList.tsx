
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WalletPerson } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/utils/walletUtils';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: string;
  status: string;
  category_name?: string;
};

type TransactionsListProps = {
  walletKey: WalletPerson;
};

const TransactionsList = ({ walletKey }: TransactionsListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, walletKey]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      // Buscar transações individuais para esta carteira específica
      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('responsibility', walletKey)
        .order('date', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro ao buscar transações:', error);
        toast.error('Não foi possível carregar as transações');
        setTransactions([]);
      } else {
        const formattedTransactions = (data || []).map(tx => ({
          id: tx.id,
          description: tx.description,
          amount: parseFloat(String(tx.amount)), // Convert to string first to fix type error
          date: tx.date,
          type: tx.type,
          status: tx.status,
          category_name: tx.categories?.name || 'Sem categoria'
        }));
        
        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error('Erro ao processar transações:', error);
      toast.error('Erro ao processar as transações');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações Individuais</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse-shadow h-8 w-8 rounded-full bg-blue-500"></div>
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-auto max-h-[400px]">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 whitespace-nowrap text-sm text-gray-500">{formatDate(transaction.date)}</td>
                    <td className="py-2 px-3 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.description}</td>
                    <td className="py-2 px-3 whitespace-nowrap text-sm text-gray-500">{transaction.category_name}</td>
                    <td className={`py-2 px-3 whitespace-nowrap text-sm text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-center">
                      <span 
                        className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === 'paid' || transaction.status === 'received'
                            ? 'bg-green-100 text-green-800' 
                            : transaction.status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : transaction.status === 'to_receive'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {transaction.status === 'paid' 
                          ? 'Pago' 
                          : transaction.status === 'overdue'
                            ? 'Atrasado'
                            : transaction.status === 'to_receive'
                              ? 'A Receber'
                              : transaction.status === 'received'
                                ? 'Recebido'
                                : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500">
            Não há transações individuais para esta carteira.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsList;
