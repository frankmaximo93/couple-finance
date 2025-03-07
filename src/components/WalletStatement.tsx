
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Button } from './ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import EditTransactionDialog, { Transaction } from './EditTransactionDialog';

type WalletStatementProps = {
  isActive: boolean;
  walletOwner: 'franklin' | 'michele';
  onBalanceUpdated: () => void;
};

type SortField = 'date' | 'amount' | 'description' | 'type';
type SortDirection = 'asc' | 'desc';

const WalletStatement = ({ isActive, walletOwner, onBalanceUpdated }: WalletStatementProps) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<{[key: string]: string}>({});
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    if (isActive && user) {
      fetchData();
    }
  }, [isActive, user, walletOwner]);

  useEffect(() => {
    applyFilters();
  }, [transactions, filterType]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      } else {
        const categoryMap: {[key: string]: string} = {};
        categoriesData?.forEach((cat: {id: string, name: string}) => {
          categoryMap[cat.id] = cat.name;
        });
        setCategories(categoryMap);
      }

      // Fetch transactions for this wallet owner
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .or(`responsibility.eq.${walletOwner},responsibility.eq.casal`)
        .order('date', { ascending: false });

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        generateMockData();
      } else {
        const processedTransactions: Transaction[] = transactionsData.map((t: any) => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          category_id: t.category_id,
          category_name: categoryMap[t.category_id],
          date: t.date,
          type: t.type,
          responsibility: t.responsibility,
          payment_method: t.payment_method,
          installments: t.installments,
          due_date: t.due_date,
          split_expense: t.split_expense,
          paid_by: t.paid_by,
          status: t.status || 'pending',
          is_recurring: t.is_recurring
        }));
        
        setTransactions(processedTransactions);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do extrato:', error);
      generateMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockData = () => {
    const mockCategories: {[key: string]: string} = {
      'cat1': 'Alimentação',
      'cat2': 'Moradia',
      'cat3': 'Transporte',
      'cat4': 'Lazer',
      'cat5': 'Salário'
    };
    
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        description: 'Supermercado',
        amount: 350,
        category_id: 'cat1',
        category_name: 'Alimentação',
        date: '2025-04-10',
        type: 'expense',
        responsibility: walletOwner,
        payment_method: 'credit',
        installments: 1,
        due_date: '2025-05-10',
        split_expense: true,
        paid_by: walletOwner,
        status: 'pending',
        is_recurring: false
      },
      {
        id: '2',
        description: 'Aluguel',
        amount: 1200,
        category_id: 'cat2',
        category_name: 'Moradia',
        date: '2025-04-05',
        type: 'expense',
        responsibility: 'casal',
        payment_method: 'cash',
        status: 'paid',
        is_recurring: true
      },
      {
        id: '3',
        description: 'Salário',
        amount: 4500,
        category_id: 'cat5',
        category_name: 'Salário',
        date: '2025-04-01',
        type: 'income',
        responsibility: walletOwner,
        payment_method: 'cash',
        status: 'paid',
        is_recurring: true
      }
    ];
    
    setCategories(mockCategories);
    setTransactions(mockTransactions);
  };

  const applyFilters = () => {
    let filtered = [...transactions];
    
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortField === 'date') {
        return sortDirection === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortField === 'amount') {
        return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      } else if (sortField === 'description') {
        return sortDirection === 'asc' 
          ? a.description.localeCompare(b.description)
          : b.description.localeCompare(a.description);
      } else if (sortField === 'type') {
        return sortDirection === 'asc' 
          ? a.type.localeCompare(b.type)
          : b.type.localeCompare(a.type);
      }
      return 0;
    });
    
    setFilteredTransactions(filtered);
  };

  const handleTypeFilter = (value: 'all' | 'income' | 'expense') => {
    setFilterType(value);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    
    // Re-apply filters with new sort
    setTimeout(applyFilters, 0);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    
    try {
      // Check if there's a debt related to this transaction
      const { data: debts } = await supabase
        .from('debts')
        .select('id')
        .eq('transaction_id', id);
        
      // Delete any related debts first
      if (debts && debts.length > 0) {
        await supabase
          .from('debts')
          .delete()
          .eq('transaction_id', id);
      }
      
      // Delete the transaction
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Transação excluída com sucesso');
      fetchData();
      onBalanceUpdated();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação');
    }
  };

  const handleTransactionUpdated = () => {
    fetchData();
    onBalanceUpdated();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTypeLabel = (type: string) => {
    return type === 'income' ? 'Receita' : 'Despesa';
  };

  const getTotalIncome = () => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpense = () => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getBalance = () => {
    return getTotalIncome() - getTotalExpense();
  };

  if (!isActive) return null;

  return (
    <div className="animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Extrato de {walletOwner === 'franklin' ? 'Franklim' : 'Michele'}</span>
            <div className="flex items-center space-x-2">
              <Select
                value={filterType}
                onValueChange={(value) => handleTypeFilter(value as 'all' | 'income' | 'expense')}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-pulse-shadow h-12 w-12 rounded-full bg-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Receitas</p>
                  <p className="text-lg font-medium text-finance-income">{formatCurrency(getTotalIncome())}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Despesas</p>
                  <p className="text-lg font-medium text-finance-expense">{formatCurrency(getTotalExpense())}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Saldo</p>
                  <p className={`text-lg font-medium ${getBalance() >= 0 ? 'text-finance-income' : 'text-finance-expense'}`}>
                    {formatCurrency(getBalance())}
                  </p>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>
                        Data
                        <ArrowUpDown className="ml-1 h-3 w-3 inline" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('description')}>
                        Descrição
                        <ArrowUpDown className="ml-1 h-3 w-3 inline" />
                      </TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('type')}>
                        Tipo
                        <ArrowUpDown className="ml-1 h-3 w-3 inline" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                        Valor
                        <ArrowUpDown className="ml-1 h-3 w-3 inline" />
                      </TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Nenhuma transação encontrada para os filtros selecionados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{categories[transaction.category_id] || 'N/A'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              transaction.type === 'income' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {getTypeLabel(transaction.type)}
                            </span>
                          </TableCell>
                          <TableCell className={transaction.type === 'income' ? 'text-finance-income' : 'text-finance-expense'}>
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => handleEditTransaction(transaction)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          
          <EditTransactionDialog 
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            transaction={editTransaction}
            onTransactionUpdated={handleTransactionUpdated}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletStatement;
