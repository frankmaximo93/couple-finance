
import { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';

type DashboardProps = {
  isActive: boolean;
};

type MonthlySummary = {
  monthly_income: number;
  monthly_expense: number;
};

type CategorySummary = {
  category: string;
  income: number;
  expense: number;
};

const Dashboard = ({ isActive }: DashboardProps) => {
  const [saldoTotal, setSaldoTotal] = useState<number>(0);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary>({
    monthly_income: 0,
    monthly_expense: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (isActive) {
      setIsLoading(true);
      fetchDashboardData();
    }
  }, [isActive]);

  const fetchDashboardData = async () => {
    try {
      const [saldoResponse, summaryResponse, categoryResponse] = await Promise.all([
        fetch('http://localhost:3000/api/dashboard/saldo-total'),
        fetch('http://localhost:3000/api/dashboard/monthly-summary'),
        fetch('http://localhost:3000/api/dashboard/monthly-category-summary')
      ]);

      if (!saldoResponse.ok || !summaryResponse.ok || !categoryResponse.ok) {
        throw new Error('Erro ao buscar dados do dashboard');
      }

      const saldoData = await saldoResponse.json();
      const summaryData = await summaryResponse.json();
      const categoryData = await categoryResponse.json();

      setSaldoTotal(saldoData.saldo_total);
      setMonthlySummary(summaryData);
      initChart(categoryData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initChart = (categoryData: CategorySummary[]) => {
    if (!chartRef.current) return;
    
    // Destroy existing chart if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const categories = categoryData.map(item => item.category);
    const incomeData = categoryData.map(item => item.income);
    const expenseData = categoryData.map(item => item.expense);

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [
          {
            label: 'Receitas',
            data: incomeData,
            backgroundColor: 'rgba(10, 135, 84, 0.7)',
            borderColor: 'rgb(10, 135, 84)',
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: 'Despesas',
            data: expenseData,
            backgroundColor: 'rgba(225, 29, 72, 0.7)',
            borderColor: 'rgb(225, 29, 72)',
            borderWidth: 1,
            borderRadius: 6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          title: {
            display: true,
            text: 'Receitas e Despesas por Categoria - Mês Atual',
            font: {
              size: 16,
              weight: 'normal'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          }
        }
      }
    });
  };

  if (!isActive) return null;

  return (
    <div className="animate-fade-in">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse-shadow h-12 w-12 rounded-full bg-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center md:items-start mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-2xl shadow-sm w-full mb-6">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Saldo Total</h3>
              <p className={`text-3xl font-bold ${saldoTotal >= 0 ? 'text-finance-income' : 'text-finance-expense'}`}>
                R$ {saldoTotal.toFixed(2)}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="glass-card p-6 rounded-2xl flex flex-col h-36 justify-between animate-float">
                <h3 className="text-sm font-medium text-gray-600">Receitas Mensais</h3>
                <p className="text-3xl font-bold text-finance-income">
                  R$ {monthlySummary.monthly_income.toFixed(2)}
                </p>
              </div>
              
              <div className="glass-card p-6 rounded-2xl flex flex-col h-36 justify-between animate-float" style={{ animationDelay: '0.5s' }}>
                <h3 className="text-sm font-medium text-gray-600">Despesas Mensais</h3>
                <p className="text-3xl font-bold text-finance-expense">
                  R$ {monthlySummary.monthly_expense.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="glass-card rounded-2xl p-6 shadow-md h-80 mb-4">
            <canvas ref={chartRef} height="300"></canvas>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
