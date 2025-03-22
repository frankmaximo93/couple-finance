
import { WalletPerson } from '@/integrations/supabase/client';
import { DebtInfo, formatCurrency, getNetDebtAmount } from '@/utils/walletUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type DebtCardProps = {
  walletKey: WalletPerson;
  debts: DebtInfo[];
  onPayDebt: (debtId: string, amount?: number) => void;
};

const DebtCard = ({ walletKey, debts, onPayDebt }: DebtCardProps) => {
  const [selectedDebt, setSelectedDebt] = useState<DebtInfo | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  
  const handleOpenPaymentDialog = (debt: DebtInfo) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.amount - (debt.paid_amount || 0));
    setShowPaymentDialog(true);
  };
  
  const handlePayDebt = () => {
    if (!selectedDebt) return;
    
    const remainingAmount = selectedDebt.amount - (selectedDebt.paid_amount || 0);
    const isFullPayment = paymentAmount >= remainingAmount;
    
    onPayDebt(selectedDebt.id, isFullPayment ? undefined : paymentAmount);
    setShowPaymentDialog(false);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Divisão de despesas</CardTitle>
        <CardDescription>Dívidas com o cônjuge</CardDescription>
      </CardHeader>
      <CardContent>
        {getNetDebtAmount(debts, walletKey) > 0 ? (
          <p className="text-lg font-medium text-finance-income">
            A receber: {formatCurrency(getNetDebtAmount(debts, walletKey))}
          </p>
        ) : getNetDebtAmount(debts, walletKey) < 0 ? (
          <p className="text-lg font-medium text-finance-expense">
            A pagar: {formatCurrency(Math.abs(getNetDebtAmount(debts, walletKey)))}
          </p>
        ) : (
          <p className="text-lg font-medium">Sem dívidas pendentes</p>
        )}
        
        <div className="mt-2 text-sm">
          <p className="text-gray-500">Detalhes:</p>
          <ul className="mt-1 space-y-1">
            {debts.filter(debt => !debt.is_paid).map((debt, index) => {
              const paidAmount = debt.paid_amount || 0;
              const remainingAmount = debt.amount - paidAmount;
              
              if (debt.owed_to === walletKey) {
                return (
                  <li key={index} className="text-finance-income flex justify-between items-center">
                    <div>
                      <span>Receber de {debt.owed_by === 'franklin' ? 'Franklim' : 'Michele'}: </span>
                      <span className="font-medium">{formatCurrency(remainingAmount)}</span>
                      {paidAmount > 0 && (
                        <span className="block text-xs text-gray-500">
                          Pago parcialmente: {formatCurrency(paidAmount)} de {formatCurrency(debt.amount)}
                        </span>
                      )}
                      <span className="block text-xs text-gray-500">{debt.description}</span>
                    </div>
                    <button 
                      onClick={() => handleOpenPaymentDialog(debt)}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                    >
                      Receber
                    </button>
                  </li>
                );
              } else if (debt.owed_by === walletKey) {
                return (
                  <li key={index} className="text-finance-expense flex justify-between items-center">
                    <div>
                      <span>Pagar para {debt.owed_to === 'michele' ? 'Michele' : 'Franklim'}: </span>
                      <span className="font-medium">{formatCurrency(remainingAmount)}</span>
                      {paidAmount > 0 && (
                        <span className="block text-xs text-gray-500">
                          Pago parcialmente: {formatCurrency(paidAmount)} de {formatCurrency(debt.amount)}
                        </span>
                      )}
                      <span className="block text-xs text-gray-500">{debt.description}</span>
                    </div>
                    <button 
                      onClick={() => handleOpenPaymentDialog(debt)}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      Pagar
                    </button>
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </div>
      </CardContent>
      
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDebt?.owed_by === walletKey ? 'Pagar Dívida' : 'Receber Pagamento'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <p>
                {selectedDebt?.description}
                <span className="block text-sm text-gray-500">
                  Valor total: {selectedDebt ? formatCurrency(selectedDebt.amount) : ''}
                </span>
                {(selectedDebt?.paid_amount || 0) > 0 && (
                  <span className="block text-sm text-gray-500">
                    Já pago: {formatCurrency(selectedDebt?.paid_amount || 0)}
                  </span>
                )}
                <span className="block text-sm text-gray-500">
                  Restante: {selectedDebt ? formatCurrency(selectedDebt.amount - (selectedDebt.paid_amount || 0)) : ''}
                </span>
              </p>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment-amount" className="col-span-4">
                Valor do pagamento
              </Label>
              <Input
                id="payment-amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="col-span-4"
                min="0.01"
                max={selectedDebt ? selectedDebt.amount - (selectedDebt.paid_amount || 0) : 0}
                step="0.01"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button" 
              variant="outline" 
              onClick={() => setShowPaymentDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handlePayDebt}
              disabled={paymentAmount <= 0 || !selectedDebt || paymentAmount > (selectedDebt.amount - (selectedDebt.paid_amount || 0))}
            >
              {selectedDebt?.owed_by === walletKey ? 'Pagar' : 'Receber'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DebtCard;
