import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog';
import { Input } from './ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Category = {
  id: string;
  name: string;
};

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  category_id: string;
  category_name?: string;
  date: string;
  type: string;
  responsibility: string;
  payment_method?: 'cash' | 'credit' | null;
  installments?: number;
  due_date?: string;
  split_expense?: boolean;
  paid_by?: string;
  status: 'pending' | 'paid' | 'overdue' | 'to_receive' | 'received';
  is_recurring: boolean;
};

type EditTransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onTransactionUpdated: () => void;
};

const EditTransactionDialog = ({ 
  open, 
  onOpenChange, 
  transaction, 
  onTransactionUpdated 
}: EditTransactionDialogProps) => {
  const [formData, setFormData] = useState<Omit<Transaction, 'id' | 'category_name'> & { id?: string }>({
    description: '',
    amount: 0,
    category_id: '',
    date: '',
    type: 'expense',
    responsibility: '',
    payment_method: 'cash',
    installments: 1,
    due_date: '',
    split_expense: false,
    paid_by: '',
    status: 'pending',
    is_recurring: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSplitOptions, setShowSplitOptions] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (open) {
      fetchCategories();
      
      if (transaction) {
        setFormData({
          id: transaction.id,
          description: transaction.description,
          amount: transaction.amount,
          category_id: transaction.category_id,
          date: transaction.date,
          type: transaction.type,
          responsibility: transaction.responsibility,
          payment_method: transaction.payment_method || 'cash',
          installments: transaction.installments || 1,
          due_date: transaction.due_date || '',
          split_expense: transaction.split_expense || false,
          paid_by: transaction.paid_by || '',
          status: transaction.status,
          is_recurring: transaction.is_recurring
        });
        
        if (transaction.due_date) {
          setDueDate(new Date(transaction.due_date));
        }
        
        setShowSplitOptions(transaction.responsibility === 'casal');
      }
    }
  }, [open, transaction]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
        
      if (error) {
        throw error;
      }
      
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      toast.error('Não foi possível carregar as categorias');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount' || name === 'installments') {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'amount' ? parseFloat(value) : parseInt(value, 10)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (name === 'responsibility' && value === 'casal') {
      setShowSplitOptions(true);
    } else if (name === 'responsibility' && value !== 'casal') {
      setShowSplitOptions(false);
      setFormData(prev => ({
        ...prev,
        split_expense: false,
        paid_by: ''
      }));
    }
    
    if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        status: value === 'income' ? 'to_receive' : 'pending'
      }));
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (name === 'responsibility' && value === 'casal') {
      setShowSplitOptions(true);
    } else if (name === 'responsibility' && value !== 'casal') {
      setShowSplitOptions(false);
      setFormData(prev => ({
        ...prev,
        split_expense: false,
        paid_by: ''
      }));
    }
    
    if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        status: value === 'income' ? 'to_receive' : 'pending'
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleDueDateSelect = (date: Date | undefined) => {
    setDueDate(date);
    if (date) {
      setFormData(prev => ({
        ...prev,
        due_date: date.toISOString().split('T')[0]
      }));
    }
  };
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Valor deve ser um número positivo';
    }
    
    if (!formData.category_id) {
      newErrors.category_id = 'Categoria é obrigatória';
    }
    
    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    }
    
    if (!formData.type) {
      newErrors.type = 'Tipo é obrigatório';
    }
    
    if (!formData.responsibility) {
      newErrors.responsibility = 'Responsabilidade é obrigatória';
    }

    if (formData.payment_method === 'credit') {
      if (!formData.installments || formData.installments < 1) {
        newErrors.installments = 'Número de parcelas deve ser pelo menos 1';
      }
      
      if (!formData.due_date) {
        newErrors.due_date = 'Data de vencimento é obrigatória para compras no crédito';
      }
    }

    if (formData.split_expense && !formData.paid_by) {
      newErrors.paid_by = 'É necessário informar quem pagou a despesa compartilhada';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const updateDebtRecord = async (transactionId: string, amount: number, paidBy: string, splitExpense: boolean) => {
    if (!splitExpense) {
      try {
        const { error } = await supabase
          .from('debts')
          .delete()
          .eq('transaction_id', transactionId);
          
        if (error) console.error('Error deleting debt record:', error);
        return;
      } catch (error) {
        console.error('Error deleting debt record:', error);
        return;
      }
    }
    
    const owedBy = paidBy === 'franklin' ? 'michele' : 'franklin';
    const halfAmount = amount / 2;
    
    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('transaction_id', transactionId);
        
      if (error) {
        console.error('Error checking for existing debt:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const { error: updateError } = await supabase
          .from('debts')
          .update({
            owed_by: owedBy,
            owed_to: paidBy,
            amount: halfAmount,
            is_paid: false
          })
          .eq('transaction_id', transactionId);
          
        if (updateError) console.error('Error updating debt record:', updateError);
      } else {
        const { error: insertError } = await supabase
          .from('debts')
          .insert({
            transaction_id: transactionId,
            owed_by: owedBy,
            owed_to: paidBy,
            amount: halfAmount,
            is_paid: false
          });
          
        if (insertError) console.error('Error creating debt record:', insertError);
      }
    } catch (error) {
      console.error('Error managing debt record:', error);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate() || !formData.id) return;
    
    setIsSubmitting(true);
    
    try {
      const transactionData = {
        description: formData.description,
        amount: formData.amount,
        category_id: formData.category_id,
        date: formData.date,
        type: formData.type,
        responsibility: formData.responsibility,
        payment_method: formData.payment_method,
        installments: formData.installments,
        due_date: formData.due_date,
        split_expense: formData.split_expense,
        paid_by: formData.split_expense ? formData.paid_by : null,
        status: formData.status,
        is_recurring: formData.is_recurring
      };

      const { error } = await supabase
        .from('transactions')
        .update(transactionData)
        .eq('id', formData.id);
      
      if (error) {
        throw error;
      }
      
      if (formData.split_expense && formData.paid_by) {
        await updateDebtRecord(formData.id, formData.amount, formData.paid_by, formData.split_expense);
      } else {
        await updateDebtRecord(formData.id, 0, '', false);
      }
      
      toast.success('Transação atualizada com sucesso!');
      onTransactionUpdated();
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Erro ao atualizar transação:', error);
      toast.error('Erro ao atualizar transação: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={errors.description ? 'border-red-300 bg-red-50' : ''}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className={errors.amount ? 'border-red-300 bg-red-50' : ''}
                step="0.01"
                min="0.01"
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={errors.date ? 'border-red-300 bg-red-50' : ''}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleSelectChange('type', value)}
              >
                <SelectTrigger className={errors.type ? 'border-red-300 bg-red-50' : ''}>
                  <SelectValue placeholder="Selecione o Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-red-500 text-xs mt-1">{errors.type}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category_id">Categoria</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => handleSelectChange('category_id', value)}
              >
                <SelectTrigger className={errors.category_id ? 'border-red-300 bg-red-50' : ''}>
                  <SelectValue placeholder="Selecione a Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && (
                <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsibility">Responsabilidade</Label>
              <Select
                value={formData.responsibility}
                onValueChange={(value) => handleSelectChange('responsibility', value)}
              >
                <SelectTrigger className={errors.responsibility ? 'border-red-300 bg-red-50' : ''}>
                  <SelectValue placeholder="Selecione a Responsabilidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casal">Casal</SelectItem>
                  <SelectItem value="franklin">Franklim</SelectItem>
                  <SelectItem value="michele">Michele</SelectItem>
                </SelectContent>
              </Select>
              {errors.responsibility && (
                <p className="text-red-500 text-xs mt-1">{errors.responsibility}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pagamento</Label>
              <Select
                value={formData.payment_method || 'cash'}
                onValueChange={(value) => handleSelectChange('payment_method', value as 'cash' | 'credit')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">À Vista</SelectItem>
                  <SelectItem value="credit">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.payment_method === 'credit' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="installments">Número de Parcelas</Label>
                  <Input
                    type="number"
                    id="installments"
                    name="installments"
                    value={formData.installments}
                    onChange={handleChange}
                    className={errors.installments ? 'border-red-300 bg-red-50' : ''}
                    min="1"
                    max="24"
                  />
                  {errors.installments && (
                    <p className="text-red-500 text-xs mt-1">{errors.installments}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Data de Vencimento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          errors.due_date ? 'border-red-300 bg-red-50' : ''
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, 'PPP', { locale: ptBR }) : 'Selecione uma data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={handleDueDateSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.due_date && (
                    <p className="text-red-500 text-xs mt-1">{errors.due_date}</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange('status', value as 'pending' | 'paid' | 'overdue' | 'to_receive' | 'received')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Status" />
                </SelectTrigger>
                <SelectContent>
                  {formData.type === 'income' ? (
                    <>
                      <SelectItem value="to_receive">A Receber</SelectItem>
                      <SelectItem value="received">Recebido</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="overdue">Atrasado</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex items-center gap-2">
              <Switch
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => handleSwitchChange('is_recurring', checked)}
              />
              <Label htmlFor="is_recurring">Despesa Fixa/Recorrente</Label>
            </div>

            {showSplitOptions && (
              <>
                <div className="space-y-2 flex items-center gap-2">
                  <Switch
                    id="split_expense"
                    checked={formData.split_expense}
                    onCheckedChange={(checked) => handleSwitchChange('split_expense', checked)}
                  />
                  <Label htmlFor="split_expense">
                    Dividir despesa (alguém pagou e será reembolsado)
                  </Label>
                </div>

                {formData.split_expense && (
                  <div className="space-y-2">
                    <Label htmlFor="paid_by">Quem pagou a despesa?</Label>
                    <Select
                      value={formData.paid_by || ''}
                      onValueChange={(value) => handleSelectChange('paid_by', value as 'franklin' | 'michele')}
                    >
                      <SelectTrigger className={errors.paid_by ? 'border-red-300 bg-red-50' : ''}>
                        <SelectValue placeholder="Selecione quem pagou" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="franklin">Franklim</SelectItem>
                        <SelectItem value="michele">Michele</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.paid_by && (
                      <p className="text-red-500 text-xs mt-1">{errors.paid_by}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionDialog;
