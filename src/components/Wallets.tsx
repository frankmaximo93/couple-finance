import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Progress } from './ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type WalletsProps = {
  isActive: boolean;
};

type BillStatus = 'pending' | 'paid' | 'overdue';

type Bill = {
  description: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
};

type CategoryData = {
  name: string;
  value: number;
  fill: string;
};

type WalletData = {
  owner: string;
  balance: number;
  income: number;
  expenses: number;
  bills: Bill[];
  categories: CategoryData[];
};

type DebtInfo = {
  id: string;
  amount: number;
  owedTo: 'franklin' | 'michele';
  owed_by: 'franklin' | 'michele';
  owed_to: 'franklin' | 'michele';
  description: string;
  is_paid: boolean;
};

const Wallets = ({ isActive }: WalletsProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('franklin');
  const [wallets, setWallets] = useState<Record<string, WalletData>>({});
  const [debts, setDebts] = useState<DebtInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkedAccounts, setLinkedAccounts] = useState<Array<{ email: string, relationship: string }>>([]);
  const [showLinkedMessage, setShowLinkedMessage] = useState<boolean>(false);

  useEffect(() => {
    if (isActive && user) {
      fetchLinkedAccounts();
      fetchWalletData();
    }
  }, [isActive, user]);

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
              .eq('user_id', user.id);
              
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
          const processedDebts = debtsData.map((debt: any) => ({
            id: debt.id,
            amount: debt.amount,
            owedTo: debt.owed_to,
            owed_by: debt.owed_by,
            owed_to: debt.owed_to,
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
    
    setDebts(mockDebts);
  };

  const buildWalletData = (
    owner: string, 
    transactions: any[], 
    categoriesMap: Record<string, string>
  ): WalletData => {
    const ownerTransactions = transactions.filter(
      t => t.responsibility === owner || t.responsibility === 'casal'
    );
    
    const income = ownerTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const expenses = ownerTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const balance = income - expenses;
    
    const categorySpending: Record<string, number> = {};
    ownerTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const categoryId = t.category_id;
        if (categoryId) {
          if (!categorySpending[categoryId]) {
            categorySpending[categoryId] = 0;
          }
          categorySpending[categoryId] += parseFloat(t.amount);
        }
      });
    
    const colors = ['#FF8042', '#00C49F', '#FFBB28', '#0088FE', '#8884d8', '#82ca9d'];
    const categories = Object.entries(categorySpending).map(([catId, value], index) => ({
      name: categoriesMap[catId] || 'Outros',
      value,
      fill: colors[index % colors.length]
    }));
    
    const bills = ownerTransactions
      .filter(t => t.type === 'expense')
      .map(t => ({
        description: t.description,
        amount: parseFloat(t.amount),
        dueDate: t.date,
        status: 'pending' as BillStatus
      }));
    
    return {
      owner: owner === 'franklin' ? 'Franklin' : 'Michele',
      balance,
      income,
      expenses,
      bills,
      categories
    };
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

  const getTotalOwedByPerson = (person: 'franklin' | 'michele') => {
    return debts
      .filter(debt => debt.owed_by === person && !debt.is_paid)
      .reduce((total, debt) => total + debt.amount, 0);
  };

  const getTotalOwedToPerson = (person: 'franklin' | 'michele') => {
    return debts
      .filter(debt => debt.owed_to === person && !debt.is_paid)
      .reduce((total, debt) => total + debt.amount, 0);
  };

  const getNetDebtAmount = (person: 'franklin' | 'michele') => {
    const totalOwed = getTotalOwedByPerson(person);
    const totalDue = getTotalOwedToPerson(person);
    return totalDue - totalOwed;
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

  if (!isActive) return null;

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="glass-card rounded-2xl p-8 shadow-md">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse-shadow h-12 w-12 rounded-full bg-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="glass-card rounded-2xl p-8 shadow-md">
        {showLinkedMessage && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              Nenhuma conta vinculada encontrada. Vá para a página de Vincular Contas para compartilhar dados financeiros.
            </p>
          </div>
        )}
        
        <Tabs defaultValue="franklin" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="franklin">Carteira do Franklim</TabsTrigger>
            <TabsTrigger value="michele">Carteira da Michele</TabsTrigger>
          </TabsList>
          
          {['franklin', 'michele'].map((walletKey) => {
            const wallet = wallets[walletKey];
            
            if (!wallet) return null;
            
            return (
              <TabsContent key={walletKey} value={walletKey} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Saldo atual</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-finance-income">{formatCurrency(wallet.balance)}</p>
                      <div className="flex justify-between mt-4 text-sm">
                        <div>
                          <p className="text-gray-500">Receitas</p>
                          <p className="text-finance-income font-medium">{formatCurrency(wallet.income)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Despesas</p>
                          <p className="text-finance-expense font-medium">{formatCurrency(wallet.expenses)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Orçamento utilizado</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-between">
                      <div className="mb-6">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-500">Gastos vs. Receitas</span>
                          <span className="text-sm font-medium">
                            {wallet.income > 0 ? Math.round((wallet.expenses / wallet.income) * 100) : 0}%
                          </span>
                        </div>
                        <Progress 
                          value={wallet.income > 0 ? (wallet.expenses / wallet.income) * 100 : 0} 
                          className="h-2 bg-gray-200"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Consumo total</p>
                        <p className="text-xl font-medium text-finance-expense">{formatCurrency(wallet.expenses)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Divisão de despesas</CardTitle>
                      <CardDescription>Dívidas com o cônjuge</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {getNetDebtAmount(walletKey as 'franklin' | 'michele') > 0 ? (
                        <p className="text-lg font-medium text-finance-income">
                          A receber: {formatCurrency(getNetDebtAmount(walletKey as 'franklin' | 'michele'))}
                        </p>
                      ) : getNetDebtAmount(walletKey as 'franklin' | 'michele') < 0 ? (
                        <p className="text-lg font-medium text-finance-expense">
                          A pagar: {formatCurrency(Math.abs(getNetDebtAmount(walletKey as 'franklin' | 'michele')))}
                        </p>
                      ) : (
                        <p className="text-lg font-medium">Sem dívidas pendentes</p>
                      )}
                      
                      <div className="mt-2 text-sm">
                        <p className="text-gray-500">Detalhes:</p>
                        <ul className="mt-1 space-y-1">
                          {debts.filter(debt => !debt.is_paid).map((debt, index) => {
                            if (debt.owed_to === walletKey) {
                              return (
                                <li key={index} className="text-finance-income flex justify-between items-center">
                                  <div>
                                    <span>Receber de {debt.owed_by === 'franklin' ? 'Franklim' : 'Michele'}: </span>
                                    <span className="font-medium">{formatCurrency(debt.amount)}</span>
                                    <span className="block text-xs text-gray-500">{debt.description}</span>
                                  </div>
                                  <button 
                                    onClick={() => handlePayDebt(debt.id)}
                                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                                  >
                                    Marcar Pago
                                  </button>
                                </li>
                              );
                            } else if (debt.owed_by === walletKey) {
                              return (
                                <li key={index} className="text-finance-expense flex justify-between items-center">
                                  <div>
                                    <span>Pagar para {debt.owed_to === 'michele' ? 'Michele' : 'Franklim'}: </span>
                                    <span className="font-medium">{formatCurrency(debt.amount)}</span>
                                    <span className="block text-xs text-gray-500">{debt.description}</span>
                                  </div>
                                  <button 
                                    onClick={() => handlePayDebt(debt.id)}
                                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                  >
                                    Marcar Pago
                                  </button>
                                </li>
                              );
                            }
                            return null;
                          })}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Despesas por categoria</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      <div className="h-[300px] w-full">
                        {wallet.categories.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={wallet.categories}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {wallet.categories.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            Sem despesas registradas
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Contas a pagar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {wallet.bills.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">Não há contas pendentes.</p>
                        ) : (
                          wallet.bills.map((bill, index) => (
                            <div key={index} className="flex justify-between items-center border-b pb-3">
                              <div>
                                <p className="font-medium">{bill.description}</p>
                                <p className="text-sm text-gray-500">Vencimento: {formatDate(bill.dueDate)}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-finance-expense">{formatCurrency(bill.amount)}</p>
                                <span 
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    bill.status === 'paid' 
                                      ? 'bg-green-100 text-green-800' 
                                      : bill.status === 'overdue'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {bill.status === 'paid' 
                                    ? 'Pago' 
                                    : bill.status === 'overdue'
                                      ? 'Atrasado'
                                      : 'Pendente'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default Wallets;

