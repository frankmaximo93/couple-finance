
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

type TransactionFormProps = {
  isActive: boolean;
};

type Category = {
  id: string;
  name: string;
};

const TransactionForm = ({ isActive }: TransactionFormProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category_id: '',
    date: '',
    type: '',
    responsibility: '',
    payment_method: 'cash' as 'cash' | 'credit', // Fix: explicitly type as 'cash' | 'credit'
    installments: '1',      
    due_date: '',           
    split_expense: false,   
    paid_by: '' as 'franklin' | 'michele' | '',   // Fix: explicitly type as allowed values
    status: 'pending' as 'pending' | 'paid' | 'overdue',      
    is_recurring: false     
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSplitOptions, setShowSplitOptions] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    if (isActive && user) {
      fetchCategories();
      
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        date: today,
        due_date: today
      }));
    }
  }, [isActive, user]);
  
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Mostrar opções de divisão quando responsabilidade for 'casal'
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

    // Habilitar campos de crédito quando método de pagamento for crédito
    if (name === 'payment_method' && value === 'credit') {
      setFormData(prev => ({
        ...prev,
        installments: '1'
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Lógica adicional para campos específicos
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
    
    if (!formData.amount) {
      newErrors.amount = 'Valor é obrigatório';
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
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
      if (!formData.installments || parseInt(formData.installments) < 1) {
        newErrors.installments = 'Número de parcelas deve ser pelo menos 1';
      }
      
      if (!formData.due_date) {
        newErrors.due_date = 'Data de vencimento é obrigatória para compras no crédito';
      }
    }

    // Fix: only validate paid_by if split_expense is true
    if (formData.split_expense && !formData.paid_by) {
      newErrors.paid_by = 'É necessário informar quem pagou a despesa compartilhada';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const createDebtRecord = async (transactionId: string, amount: number, paidBy: string) => {
    const owedBy = paidBy === 'franklin' ? 'michele' : 'franklin';
    const halfAmount = amount / 2;
    
    try {
      const { error } = await supabase
        .from('debts')
        .insert({
          transaction_id: transactionId,
          owed_by: owedBy,
          owed_to: paidBy,
          amount: halfAmount,
          is_paid: false
        });
        
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao criar registro de dívida:', error);
      // Não impede o fluxo principal se houver erro na criação de dívida
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate() || !user) return;
    
    setIsSubmitting(true);
    
    try {
      // Fix for paid_by field: if split_expense is false, set paid_by to null
      const transactionData = {
        user_id: user.id,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id,
        date: formData.date,
        type: formData.type,
        responsibility: formData.responsibility,
        payment_method: formData.payment_method,
        installments: parseInt(formData.installments),
        due_date: formData.due_date,
        split_expense: formData.split_expense,
        paid_by: formData.split_expense ? formData.paid_by : null,
        status: formData.status,
        is_recurring: formData.is_recurring
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Se for uma despesa compartilhada, criar registro de dívida
      if (data && formData.split_expense && formData.paid_by) {
        await createDebtRecord(data.id, parseFloat(formData.amount), formData.paid_by);
      }
      
      toast.success('Transação salva com sucesso!');
      
      // Reset form
      setFormData({
        description: '',
        amount: '',
        category_id: '',
        date: new Date().toISOString().split('T')[0],
        type: '',
        responsibility: '',
        payment_method: 'cash',
        installments: '1',
        due_date: new Date().toISOString().split('T')[0],
        split_expense: false,
        paid_by: '',
        status: 'pending',
        is_recurring: false
      });
      setDueDate(undefined);
      setShowSplitOptions(false);
      
    } catch (error: any) {
      console.error('Erro ao salvar transação:', error);
      toast.error('Erro ao salvar transação: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isActive) return null;
  
  return (
    <div className="animate-fade-in">
      <div className="glass-card rounded-2xl p-8 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descrição
              </label>
              <Input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={errors.description ? 'border-red-300 bg-red-50' : ''}
                placeholder="Ex: Compras no supermercado"
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Valor (R$)
              </label>
              <Input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className={errors.amount ? 'border-red-300 bg-red-50' : ''}
                placeholder="0.00"
                step="0.01"
                min="0.01"
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Data
              </label>
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
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Tipo
              </label>
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
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                Categoria
              </label>
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
              <label htmlFor="responsibility" className="block text-sm font-medium text-gray-700">
                Responsabilidade
              </label>
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
              <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
                Método de Pagamento
              </label>
              <Select
                value={formData.payment_method}
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
                  <label htmlFor="installments" className="block text-sm font-medium text-gray-700">
                    Número de Parcelas
                  </label>
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
                  <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                    Data de Vencimento
                  </label>
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
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange('status', value as 'pending' | 'paid' | 'overdue')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex items-center gap-2">
              <Label htmlFor="is_recurring" className="text-sm font-medium text-gray-700">
                Despesa Fixa/Recorrente
              </Label>
              <Switch
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => handleSwitchChange('is_recurring', checked)}
              />
            </div>

            {/* Opções de divisão de despesa para o casal */}
            {showSplitOptions && (
              <>
                <div className="space-y-2 flex items-center">
                  <input
                    type="checkbox"
                    id="split_expense"
                    name="split_expense"
                    checked={formData.split_expense}
                    onChange={handleCheckboxChange}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor="split_expense" className="text-sm font-medium text-gray-700">
                    Dividir despesa (alguém pagou e será reembolsado)
                  </label>
                </div>

                {formData.split_expense && (
                  <div className="space-y-2">
                    <label htmlFor="paid_by" className="block text-sm font-medium text-gray-700">
                      Quem pagou a despesa?
                    </label>
                    <Select
                      value={formData.paid_by}
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
          
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`w-full md:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium shadow-md hover:shadow-lg transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:translate-y-[-2px]'}`}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Transação'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
