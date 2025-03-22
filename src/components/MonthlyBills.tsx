import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bill, BillStatus, formatCurrency, formatDate } from '@/utils/walletUtils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';
import { useWalletData } from '@/hooks/useWalletData';
import { useAuth } from '@/context/AuthContext';

type MonthlyBillsProps = {
  isActive: boolean;
};

const MonthlyBills = ({ isActive }: MonthlyBillsProps) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { wallets } = useWalletData(isActive, user?.id);

  useEffect(() => {
    if (isActive && user) {
      fetchBills();
    }
  }, [isActive, user]);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      // Get current month range
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      console.log(`Fetching bills from ${firstDay} to ${lastDay}`);
      
      // Fetch transactions that are due this month (including casal transactions)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`due_date.gte.${firstDay},due_date.lte.${lastDay},and(type.eq.expense,status.eq.pending),and(type.eq.income,status.eq.to_receive)`)
        .order('due_date', { ascending: true });
        
      if (error) {
        console.error('Erro ao buscar contas do mês:', error);
        toast.error('Não foi possível carregar as contas deste mês');
        setBills([]);
      } else {
        console.log(`Found ${data?.length || 0} transactions for the month`);
        
        // Transform transactions into bills with proper type casting
        const monthlyBills = (data || []).map(transaction => ({
          id: transaction.id,
          description: transaction.description + (transaction.split_expense ? ' (Compartilhado)' : ''),
          amount: parseFloat(String(transaction.amount)), // Convert to string first to fix type error
          dueDate: transaction.due_date || transaction.date,
          status: transaction.status as BillStatus,
          responsibility: transaction.responsibility,
          split_expense: transaction.split_expense,
          type: transaction.type as 'income' | 'expense' // Explicitly cast to the union type
        }));
        
        setBills(monthlyBills);
      }
    } catch (error) {
      console.error('Erro ao processar contas do mês:', error);
      toast.error('Erro ao processar as contas deste mês');
      setBills([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBillStatus = async (id: string, newStatus: BillStatus) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      setBills(bills.map(bill => 
        bill.id === id ? { ...bill, status: newStatus } : bill
      ));
      
      toast.success('Status da conta atualizado!');
      
    } catch (error) {
      console.error('Erro ao atualizar status da conta:', error);
      toast.error('Não foi possível atualizar o status');
    }
  };

  // Calculate totals
  const getTotalIncome = () => {
    return bills
      .filter(bill => bill.type === 'income')
      .reduce((sum, bill) => sum + bill.amount, 0);
  };

  const getTotalExpenses = () => {
    return bills
      .filter(bill => bill.type === 'expense')
      .reduce((sum, bill) => sum + bill.amount, 0);
  };

  const getStatusBadge = (status: BillStatus) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Pago</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Atrasado</Badge>;
      case 'received':
        return <Badge className="bg-green-500">Recebido</Badge>;
      case 'to_receive':
        return <Badge className="bg-blue-500">A Receber</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pendente</Badge>;
    }
  };

  const getStatusActions = (bill: Bill & { id?: string, responsibility?: string }) => {
    if (!bill.id) return null;
    
    if (bill.status === 'pending') {
      return (
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="ghost"
            className="p-0"
            onClick={() => updateBillStatus(bill.id!, 'paid')}
          >
            <CheckCircle className="h-5 w-5 text-green-500" />
          </Button>
          <Button 
            size="sm"
            variant="ghost"
            className="p-0"
            onClick={() => updateBillStatus(bill.id!, 'overdue')}
          >
            <XCircle className="h-5 w-5 text-red-500" />
          </Button>
        </div>
      );
    } else if (bill.status === 'to_receive') {
      return (
        <Button 
          size="sm" 
          variant="ghost"
          className="p-0"
          onClick={() => updateBillStatus(bill.id!, 'received')}
        >
          <CheckCircle className="h-5 w-5 text-green-500" />
        </Button>
      );
    }
    
    return null;
  };

  if (!isActive) return null;

  return (
    <div className="animate-fade-in">
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Contas do Mês</CardTitle>
            <div className="flex gap-2 text-sm">
              <div className="text-gray-600 flex flex-col items-end">
                <span>Franklin:</span>
                <span className="font-medium">{formatCurrency(wallets.franklin?.balance || 0)}</span>
              </div>
              <div className="text-gray-600 flex flex-col items-end">
                <span>Michele:</span>
                <span className="font-medium">{formatCurrency(wallets.michele?.balance || 0)}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse-shadow h-8 w-8 rounded-full bg-blue-500"></div>
            </div>
          ) : bills.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-auto max-h-[400px] pr-2">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                      <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                      <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Resp.</th>
                      <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bills.map((bill) => (
                      <tr 
                        key={`${bill.id}-${bill.description}`} 
                        className={`hover:bg-gray-50 ${bill.split_expense ? 'bg-blue-50' : ''} ${bill.type === 'income' ? 'bg-green-50' : ''}`}
                      >
                        <td className="py-2 px-3 whitespace-nowrap text-sm font-medium text-gray-900">{bill.description}</td>
                        <td className="py-2 px-3 whitespace-nowrap text-sm text-right font-medium">{formatCurrency(bill.amount)}</td>
                        <td className="py-2 px-3 whitespace-nowrap text-sm text-center text-gray-500">{formatDate(bill.dueDate)}</td>
                        <td className="py-2 px-3 whitespace-nowrap text-center">{getStatusBadge(bill.status)}</td>
                        <td className="py-2 px-3 whitespace-nowrap text-sm text-center text-gray-500 capitalize">{bill.responsibility}</td>
                        <td className="py-2 px-3 whitespace-nowrap text-center">{getStatusActions(bill as Bill & { id?: string, responsibility?: string })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="text-sm bg-green-50 p-3 rounded">
                  <span className="font-medium">Total Receitas:</span> {formatCurrency(getTotalIncome())}
                </div>
                <div className="text-sm bg-red-50 p-3 rounded">
                  <span className="font-medium">Total Despesas:</span> {formatCurrency(getTotalExpenses())}
                </div>
                <div className="text-sm bg-gray-50 p-3 rounded">
                  <span className="font-medium">Total Geral:</span> {formatCurrency(getTotalIncome() - getTotalExpenses())}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Não há contas para o mês atual.</p>
              <Button 
                onClick={fetchBills}
                variant="outline"
                className="mt-4"
              >
                Atualizar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyBills;
