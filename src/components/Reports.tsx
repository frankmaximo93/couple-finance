
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ReportsProps = {
  isActive: boolean;
};

const Reports = ({ isActive }: ReportsProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [reportsData, setReportsData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isActive) {
      fetchReportsData();
    }
  }, [isActive, date]);

  const fetchReportsData = async () => {
    setIsLoading(true);
    try {
      // Simulando dados para demonstração
      // No ambiente real, você faria uma chamada para a API
      setTimeout(() => {
        const data = {
          monthlySummary: [
            { month: 'Jan', receitas: 3500, despesas: 2800 },
            { month: 'Fev', receitas: 4200, despesas: 3100 },
            { month: 'Mar', receitas: 3800, despesas: 3500 },
            { month: 'Abr', receitas: 4500, despesas: 3300 },
            { month: 'Mai', receitas: 5000, despesas: 3600 },
            { month: 'Jun', receitas: 4800, despesas: 3900 },
          ],
          categoryBreakdown: [
            { name: 'Alimentação', value: 1200, fill: '#FF8042' },
            { name: 'Moradia', value: 1800, fill: '#00C49F' },
            { name: 'Transporte', value: 800, fill: '#FFBB28' },
            { name: 'Lazer', value: 600, fill: '#0088FE' },
            { name: 'Saúde', value: 400, fill: '#FF8042' },
          ],
          responsibilityDistribution: [
            { name: 'Casal', value: 2400, fill: '#8884d8' },
            { name: 'Franklin', value: 1200, fill: '#82ca9d' },
            { name: 'Michele', value: 600, fill: '#ffc658' },
          ]
        };
        setReportsData(data);
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error('Erro ao buscar dados de relatórios:', error);
      toast.error('Erro ao carregar relatórios');
      setIsLoading(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="animate-fade-in">
      <div className="glass-card rounded-2xl p-6 shadow-md">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-medium text-gray-800">Relatórios Financeiros</h3>
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
                onClick={fetchReportsData}
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
          ) : reportsData ? (
            <Tabs defaultValue="evolucao" className="w-full">
              <TabsList className="mb-4 flex justify-center">
                <TabsTrigger value="evolucao">Evolução Mensal</TabsTrigger>
                <TabsTrigger value="categorias">Despesas por Categoria</TabsTrigger>
                <TabsTrigger value="responsabilidade">Distribuição por Responsabilidade</TabsTrigger>
              </TabsList>
              
              <TabsContent value="evolucao" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Evolução de Receitas e Despesas</CardTitle>
                    <CardDescription>
                      Análise dos últimos 6 meses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={reportsData.monthlySummary}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="receitas"
                          stroke="#10b981"
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="despesas" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="categorias">
                <Card>
                  <CardHeader>
                    <CardTitle>Despesas por Categoria</CardTitle>
                    <CardDescription>
                      Distribuição de gastos no mês atual
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      <div className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={reportsData.categoryBreakdown}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {reportsData.categoryBreakdown.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `R$ ${value}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <div className="p-4 rounded-lg bg-gray-50">
                          <h4 className="font-medium text-gray-900 mb-3">Detalhamento das Despesas</h4>
                          <ul className="space-y-2">
                            {reportsData.categoryBreakdown.map((category: any, index: number) => (
                              <li key={index} className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.fill }}></div>
                                  <span>{category.name}</span>
                                </div>
                                <span className="font-medium">R$ {category.value.toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="responsabilidade">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Responsabilidade</CardTitle>
                    <CardDescription>
                      Como as despesas estão divididas entre o casal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={reportsData.responsibilityDistribution}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `R$ ${value}`} />
                            <Legend />
                            <Bar dataKey="value" name="Valor" radius={[4, 4, 0, 0]}>
                              {reportsData.responsibilityDistribution.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <div className="p-4 rounded-lg bg-gray-50">
                          <h4 className="font-medium text-gray-900 mb-3">Distribuição de Responsabilidades</h4>
                          <ul className="space-y-2">
                            {reportsData.responsibilityDistribution.map((item: any, index: number) => (
                              <li key={index} className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.fill }}></div>
                                  <span>{item.name}</span>
                                </div>
                                <span className="font-medium">R$ {item.value.toFixed(2)}</span>
                              </li>
                            ))}
                            <li className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                              <span className="font-medium">Total</span>
                              <span className="font-medium">
                                R$ {reportsData.responsibilityDistribution.reduce((acc: number, item: any) => acc + item.value, 0).toFixed(2)}
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-600">Nenhum dado disponível para o período selecionado.</p>
              <Button onClick={fetchReportsData} className="mt-4">
                Carregar Dados
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
