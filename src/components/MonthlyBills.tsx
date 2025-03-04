
import { useEffect } from 'react';

type MonthlyBillsProps = {
  isActive: boolean;
};

const MonthlyBills = ({ isActive }: MonthlyBillsProps) => {
  useEffect(() => {
    // Future implementation
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="animate-fade-in">
      <div className="glass-card rounded-2xl p-8 shadow-md">
        <div className="text-center py-10">
          <h3 className="text-2xl font-medium text-gray-800 mb-4">Contas do Mês</h3>
          <p className="text-gray-600">Esta funcionalidade será implementada em breve.</p>
          <div className="mt-6 p-6 bg-blue-50 rounded-lg inline-block">
            <p className="text-blue-700">Aqui você poderá gerenciar as contas mensais do casal.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyBills;
