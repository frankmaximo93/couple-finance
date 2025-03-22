
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

    console.log('Processing casal transaction with ID:', transactionId);

    // Calculate 50% split for each person
    const splitAmount = parseFloat((transaction.amount / 2).toFixed(2));
    
    // Check if there are already individual transactions
    if (transactionId) {
      const { data: existingTxs, error: queryError } = await supabase
        .from('transactions')
        .select('id, responsibility')
        .eq('parent_transaction_id', transactionId);
        
      if (queryError) {
        console.error('Error checking existing individual transactions:', queryError);
        throw queryError;
      }
      
      // If transactions already exist, update them instead of creating new ones
      if (existingTxs && existingTxs.length > 0) {
        console.log('Updating existing individual transactions:', existingTxs);
        
        for (const tx of existingTxs) {
          const { error: updateError } = await supabase
            .from('transactions')
            .update({
              description: `${transaction.description} (50%)`,
              amount: splitAmount,
              category_id: transaction.category_id,
              date: transaction.date,
              type: transaction.type,
              payment_method: transaction.payment_method,
              installments: transaction.installments,
              due_date: transaction.due_date,
              status: transaction.status,
              is_recurring: transaction.is_recurring
            })
            .eq('id', tx.id);
            
          if (updateError) {
            console.error('Error updating individual transaction:', updateError);
            throw updateError;
          }
        }
        
        console.log('Individual transactions updated successfully');
        return true;
      }
    }

    // Create two individual transactions (one for franklin, one for michele)
    const individualTransactions = [
      {
        ...transaction,
        responsibility: 'franklin',
        amount: splitAmount,
        parent_transaction_id: transactionId,
        description: `${transaction.description} (50%)`,
        split_expense: false,
        paid_by: null,
      },
      {
        ...transaction,
        responsibility: 'michele',
        amount: splitAmount,
        parent_transaction_id: transactionId,
        description: `${transaction.description} (50%)`,
        split_expense: false,
        paid_by: null,
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

    console.log('Transação dividida com sucesso:', individualTransactions);
    return true;
  } catch (error) {
    console.error('Erro ao processar divisão de transação:', error);
    toast.error('Erro ao dividir a transação entre as carteiras');
    return false;
  }
};

/**
 * Creates a debt record between two people when one person pays for both
 */
export const createDebtRecord = async (transaction: TransactionData, transactionId: string): Promise<boolean> => {
  try {
    if (!transaction.split_expense || !transaction.paid_by || transaction.responsibility !== 'casal' || transaction.type !== 'expense') {
      // If there's an existing debt record but split_expense is now false, delete it
      if (!transaction.split_expense && transactionId) {
        console.log('Removing debt record for transaction:', transactionId);
        const { error: deleteError } = await supabase
          .from('debts')
          .delete()
          .eq('transaction_id', transactionId);
          
        if (deleteError) {
          console.error('Error removing debt record:', deleteError);
        }
      }
      return true;
    }

    const owedBy = transaction.paid_by === 'franklin' ? 'michele' : 'franklin';
    const halfAmount = parseFloat((transaction.amount / 2).toFixed(2));
    
    // Check if debt record already exists
    const { data: existingDebt, error: checkError } = await supabase
      .from('debts')
      .select('id')
      .eq('transaction_id', transactionId);
      
    if (checkError) {
      console.error('Error checking existing debt:', checkError);
      throw checkError;
    }
    
    if (existingDebt && existingDebt.length > 0) {
      console.log('Updating existing debt record for transaction:', transactionId);
      
      // Update existing debt record
      const { error: updateError } = await supabase
        .from('debts')
        .update({
          owed_by: owedBy,
          owed_to: transaction.paid_by,
          amount: halfAmount,
          is_paid: false,
          paid_amount: 0
        })
        .eq('transaction_id', transactionId);
        
      if (updateError) {
        console.error('Error updating debt record:', updateError);
        throw updateError;
      }
    } else {
      console.log('Creating new debt record for transaction:', transactionId);
      
      // Create new debt record
      const { error } = await supabase
        .from('debts')
        .insert({
          transaction_id: transactionId,
          owed_by: owedBy,
          owed_to: transaction.paid_by,
          amount: halfAmount,
          is_paid: false,
          paid_amount: 0
        });
        
      if (error) {
        console.error('Erro ao criar registro de dívida:', error);
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao criar registro de dívida:', error);
    toast.error('Erro ao registrar dívida entre o casal');
    return false;
  }
};

/**
 * Creates or updates a transaction with automatic splitting if it's a 'casal' transaction
 */
export const saveTransaction = async (transaction: TransactionData, isUpdate = false, transactionId?: string): Promise<boolean> => {
  try {
    console.log('Salvando transação:', transaction, 'isUpdate:', isUpdate, 'transactionId:', transactionId);
    
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
    
    // Get the ID of the transaction we just created/updated
    const createdTransactionId = isUpdate ? transactionId : response.data?.[0]?.id;
    
    // If it's a 'casal' transaction, split it and create debt if necessary
    if (transaction.responsibility === 'casal' && createdTransactionId) {
      console.log('Processando transação do casal...');
      
      // Always split for casal transactions
      const splitSuccess = await handleCasalTransaction(transaction, createdTransactionId);
      
      // Only create debt record if it's an expense, split is enabled, and someone paid for it
      if (splitSuccess && transaction.split_expense && transaction.paid_by && transaction.type === 'expense') {
        await createDebtRecord(transaction, createdTransactionId);
      } else if (transaction.type === 'expense') {
        // Even if not splitting the expense between people, we still need to manage any existing debt record
        await createDebtRecord(transaction, createdTransactionId);
      }
      
      return splitSuccess;
    } else if (isUpdate && transactionId) {
      // If responsibility changed from 'casal' to individual, clean up any split transactions
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('parent_transaction_id', transactionId);
        
      if (error) {
        console.error('Error cleaning up split transactions:', error);
      }
      
      // Also clean up any debt records
      const { error: debtError } = await supabase
        .from('debts')
        .delete()
        .eq('transaction_id', transactionId);
        
      if (debtError) {
        console.error('Error cleaning up debt record:', debtError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar transação:', error);
    toast.error('Erro ao salvar a transação');
    return false;
  }
};
