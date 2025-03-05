
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

type CategoriesListProps = {
  isActive: boolean;
};

type Category = {
  id: string;
  name: string;
};

const CategoriesList = ({ isActive }: CategoriesListProps) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryError, setNewCategoryError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isActive && user) {
      fetchCategories();
    }
  }, [isActive, user]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      if (error) {
        throw error;
      }
      
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
        
      if (error) {
        throw error;
      }

      setCategories(categories.filter(cat => cat.id !== categoryId));
      toast.success('Categoria excluída com sucesso');
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error);
      
      // Verificar se o erro é devido a restrições de chave estrangeira
      if (error.code === '23503') {
        toast.error('Esta categoria está em uso e não pode ser excluída');
      } else {
        toast.error('Erro ao excluir categoria');
      }
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim() || !user) {
      setNewCategoryError('Nome da categoria é obrigatório');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({ 
          name: newCategoryName.trim(),
          user_id: user.id
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }

      setCategories([...categories, data]);
      setNewCategoryName('');
      setShowNewCategoryForm(false);
      toast.success('Categoria adicionada com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
      toast.error('Erro ao adicionar categoria');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="animate-fade-in">
      <div className="glass-card rounded-2xl p-6 shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium text-gray-800">Lista de Categorias</h3>
          <button
            onClick={() => setShowNewCategoryForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={showNewCategoryForm}
          >
            Adicionar Categoria
          </button>
        </div>

        {showNewCategoryForm && (
          <div className="bg-blue-50 p-4 rounded-xl mb-6 animate-scale-in">
            <form onSubmit={handleAddCategory} className="flex flex-col space-y-3">
              <div>
                <label htmlFor="new-category-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  id="new-category-name"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    setNewCategoryError('');
                  }}
                  className={`w-full px-4 py-2 rounded-lg border ${newCategoryError ? 'border-red-300 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Ex: Alimentação"
                />
                {newCategoryError && (
                  <p className="text-red-500 text-xs mt-1">{newCategoryError}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategoryForm(false);
                    setNewCategoryName('');
                    setNewCategoryError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse-shadow h-12 w-12 rounded-full bg-blue-500"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-500">Nenhuma categoria cadastrada ainda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {categories.map((category) => (
              <li 
                key={category.id} 
                className="py-4 px-1 flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="text-gray-800">{category.name}</span>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CategoriesList;
