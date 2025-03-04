
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarIcon, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";

type WalletsProps = {
  isActive: boolean;
};

type WalletData = {
  owner: string;
  balance: number;
  income: number;
  expenses: number;
  bills: Array<{
    description: string;
    amount: number;
    dueDate: string;
    status: 'pending' | 'paid' | 'overdue';
  }>;
  categories: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
};

const Wallets = ({ isActive }: WalletsProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [walletsData, setWalletsData] = useState<Record<string, WalletData> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isActive) {
      fetchWalletsData();
    }
  }, [isActive, date]);

  const fetchWalletsData = async () => {
    setIsLoading(true);
    try {
      // Simulando dados para demonstração
      // No ambiente real, você faria uma chamada para a API
      setTimeout(() => {
        const data = {
          franklin: {
            owner: 'Franklin',
            balance: 2500.75,
            income: 4200.00,
            expenses: 1700.25,
            bills: [
              { description: 'Internet', amount: 120.00, dueDate: '2024-10-15', status: 'pending' },
              { description: 'Streaming', amount: 45.90, dueDate: '2024-10-05', status: 'paid' },
              { description: 'Celular', amount: 89.90, dueDate: '2024-10-20', status: 'pending' },
            ],
            categories: [
              { name: 'Alimentação', value: 450, fill: '#FF8042' },
              { name: 'Transporte', value: 350, fill: '#FFBB28' },
              { name: 'Lazer', value: 270, fill: '#0088FE' },
              { name: 'Tecnologia', value: 630, fill: '#00C49F' },
            ]
          },
          michele: {
            owner: 'Michele',
            balance: 3200.40,
            income: 4500.00,
            expenses: 1300.60,
            bills: [
              { description: 'Academia', amount: 110.00, dueDate: '2024-10-12', status: 'pending' },
              { description: 'Compras Online', amount: 325.50, dueDate: '2024-10-03', status: 'paid' },
              { description: 'Curso Online', amount: 197.00, dueDate: '2024-09-28', status: 'overdue' },
            ],
            categories: [
              { name: 'Compras', value: 580, fill: '#FF8042' },
              { name: 'Educação', value: 420, fill: '#FFBB28' },
              { name: 'Saúde', value: 150, fill: '#0088FE' },
              { name: 'Lazer', value: 150, fill: '#00C49F' },
            ]
          }
        };
        setWalletsData(data);
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error('Erro ao buscar dados das carteiras:', error);
      toast.error('Erro ao carregar dados das carteiras');
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: 'pending' | 'paid' | 'overdue') => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: 'pending' | 'paid' | 'overdue') => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Atrasado';
      default: return 'Desconhecido';
    }
  };

  if (!isActive) return null;

  return (
    <div className="animate-fade-in">
      <div className="glass-card rounded-2xl p-6 shadow-md">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-medium text-gray-800">Carteiras Individuais</h3>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button 
                onClick={fetchWalletsData}
                variant="default"
                disabled={isLoading}
              >
                {isLoading ? 'Carregando...' : 'Atualizar'}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse-shadow h-12 w-12 rounded-full bg-blue-500"></div>
            </div>
          ) : walletsData ? (
            <Tabs defaultValue="franklin" className="w-full">
              <TabsList className="mb-4 flex justify-center">
                <TabsTrigger value="franklin">Carteira de Franklin</TabsTrigger>
                <TabsTrigger value="michele">Carteira de Michele</TabsTrigger>
              </TabsList>
              
              {Object.entries(walletsData).map(([key, wallet]) => (
                <TabsContent key={key} value={key} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800">Saldo de {wallet.owner}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <p className="text-3xl font-bold text-blue-600">
                            R$ {wallet.balance.toFixed(2)}
                          </p>
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Wallet className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-800">Receitas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <p className="text-3xl font-bold text-green-600">
                            R$ {wallet.income.toFixed(2)}
                          </p>
                          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <ArrowUpRight className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-red-50 to-red-100 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-800">Despesas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <p className="text-3xl font-bold text-red-600">
                            R$ {wallet.expenses.toFixed(2)}
                          </p>
                          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                            <ArrowDownRight className="h-6 w-6 text-red-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Contas a Pagar</CardTitle>
                        <CardDescription>Próximos vencimentos de {wallet.owner}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {wallet.bills.length > 0 ? (
                            wallet.bills.map((bill, index) => (
                              <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                                <div>
                                  <h4 className="font-medium">{bill.description}</h4>
                                  <p className="text-sm text-gray-500">Vencimento: {new Date(bill.dueDate).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">R$ {bill.amount.toFixed(2)}</p>
                                  <span className={`text-xs px-2 py-1 rounded-full text-white ${getStatusColor(bill.status)}`}>
                                    {getStatusText(bill.status)}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-gray-500 py-4">Nenhuma conta a pagar.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Gastos por Categoria</CardTitle>
                        <CardDescription>Distribuição de despesas de {wallet.owner}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={wallet.categories}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {wallet.categories.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `R$ ${value}`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Visão Geral da Carteira</CardTitle>
                      <CardDescription>Análise de gastos e ganhos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={wallet.categories}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `R$ ${value}`} />
                            <Legend />
                            <Bar 
                              dataKey="value" 
                              name="Gastos" 
                              fill="#8884d8"
                              radius={[4, 4, 0, 0]}
                            >
                              {wallet.categories.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-600">Nenhum dado disponível para o período selecionado.</p>
              <Button onClick={fetchWalletsData} className="mt-4">
                Carregar Dados
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallets;
