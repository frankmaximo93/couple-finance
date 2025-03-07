import { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client'; 
import { useAuth } from '@/context/AuthContext';

type DashboardProps = {
  isActive: boolean;
};

type MonthlySummary = {
  monthly_income: number;
  monthly_expense: number;
};

type CategorySummary = {
  category: string;
  income: number;
  expense: number;
};

type BudgetStatus = {
  category: string;
  budget: number;
  spent: number;
  percentage: number;
};

type Insight = {
  type: 'increase' | 'decrease' | 'warning' | 'info';
  title: string;
  description: string;
  icon: React.ReactNode;
};

const Dashboard = ({ isActive }: DashboardProps) => {
  const { user } = useAuth();
  const [saldoTotal, setSaldoTotal] = useState<number>(0);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary>({
    monthly_income: 0,
    monthly_expense: 0
  });
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus[]>([]);
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkedAccounts, setLinkedAccounts] = useState<Array<{ email: string, relationship: string }>>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (isActive && user) {
      setIsLoading(true);
      fetchLinkedAccounts();
      fetchDashboardData();
    }
  }, [isActive, user]);

  const fetchLinkedAccounts = async () => {
    try {
      try {
        const { data, error } = await supabase.rpc('get_linked_users');
        
        if (error) {
          console.error('Error fetching linked accounts:', error);
          // If RPC function doesn't exist, try to check relationship directly
          if (error.message.includes('Could not find the function')) {
            const { data: relationships, error: relError } = await supabase
              .from('user_relationships')
              .select('*')
              .eq('user_id', user.id);
              
            if (!relError && relationships && relationships.length > 0) {
              setLinkedAccounts([
                { email: 'usuário vinculado', relationship: 'spouse' }
              ]);
              return;
            }
          }
        }
        
        if (data && Array.isArray(data)) {
          setLinkedAccounts(data);
          console.log('Linked accounts for Dashboard:', data);
        }
      } catch (error) {
        console.error('Error with RPC call:', error);
      }
    } catch (error) {
      console.error('Error loading linked accounts:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch real transactions data from Supabase
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*');
        
      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        toast.error('Erro ao carregar transações');
        setIsLoading(false);
        return;
      }

      // Process real transaction data
      const income = transactionsData
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
        
      const expense = transactionsData
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
        
      setSaldoTotal(income - expense);
      setMonthlySummary({
        monthly_income: income,
        monthly_expense: expense
      });
      
      // Calculate category summaries from real data
      const categorySummaries: Record<string, CategorySummary> = {};
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name');
        
      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      } else {
        // Create category mapping
        const categoryMap: {[key: string]: string} = {};
        if (categoriesData) {
          categoriesData.forEach((cat: any) => {
            categoryMap[cat.id] = cat.name;
            // Initialize each category in our summary
            categorySummaries[cat.id] = {
              category: cat.name,
              income: 0,
              expense: 0
            };
          });
        }
        
        // Aggregate transactions by category
        transactionsData.forEach((t: any) => {
          if (t.category_id && categorySummaries[t.category_id]) {
            if (t.type === 'income') {
              categorySummaries[t.category_id].income += parseFloat(t.amount);
            } else {
              categorySummaries[t.category_id].expense += parseFloat(t.amount);
            }
          }
        });
        
        setCategorySummary(Object.values(categorySummaries));
      }
      
      // Generate insights based on real data
      generateInsights(income - expense, { monthly_income: income, monthly_expense: expense });
      
      // For budget status and monthly trend, we'll need more complex queries or calculations
      // For now, initialize with empty arrays
      setBudgetStatus([]);
      setMonthlyTrend([]);
        
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
      
      // Initialize with empty values
      setSaldoTotal(0);
      setMonthlySummary({ monthly_income: 0, monthly_expense: 0 });
      setBudgetStatus([]);
      setCategorySummary([]);
      setMonthlyTrend([]);
      setInsights([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockData = () => {
    // Set mock total balance
    setSaldoTotal(4000);
    
    // Set mock monthly summary
    setMonthlySummary({
      monthly_income: 8300,
      monthly_expense: 4300
    });
    
    // Mock data for budget status
    const mockBudgetStatus: BudgetStatus[] = [
      { category: 'Alimentação', budget: 800, spent: 650, percentage: 81.25 },
      { category: 'Despesas Casa', budget: 1200, spent: 1050, percentage: 87.5 },
      { category: 'Lazer', budget: 400, spent: 350, percentage: 87.5 },
      { category: 'Transporte', budget: 500, spent: 180, percentage: 36 },
    ];
    setBudgetStatus(mockBudgetStatus);

    // Mock data for category summary
    const mockCategorySummary: CategorySummary[] = [
      { category: 'Alimentação', income: 0, expense: 650 },
      { category: 'Despesas Casa', income: 0, expense: 1050 },
      { category: 'Salário', income: 8300, expense: 0 },
      { category: 'Lazer', income: 0, expense: 350 },
      { category: 'Transporte', income: 0, expense: 180 },
    ];
    setCategorySummary(mockCategorySummary);

    // Mock data for monthly trend
    const mockMonthlyTrend = [
      { month: 'Jan', receitas: 3500, despesas: 2800, saldo: 700 },
      { month: 'Fev', receitas: 4200, despesas: 3100, saldo: 1100 },
      { month: 'Mar', receitas: 3800, despesas: 3500, saldo: 300 },
      { month: 'Abr', receitas: 4500, despesas: 3300, saldo: 1200 },
      { month: 'Mai', receitas: 5000, despesas: 3600, saldo: 1400 },
      { month: 'Jun', receitas: 4800, despesas: 3900, saldo: 900 },
    ];
    setMonthlyTrend(mockMonthlyTrend);
  };

  const generateInsights = (saldo: number, summary: MonthlySummary) => {
    const newInsights: Insight[] = [];
    
    // Saldo positivo ou negativo
    if (saldo > 0) {
      newInsights.push({
        type: 'increase',
        title: 'Saldo Positivo',
        description: 'Você tem um saldo positivo este mês. Continue economizando!',
        icon: <TrendingUp className="h-5 w-5 text-green-500" />
      });
    } else {
      newInsights.push({
        type: 'warning',
        title: 'Saldo Negativo',
        description: 'Seu saldo está negativo. Revise seus gastos.',
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />
      });
    }

    // Proporção de gastos vs receita
    const proportion = summary.monthly_expense / summary.monthly_income;
    if (proportion > 0.8 && summary.monthly_income > 0) {
      newInsights.push({
        type: 'warning',
        title: 'Gastos Elevados',
        description: `Você está gastando ${(proportion * 100).toFixed(0)}% da sua receita.`,
        icon: <ArrowUpRight className="h-5 w-5 text-amber-500" />
      });
    } else if (proportion < 0.5 && summary.monthly_income > 0) {
      newInsights.push({
        type: 'increase',
        title: 'Economia Eficiente',
        description: `Você está economizando ${((1 - proportion) * 100).toFixed(0)}% da sua receita.`,
        icon: <PiggyBank className="h-5 w-5 text-green-500" />
      });
    }

    setInsights(newInsights);
  };

  const getSavingsPercentage = () => {
    if (monthlySummary.monthly_income === 0) return 0;
    return ((monthlySummary.monthly_income - monthlySummary.monthly_expense) / monthlySummary.monthly_income) * 100;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage > 90) return "bg-red-500";
    if (percentage > 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getSavingsColor = (percentage: number) => {
    if (percentage < 0) return "bg-red-500";
    if (percentage < 20) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (!isActive) return null;

  return (
    <div className="animate-fade-in">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse-shadow h-12 w-12 rounded-full bg-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Balance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">Saldo Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className={`text-3xl font-bold ${saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {saldoTotal.toFixed(2)}
                  </p>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-800">Receitas Mensais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-green-600">
                    R$ {monthlySummary.monthly_income.toFixed(2)}
                  </p>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <ArrowUpRight className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-50 to-red-100 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-800">Despesas Mensais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-red-600">
                    R$ {monthlySummary.monthly_expense.toFixed(2)}
                  </p>
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <ArrowDownRight className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Insights Section */}
          {insights.length > 0 && (
            <Card className="border-l-4 border-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Insights Financeiros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${
                        insight.type === 'increase' ? 'bg-green-100' : 
                        insight.type === 'decrease' ? 'bg-red-100' : 
                        insight.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        {insight.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{insight.title}</h4>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Main Dashboard Content */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="budget">Orçamento</TabsTrigger>
              <TabsTrigger value="trends">Tendências</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Economia Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Meta: Economizar 20% da renda</span>
                        <span className={`text-sm font-medium ${getSavingsPercentage() < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {getSavingsPercentage().toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.max(0, Math.min(getSavingsPercentage(), 100))} 
                        className="h-2" 
                      />
                    </div>
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
                      <PiggyBank className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Balanço por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categorySummary.length > 0 ? categorySummary : [
                          { category: 'Alimentação', income: 100, expense: 650 },
                          { category: 'Despesas Casa', income: 0, expense: 1050 },
                          { category: 'Salário', income: 3500, expense: 0 },
                          { category: 'Lazer', income: 0, expense: 350 },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip formatter={(value) => `R$ ${value}`} />
                        <Legend />
                        <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="budget" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status do Orçamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {budgetStatus.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{item.category}</span>
                          <span className="text-sm text-gray-500">
                            R$ {item.spent.toFixed(2)} / R$ {item.budget.toFixed(2)}
                          </span>
                        </div>
                        <div className="relative">
                          <Progress 
                            value={item.percentage} 
                            className="h-2" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-center">
                    <Button variant="outline">Gerenciar Orçamentos</Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sugestões de Economia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex space-x-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <DollarSign className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">Gastos com Alimentação</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Você já gastou 81% do seu orçamento para alimentação este mês. 
                            Tente cozinhar mais em casa para economizar.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex space-x-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">Bom trabalho em Transporte!</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Você gastou apenas 36% do seu orçamento para transporte. 
                            Continue assim!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tendência Financeira</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monthlyTrend}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => `R$ ${value}`} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="receitas" 
                          name="Receitas"
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 8 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="despesas" 
                          name="Despesas"
                          stroke="#ef4444" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="saldo" 
                          name="Saldo"
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Análise de Tendências</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium">Crescimento da Receita</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Nos últimos 6 meses, suas receitas cresceram em média 8% ao mês.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <h4 className="font-medium">Aumento de Despesas</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Suas despesas também estão crescendo, com um aumento médio de 5% ao mês.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium">Previsão</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Se a tendência continuar, seu saldo deve aumentar nos próximos meses.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
