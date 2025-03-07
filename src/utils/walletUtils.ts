
import { WalletPerson } from '@/integrations/supabase/client';

export type BillStatus = 'pending' | 'paid' | 'overdue';

export type Bill = {
  description: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
};

export type CategoryData = {
  name: string;
  value: number;
  fill: string;
};

export type WalletData = {
  owner: string;
  balance: number;
  income: number;
  expenses: number;
  bills: Bill[];
  categories: CategoryData[];
};

export type DebtInfo = {
  id: string;
  amount: number;
  owedTo: WalletPerson;
  owed_to: WalletPerson; // Keep both properties for compatibility
  owed_by: WalletPerson;
  description: string;
  is_paid: boolean;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

export const buildWalletData = (
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

export const getTotalOwedByPerson = (debts: DebtInfo[], person: WalletPerson): number => {
  return debts
    .filter(debt => debt.owed_by === person && !debt.is_paid)
    .reduce((total, debt) => total + debt.amount, 0);
};

export const getTotalOwedToPerson = (debts: DebtInfo[], person: WalletPerson): number => {
  return debts
    .filter(debt => debt.owed_to === person && !debt.is_paid)
    .reduce((total, debt) => total + debt.amount, 0);
};

export const getNetDebtAmount = (debts: DebtInfo[], person: WalletPerson): number => {
  const totalOwed = getTotalOwedByPerson(debts, person);
  const totalDue = getTotalOwedToPerson(debts, person);
  return totalDue - totalOwed;
};
