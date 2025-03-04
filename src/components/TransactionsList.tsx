
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type TransactionsListProps = {
  isActive: boolean;
};

type Transaction = {
  id: number;
  description: string;
  amount: number;
  category_id: number;
  category_name?: string;
  date: string;
  type: string;
  responsibility: string;
};

const TransactionsList = ({ isActive }: TransactionsListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<{[key: number]: string}>({});

  useEffect(() => {
    if (isActive) {
      fetchData();
    }
  }, [isActive]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch categories and transactions in parallel
      const [categoriesResponse, transactionsResponse] = await Promise.all([
        fetch('http://localhost:3000/api/categories'),
        fetch('http://localhost:3000/api/transactions')
      ]);

      if (!categoriesResponse.ok || !transactionsResponse.ok) {
        throw new Error('Erro ao buscar dados');
      }

      const categoriesData = await categoriesResponse.json();
      const transactionsData = await transactionsResponse.json();

      // Create a category lookup map
      const categoryMap: {[key: number]: string} = {};
      categoriesData.forEach((cat: {id: number, name: string}) => {
        categoryMap[cat.id] = cat.name;
      });

      setCategories(categoryMap);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getTypeLabel = (type: string) => {
    return type === 'income' ? 'Receita' : 'Despesa';
  };

  if (!isActive) return null;

  return (
    <div className="animate-fade-in">
      <div className="glass-card rounded-2xl p-6 shadow-md">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsabilidade</th>
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
                        <span className="capitalize">{transaction.responsibility}</span>
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
