
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

type TransactionsListProps = {
  isActive: boolean;
};

type Transaction = {
  id: string;
  description: string;
  amount: number;
  category_id: string;
  category_name?: string;
  date: string;
  type: string;
  responsibility: string;
  payment_method?: 'cash' | 'credit' | null;
  installments?: number;
  due_date?: string;
  split_expense?: boolean;
  paid_by?: string;
  status: 'pending' | 'paid' | 'overdue';
  is_recurring: boolean;
};

const TransactionsList = ({ isActive }: TransactionsListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<{[key: string]: string}>({});
  const [linkedAccounts, setLinkedAccounts] = useState<Array<{ email: string, relationship: string }>>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (isActive && user) {
      fetchData();
      fetchLinkedAccounts();
    }
  }, [isActive, user]);

  const fetchLinkedAccounts = async () => {
    try {
      const { data, error } = await supabase.rpc('get_linked_users');
      
      if (error) {
        console.error('Error fetching linked accounts:', error);
        return;
      }
      
      if (data && Array.isArray(data)) {
        setLinkedAccounts(data);
        console.log('Linked accounts for TransactionsList:', data);
      }
    } catch (error) {
      console.error('Error loading linked accounts:', error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch categories and transactions in parallel
      const [categoriesResponse, transactionsResponse] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name')
          .order('name'),
        supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false })
      ]);

      if (categoriesResponse.error) {
        console.error('Error fetching categories:', categoriesResponse.error);
        throw new Error(categoriesResponse.error.message);
      }

      if (transactionsResponse.error) {
        console.error('Error fetching transactions:', transactionsResponse.error);
        throw new Error(transactionsResponse.error.message);
      }

      console.log('Transactions data:', transactionsResponse.data);

      // Create a category lookup map
      const categoryMap: {[key: string]: string} = {};
      categoriesResponse.data.forEach((cat: {id: string, name: string}) => {
        categoryMap[cat.id] = cat.name;
      });

      setCategories(categoryMap);
      
      // Transform the data to match the Transaction type
      const formattedTransactions: Transaction[] = transactionsResponse.data.map((t: any) => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        category_id: t.category_id,
        date: t.date,
        type: t.type,
        responsibility: t.responsibility,
        payment_method: t.payment_method as 'cash' | 'credit' | null,
        installments: t.installments,
        due_date: t.due_date,
        split_expense: t.split_expense,
        paid_by: t.paid_by,
        status: (t.status || 'pending') as 'pending' | 'paid' | 'overdue',
        is_recurring: t.is_recurring
      }));
      
      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getTypeLabel = (type: string) => {
    return type === 'income' ? 'Receita' : 'Despesa';
  };

  const getPaymentMethodLabel = (method?: 'cash' | 'credit' | null) => {
    if (!method) return 'À Vista';
    return method === 'cash' ? 'À Vista' : 'Crédito';
  };

  const getInstallmentsLabel = (transaction: Transaction) => {
    if (!transaction.payment_method || transaction.payment_method === 'cash') return '';
    return `${transaction.installments}x`;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Atrasado';
      default: return status;
    }
  };

  const getSplitInfo = (transaction: Transaction) => {
    if (!transaction.split_expense) return '';
    
    const paidBy = transaction.paid_by === 'franklin' ? 'Franklim' : 'Michele';
    const owedBy = transaction.paid_by === 'franklin' ? 'Michele' : 'Franklim';
    const halfAmount = (transaction.amount / 2).toFixed(2);
    
    return `${paidBy} pagou (${owedBy} deve R$ ${halfAmount})`;
  };

  if (!isActive) return null;

  return (
    <div className="animate-fade-in">
      <div className="glass-card rounded-2xl p-6 shadow-md">
        {linkedAccounts.length === 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              Nenhuma conta vinculada encontrada. Vá para a página de Vincular Contas para compartilhar dados financeiros.
            </p>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse-shadow h-12 w-12 rounded-full bg-blue-500"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma transação registrada ainda.</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="overflow-x-auto rounded-xl">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagamento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resp.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Divisão</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorrente</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.description}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${transaction.type === 'income' ? 'text-finance-income font-medium' : 'text-finance-expense font-medium'}`}>
                        R$ {transaction.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {categories[transaction.category_id] || 'Categoria desconhecida'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(transaction.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {getTypeLabel(transaction.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {getPaymentMethodLabel(transaction.payment_method)}
                        {transaction.payment_method === 'credit' && (
                          <span className="ml-1">
                            ({getInstallmentsLabel(transaction)})
                            <div className="text-xs text-gray-500">
                              Venc: {formatDate(transaction.due_date || '')}
                            </div>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : transaction.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getStatusLabel(transaction.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="capitalize">{transaction.responsibility}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {getSplitInfo(transaction)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {transaction.is_recurring ? 'Sim' : 'Não'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsList;
