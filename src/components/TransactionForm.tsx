
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type TransactionFormProps = {
  isActive: boolean;
};

type Category = {
  id: number;
  name: string;
};

const TransactionForm = ({ isActive }: TransactionFormProps) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category_id: '',
    date: '',
    type: '',
    responsibility: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (isActive) {
      fetchCategories();
      
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        date: today
      }));
    }
  }, [isActive]);
  
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/categories');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCategories(data);
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: formData.description,
          amount: parseFloat(formData.amount),
          category_id: parseInt(formData.category_id),
          date: formData.date,
          type: formData.type,
          responsibility: formData.responsibility
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar transação');
      }
      
      toast.success('Transação salva com sucesso!');
      
      // Reset form
      setFormData({
        description: '',
        amount: '',
        category_id: '',
        date: new Date().toISOString().split('T')[0],
        type: '',
        responsibility: ''
      });
      
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast.error('Erro ao salvar transação');
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
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border ${errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
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
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border ${errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
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
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border ${errors.date ? 'border-red-300 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Tipo
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border ${errors.type ? 'border-red-300 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              >
                <option value="">Selecione o Tipo</option>
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
              {errors.type && (
                <p className="text-red-500 text-xs mt-1">{errors.type}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                Categoria
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border ${errors.category_id ? 'border-red-300 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              >
                <option value="">Selecione a Categoria</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="responsibility" className="block text-sm font-medium text-gray-700">
                Responsabilidade
              </label>
              <select
                id="responsibility"
                name="responsibility"
                value={formData.responsibility}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border ${errors.responsibility ? 'border-red-300 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              >
                <option value="">Selecione a Responsabilidade</option>
                <option value="casal">Casal</option>
                <option value="franklin">Franklim</option>
                <option value="michele">Michele</option>
              </select>
              {errors.responsibility && (
                <p className="text-red-500 text-xs mt-1">{errors.responsibility}</p>
              )}
            </div>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full md:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium shadow-md hover:shadow-lg transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:translate-y-[-2px]'}`}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
