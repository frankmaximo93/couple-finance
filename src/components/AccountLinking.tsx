
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface AccountLinkingProps {
  isActive: boolean;
}

type LinkedAccount = {
  email: string;
  relationship: string;
};

const AccountLinking = ({ isActive }: AccountLinkingProps) => {
  const [partnerEmail, setPartnerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (isActive && user) {
      fetchLinkedAccounts();
    }
  }, [isActive, user]);

  // Fetch existing linked accounts when component is active
  const fetchLinkedAccounts = async () => {
    if (!user) return;
    
    try {
      // Using RPC function to get linked users
      const { data, error } = await supabase.rpc('get_linked_users');
      
      if (error) {
        console.error('Error fetching linked accounts:', error);
        return;
      }
      
      if (data && Array.isArray(data)) {
        console.log('Linked accounts data:', data);
        setLinkedAccounts(data as LinkedAccount[]);
      }
    } catch (error) {
      console.error('Erro ao carregar contas vinculadas:', error);
    }
  };

  // Link accounts using the stored procedure
  const linkAccounts = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!partnerEmail || !user) return;
    
    setIsSubmitting(true);
    
    try {
      // Call the stored procedure to link accounts
      const { data, error } = await supabase.rpc('link_users', {
        other_user_email: partnerEmail,
        relationship_type: 'spouse'
      });
      
      if (error) throw error;
      
      if (data === true) {
        toast.success(`Conta vinculada com sucesso a ${partnerEmail}`);
        setPartnerEmail('');
        fetchLinkedAccounts();
      } else {
        toast.error('Usuário não encontrado ou já está vinculado');
      }
    } catch (error: any) {
      toast.error(`Erro ao vincular conta: ${error.message || 'Erro desconhecido'}`);
      console.error('Erro ao vincular conta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="animate-fade-in">
      <Card className="glass-card rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle>Vincular Contas</CardTitle>
          <CardDescription>
            Vincule sua conta a outros usuários para compartilhar dados financeiros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={linkAccounts} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="partnerEmail" className="text-sm font-medium">
                Email do parceiro:
              </label>
              <Input
                id="partnerEmail"
                type="email"
                placeholder="example@email.com"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full md:w-auto"
            >
              {isSubmitting ? 'Vinculando...' : 'Vincular Conta'}
            </Button>
          </form>

          {linkedAccounts.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-medium">Contas vinculadas:</h3>
              <ul className="space-y-2">
                {linkedAccounts.map((account, index) => (
                  <li key={index} className="flex items-center p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{account.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{account.relationship}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-gray-500">
          As contas vinculadas terão acesso aos seus dados financeiros e vice-versa.
        </CardFooter>
      </Card>
    </div>
  );
};

export default AccountLinking;
