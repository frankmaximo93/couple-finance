
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Progress } from './ui/progress';

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
  amount: number;
  owedTo: 'franklin' | 'michele';
  description: string;
};

const Wallets = ({ isActive }: WalletsProps) => {
  const [activeTab, setActiveTab] = useState('franklin');
  const [wallets, setWallets] = useState<Record<string, WalletData>>({});
  const [debts, setDebts] = useState<DebtInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isActive) {
      fetchWalletData();
    }
  }, [isActive]);

  const fetchWalletData = async () => {
    setIsLoading(true);
    
    try {
      // Simulando dados de carteiras e transações
      // Normalmente, isso viria da API
      
      const mockWallets: Record<string, WalletData> = {
        franklin: {
          owner: 'Franklin',
          balance: 3750.45,
          income: 5000.00,
          expenses: 1249.55,
          bills: [
            { description: 'Aluguel', amount: 800.00, dueDate: '2025-03-15', status: 'pending' },
            { description: 'Internet', amount: 120.00, dueDate: '2025-03-10', status: 'paid' },
            { description: 'Celular', amount: 89.90, dueDate: '2025-03-05', status: 'pending' }
          ],
          categories: [
            { name: 'Alimentação', value: 450, fill: '#FF8042' },
            { name: 'Transporte', value: 300, fill: '#00C49F' },
            { name: 'Lazer', value: 200, fill: '#FFBB28' },
            { name: 'Outros', value: 299.55, fill: '#0088FE' }
          ]
        },
        michele: {
          owner: 'Michele',
          balance: 4230.75,
          income: 5500.00,
          expenses: 1269.25,
          bills: [
            { description: 'Academia', amount: 120.00, dueDate: '2025-03-15', status: 'pending' },
            { description: 'Streaming', amount: 55.90, dueDate: '2025-03-20', status: 'pending' },
            { description: 'Seguro', amount: 180.00, dueDate: '2025-03-05', status: 'paid' }
          ],
          categories: [
            { name: 'Alimentação', value: 380, fill: '#FF8042' },
            { name: 'Beleza', value: 420, fill: '#FFBB28' },
            { name: 'Transporte', value: 250, fill: '#00C49F' },
            { name: 'Outros', value: 219.25, fill: '#0088FE' }
          ]
        }
      };

      // Simulando dados de dívidas entre o casal
      const mockDebts: DebtInfo[] = [
        { amount: 278.50, owedTo: 'michele', description: 'Compras no supermercado (12/02)' },
        { amount: 156.00, owedTo: 'michele', description: 'Farmácia (18/02)' },
        { amount: 95.00, owedTo: 'franklin', description: 'Contas da casa (01/03)' }
      ];

      setWallets(mockWallets);
      setDebts(mockDebts);
    } catch (error) {
      console.error('Erro ao carregar dados das carteiras:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalOwedByPerson = (person: 'franklin' | 'michele') => {
    return debts
      .filter(debt => debt.owedTo !== person)
      .reduce((total, debt) => total + debt.amount, 0);
  };

  const getTotalOwedToPerson = (person: 'franklin' | 'michele') => {
    return debts
      .filter(debt => debt.owedTo === person)
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
                          <span className="text-sm font-medium">{Math.round((wallet.expenses / wallet.income) * 100)}%</span>
                        </div>
                        <Progress value={(wallet.expenses / wallet.income) * 100} className="h-2 bg-gray-200" indicatorClassName="bg-blue-500" />
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
                          {debts.map((debt, index) => {
                            if (debt.owedTo === walletKey) {
                              return (
                                <li key={index} className="text-finance-income">
                                  <span>Receber de {debt.owedTo === 'franklin' ? 'Michele' : 'Franklim'}: </span>
                                  <span className="font-medium">{formatCurrency(debt.amount)}</span>
                                  <span className="block text-xs text-gray-500">{debt.description}</span>
                                </li>
                              );
                            } else if (debt.owedTo !== walletKey) {
                              return (
                                <li key={index} className="text-finance-expense">
                                  <span>Pagar para {debt.owedTo === 'michele' ? 'Michele' : 'Franklim'}: </span>
                                  <span className="font-medium">{formatCurrency(debt.amount)}</span>
                                  <span className="block text-xs text-gray-500">{debt.description}</span>
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
