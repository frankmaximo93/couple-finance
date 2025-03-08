
import { useState } from 'react';
import { saveTransaction } from '@/utils/transactionUtils';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

type TransactionFormData = {
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

type UseTransactionFormProps = {
  onSuccess?: () => void;
  initialData?: TransactionFormData;
  transactionId?: string;
};

export function useTransactionForm({ onSuccess, initialData, transactionId }: UseTransactionFormProps = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  const defaultFormData: TransactionFormData = {
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    responsibility: 'franklin',
    payment_method: 'cash',
    installments: 1,
    status: 'pending',
  };
  
  const [formData, setFormData] = useState<TransactionFormData>(initialData || defaultFormData);
  
  const handleChange = (field: keyof TransactionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Você precisa estar logado para salvar uma transação');
      return;
    }
    
    if (!formData.description || formData.amount <= 0) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const transactionData = {
        ...formData,
        user_id: user.id,
      };
      
      const isUpdate = !!transactionId;
      const success = await saveTransaction(transactionData, isUpdate, transactionId);
      
      if (success) {
        toast.success(isUpdate ? 'Transação atualizada!' : 'Transação registrada!');
        
        // Reset form after successful submission if it's a new transaction
        if (!isUpdate) {
          setFormData(defaultFormData);
        }
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    formData,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFormData,
  };
}
