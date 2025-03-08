
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TransactionData = {
  user_id: string;
  description: string;
  amount: number;
  category_id?: string;
  date: string;
  type: 'income' | 'expense';
  responsibility: string;
  payment_method?: string;
  installments?: number;
  due_date?: string;
  split_expense?: boolean;
  paid_by?: string;
  is_recurring?: boolean;
  status?: string;
};

/**
 * Handles split transactions when 'casal' is selected as responsibility
 * Automatically creates two individual transactions (franklin/michele) with 50% of the amount
 */
export const handleCasalTransaction = async (transaction: TransactionData, transactionId?: string): Promise<boolean> => {
  try {
    // Only split if responsibility is 'casal'
    if (transaction.responsibility !== 'casal') {
      return true;
    }

    // Calculate 50% split for each person
    const splitAmount = parseFloat((transaction.amount / 2).toFixed(2));
    
    // Create two individual transactions (one for franklin, one for michele)
    const individualTransactions = [
      {
        ...transaction,
        responsibility: 'franklin',
        amount: splitAmount,
        parent_transaction_id: transactionId,
        description: `${transaction.description} (50%)`,
      },
      {
        ...transaction,
        responsibility: 'michele',
        amount: splitAmount,
        parent_transaction_id: transactionId,
        description: `${transaction.description} (50%)`,
      }
    ];

    // Insert the split transactions
    for (const indTx of individualTransactions) {
      const { error } = await supabase.from('transactions').insert(indTx);
      
      if (error) {
        console.error('Erro ao dividir transação:', error);
        throw error;
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao processar divisão de transação:', error);
    toast.error('Erro ao dividir a transação entre as carteiras');
    return false;
  }
};

/**
 * Creates or updates a transaction with automatic splitting if it's a 'casal' transaction
 */
export const saveTransaction = async (transaction: TransactionData, isUpdate = false, transactionId?: string): Promise<boolean> => {
  try {
    // Create or update the main transaction
    let response;
    
    if (isUpdate && transactionId) {
      // Update existing transaction
      response = await supabase
        .from('transactions')
        .update(transaction)
        .eq('id', transactionId);
    } else {
      // Create new transaction
      response = await supabase
        .from('transactions')
        .insert(transaction)
        .select();
    }
    
    if (response.error) {
      throw response.error;
    }
    
    // If we're updating a transaction, we need to delete any existing split transactions
    if (isUpdate && transactionId) {
      // Delete previous split transactions if they exist
      await supabase
        .from('transactions')
        .delete()
        .eq('parent_transaction_id', transactionId);
    }
    
    // Get the ID of the transaction we just created/updated
    const createdTransactionId = isUpdate ? transactionId : response.data?.[0]?.id;
    
    // If it's a 'casal' transaction, split it
    if (transaction.responsibility === 'casal' && createdTransactionId) {
      return await handleCasalTransaction(transaction, createdTransactionId);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar transação:', error);
    toast.error('Erro ao salvar a transação');
    return false;
  }
};
