import { WalletPerson } from '@/integrations/supabase/client';

export type BillStatus = 'pending' | 'paid' | 'overdue' | 'to_receive' | 'received';

export type Bill = {
  description: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
  id?: string;
  type?: 'income' | 'expense';
  split_expense?: boolean;
  responsibility?: string;
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
  savings_goal: number;
};

export type DebtInfo = {
  id: string;
  amount: number;
  paid_amount?: number;
  owedTo: WalletPerson;
  owed_to: WalletPerson;
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
  responsibility: string, 
  transactions: any[], 
  categoryMap: {[key: string]: string}
): WalletData => {
  const wallet: WalletData = {
    owner: responsibility,
    balance: 0,
    income: 0,
    expenses: 0,
    bills: [],
    categories: [],
    savings_goal: 0
  };
  
  if (!transactions || transactions.length === 0) {
    return wallet;
  }
  
  const categoryTotals: {[key: string]: number} = {};
  const billsMap: {[key: string]: Bill} = {};
  
  transactions.forEach(transaction => {
    if (transaction.responsibility === responsibility) {
      if (transaction.type === 'income') {
        if (transaction.status === 'received') {
          wallet.income += parseFloat(String(transaction.amount));
          wallet.balance += parseFloat(transaction.amount);
        }
        
        if (transaction.status === 'to_receive') {
          const billKey = `${transaction.description}-${transaction.due_date || 'no-date'}-${transaction.id}`;
          
          if (!billsMap[billKey]) {
            billsMap[billKey] = {
              description: transaction.description,
              amount: parseFloat(transaction.amount),
              dueDate: transaction.due_date || new Date().toISOString().split('T')[0],
              status: transaction.status || 'to_receive',
              id: transaction.id
            };
          }
        }
      } else if (transaction.type === 'expense') {
        if (transaction.status === 'paid') {
          wallet.expenses += parseFloat(transaction.amount);
          wallet.balance -= parseFloat(transaction.amount);
        }
        
        const categoryName = transaction.category_id && categoryMap[transaction.category_id] 
          ? categoryMap[transaction.category_id] 
          : 'Outros';
          
        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = 0;
        }
        categoryTotals[categoryName] += parseFloat(transaction.amount);
        
        if (transaction.status === 'pending' || transaction.status === 'overdue') {
          const billKey = `${transaction.description}-${transaction.due_date || 'no-date'}-${transaction.id}`;
          
          if (!billsMap[billKey]) {
            billsMap[billKey] = {
              description: transaction.description,
              amount: parseFloat(transaction.amount),
              dueDate: transaction.due_date || new Date().toISOString().split('T')[0],
              status: transaction.status || 'pending',
              id: transaction.id
            };
          }
        }
      }
    }
  });
  
  const colors = ['#FF8042', '#00C49F', '#FFBB28', '#0088FE', '#8884d8', '#ffc658', '#82ca9d'];
  wallet.categories = Object.entries(categoryTotals).map(([name, value], index) => ({
    name,
    value,
    fill: colors[index % colors.length]
  }));
  
  wallet.bills = Object.values(billsMap);
  
  return wallet;
};

export const getTotalOwedByPerson = (debts: DebtInfo[], person: WalletPerson): number => {
  return debts
    .filter(debt => debt.owed_by === person && !debt.is_paid)
    .reduce((total, debt) => {
      const paidAmount = debt.paid_amount || 0;
      const remainingAmount = debt.amount - paidAmount;
      return total + remainingAmount;
    }, 0);
};

export const getTotalOwedToPerson = (debts: DebtInfo[], person: WalletPerson): number => {
  return debts
    .filter(debt => debt.owed_to === person && !debt.is_paid)
    .reduce((total, debt) => {
      const paidAmount = debt.paid_amount || 0;
      const remainingAmount = debt.amount - paidAmount;
      return total + remainingAmount;
    }, 0);
};

export const getNetDebtAmount = (debts: DebtInfo[], person: WalletPerson): number => {
  const totalOwed = getTotalOwedByPerson(debts, person);
  const totalDue = getTotalOwedToPerson(debts, person);
  return totalDue - totalOwed;
};
