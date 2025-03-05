
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, X, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ptBR } from "date-fns/locale";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

type MonthlyBillsProps = {
  isActive: boolean;
};

type BillStatus = 'pending' | 'paid' | 'overdue' | 'upcoming';
type Responsibility = 'casal' | 'franklin' | 'michele';

type Bill = {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: BillStatus;
  responsibility: Responsibility;
  category: string;
  is_recurring: boolean;
};

const MonthlyBills = ({ isActive }: MonthlyBillsProps) => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(new Date());
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newBill, setNewBill] = useState({
    name: '',
    amount: '',
    dueDate: new Date(),
    responsibility: 'casal' as Responsibility,
    category: '',
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (isActive && user) {
      fetchCategories();
      fetchMonthlyBills();
    }
  }, [isActive, selectedMonth, user]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
        
      if (error) throw error;
      
      setCategories(data || []);
      
      // Set default category if available
      if (data && data.length > 0) {
        setNewBill(prev => ({ ...prev, category: data[0].id }));
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const fetchMonthlyBills = async () => {
    if (!selectedMonth || !user) return;
    
    setIsLoading(true);
    try {
      // Get first and last day of selected month
      const firstDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const lastDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      
      const firstDayStr = firstDay.toISOString().split('T')[0];
      const lastDayStr = lastDay.toISOString().split('T')[0];
      
      // Fetch fixed/recurring expenses for all months
      const { data: recurringData, error: recurringError } = await supabase
        .from('transactions')
        .select('id, description, amount, due_date, date, status, responsibility, category_id, is_recurring')
        .eq('is_recurring', true)
        .eq('type', 'expense');
        
      if (recurringError) throw recurringError;
      
      // Fetch regular expenses for the selected month
      const { data: regularData, error: regularError } = await supabase
        .from('transactions')
        .select('id, description, amount, due_date, date, status, responsibility, category_id, is_recurring')
        .eq('type', 'expense')
        .or(`due_date.gte.${firstDayStr},due_date.lte.${lastDayStr},date.gte.${firstDayStr},date.lte.${lastDayStr}`);
        
      if (regularError) throw regularError;
      
      // Fetch categories to get names
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name');
        
      if (categoriesError) throw categoriesError;
      
      // Create category lookup
      const categoryMap: Record<string, string> = {};
      categoriesData.forEach((cat: {id: string, name: string}) => {
        categoryMap[cat.id] = cat.name;
      });
      
      // Combine and process data
      const processedBills: Bill[] = [...recurringData, ...regularData]
        // Remove duplicates (items that are both recurring and in the current month)
        .filter((bill, index, self) => 
          index === self.findIndex((b) => b.id === bill.id)
        )
        .map(bill => ({
          id: bill.id,
          description: bill.description,
          amount: bill.amount,
          due_date: bill.due_date || bill.date,
          // Cast the status string to BillStatus type, or use 'pending' as default
          status: (bill.status as BillStatus) || 'pending',
          // Cast the responsibility string to Responsibility type, or use 'casal' as default
          responsibility: (bill.responsibility as Responsibility) || 'casal',
          category: categoryMap[bill.category_id] || 'Outro',
          is_recurring: bill.is_recurring
        }));
      
      setBills(processedBills);
    } catch (error) {
      console.error('Erro ao buscar contas do mês:', error);
      toast.error('Erro ao carregar contas do mês');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBill = async () => {
    if (!newBill.name || !newBill.amount || !user) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const amount = parseFloat(newBill.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Valor precisa ser um número positivo');
      return;
    }

    try {
      setIsLoading(true);
      
      const billData = {
        user_id: user.id,
        description: newBill.name,
        amount: amount,
        category_id: newBill.category,
        date: format(new Date(), 'yyyy-MM-dd'),
        due_date: format(newBill.dueDate, 'yyyy-MM-dd'),
        type: 'expense',
        responsibility: newBill.responsibility,
        status: 'pending' as BillStatus,
        is_recurring: true
      };
      
      const { data, error } = await supabase
        .from('transactions')
        .insert(billData)
        .select()
        .single();
        
      if (error) throw error;
      
      // Add the new bill to the local state
      const categoryName = categories.find(c => c.id === newBill.category)?.name || 'Outro';
      
      const newBillObject: Bill = {
        id: data.id,
        description: data.description,
        amount: data.amount,
        due_date: data.due_date,
        status: data.status as BillStatus,
        responsibility: data.responsibility as Responsibility,
        category: categoryName,
        is_recurring: data.is_recurring
      };
      
      setBills([...bills, newBillObject]);
      
      // Reset form
      setNewBill({
        name: '',
        amount: '',
        dueDate: new Date(),
        responsibility: 'casal',
        category: categories.length > 0 ? categories[0].id : '',
      });
      
      setShowAddForm(false);
      toast.success('Conta adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar conta:', error);
      toast.error('Erro ao adicionar conta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeStatus = async (id: string, newStatus: BillStatus) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      const updatedBills = bills.map(bill => 
        bill.id === id ? { ...bill, status: newStatus } : bill
      );
      
      setBills(updatedBills);
      
      const statusMessages = {
        paid: 'Conta marcada como paga!',
        pending: 'Conta marcada como pendente',
        overdue: 'Conta marcada como atrasada',
        upcoming: 'Conta marcada como próxima'
      };
      
      toast.success(statusMessages[newStatus]);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" /> Pago</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500"><X className="h-3 w-3 mr-1" /> Atrasado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><AlertCircle className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" /> Próximo</Badge>;
      default:
        return null;
    }
  };

  const getTotalAmount = () => {
    return bills.reduce((total, bill) => total + bill.amount, 0);
  };

  const getPaidAmount = () => {
    return bills
      .filter(bill => bill.status === 'paid')
      .reduce((total, bill) => total + bill.amount, 0);
  };

  const getPendingAmount = () => {
    return bills
      .filter(bill => bill.status === 'pending' || bill.status === 'overdue')
      .reduce((total, bill) => total + bill.amount, 0);
  };

  if (!isActive) return null;

  return (
    <div className="animate-fade-in">
      <div className="glass-card rounded-2xl p-6 shadow-md">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-2xl font-medium text-gray-800">Contas do Mês</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[240px] justify-start text-left font-normal",
                      !selectedMonth && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedMonth ? (
                      format(selectedMonth, "MMMM yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione o mês</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedMonth}
                    onSelect={setSelectedMonth}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button 
                onClick={() => setShowAddForm(!showAddForm)}
                variant="default"
              >
                {showAddForm ? 'Cancelar' : 'Nova Conta'}
              </Button>
            </div>
          </div>

          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Adicionar Nova Conta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="bill-name" className="text-sm font-medium">Nome da Conta</label>
                      <Input
                        id="bill-name"
                        placeholder="Ex: Aluguel, Energia..."
                        value={newBill.name}
                        onChange={(e) => setNewBill({...newBill, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="bill-amount" className="text-sm font-medium">Valor (R$)</label>
                      <Input
                        id="bill-amount"
                        type="number"
                        placeholder="0,00"
                        value={newBill.amount}
                        onChange={(e) => setNewBill({...newBill, amount: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data de Vencimento</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newBill.dueDate ? format(newBill.dueDate, "dd/MM/yyyy") : <span>Selecione a data</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newBill.dueDate}
                            onSelect={(date) => setNewBill({...newBill, dueDate: date || new Date()})}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Responsabilidade</label>
                      <Select 
                        value={newBill.responsibility}
                        onValueChange={(value) => setNewBill({...newBill, responsibility: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="casal">Casal</SelectItem>
                          <SelectItem value="franklin">Franklin</SelectItem>
                          <SelectItem value="michele">Michele</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Categoria</label>
                      <Select
                        value={newBill.category}
                        onValueChange={(value) => setNewBill({...newBill, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleAddBill}>Adicionar Conta</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Total</p>
                    <p className="text-2xl font-bold">R$ {getTotalAmount().toFixed(2)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                    <CalendarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Pago</p>
                    <p className="text-2xl font-bold">R$ {getPaidAmount().toFixed(2)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-50 to-red-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800">Pendente</p>
                    <p className="text-2xl font-bold">R$ {getPendingAmount().toFixed(2)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse-shadow h-12 w-12 rounded-full bg-blue-500"></div>
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600">Nenhuma conta registrada para este mês.</p>
              <Button onClick={() => setShowAddForm(true)} className="mt-4">
                Adicionar Nova Conta
              </Button>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Lista de Contas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Nome</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Categoria</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Valor</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Vencimento</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Responsabilidade</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Recorrente</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.map((bill) => (
                        <tr key={bill.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium">{bill.description}</td>
                          <td className="py-3 px-4 text-sm">{bill.category}</td>
                          <td className="py-3 px-4 text-sm font-medium">R$ {bill.amount.toFixed(2)}</td>
                          <td className="py-3 px-4 text-sm">
                            {format(new Date(bill.due_date), 'dd/MM/yyyy')}
                          </td>
                          <td className="py-3 px-4 text-sm capitalize">{bill.responsibility}</td>
                          <td className="py-3 px-4 text-sm">
                            {getStatusBadge(bill.status)}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {bill.is_recurring ? 'Sim' : 'Não'}
                          </td>
                          <td className="py-2 px-4 text-right">
                            <Select 
                              defaultValue={bill.status}
                              onValueChange={(value) => handleChangeStatus(
                                bill.id, 
                                value as BillStatus
                              )}
                            >
                              <SelectTrigger className="w-28 h-8">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="paid">Pago</SelectItem>
                                <SelectItem value="overdue">Atrasado</SelectItem>
                                <SelectItem value="upcoming">Próximo</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyBills;
