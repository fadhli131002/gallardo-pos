import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, CircleDollarSign, MoreHorizontal } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useOrders } from '../../context/OrderContext';
import { formatCurrency } from '../../data/mockData';
import { format } from 'date-fns';
import './FinanceDashboard.css';

// mock expenses for the dashboard
const MOCK_EXPENSES = [
  { id: 'EXP-001', date: new Date().toISOString(), description: 'Sewa Ruko Bulanan (Gallardo)', category: 'Expense', branch: 'Gallardo', amount: 25000000, status: 'Paid' },
  { id: 'EXP-002', date: new Date().toISOString(), description: 'Restock Chemical Rantiz 9H', category: 'Expense', branch: 'New Ratu', amount: 12500000, status: 'Paid' },
  { id: 'EXP-003', date: new Date().toISOString(), description: 'Biaya Iklan Meta Ads', category: 'Expense', branch: 'Gallardo', amount: 5000000, status: 'Paid' },
  { id: 'EXP-004', date: new Date().toISOString(), description: 'Listrik & Air (New Ratu)', category: 'Expense', branch: 'New Ratu', amount: 2100000, status: 'Pending' },
];

const COLORS = ['#1a1a1a', '#71717a']; // Monochrome for branch donut chart

const FinanceDashboard = () => {
  const { flatOrders: orders} = useOrders();

  const financeStats = useMemo(() => {
    let totalRevenue = 0;
    
    // Revenue from orders
    orders.forEach(order => {
      if (order.status === 'Selesai') {
        totalRevenue += order.totalPrice;
      }
    });

    let totalExpenses = 0;
    MOCK_EXPENSES.forEach(exp => {
      totalExpenses += exp.amount;
    });

    const netProfit = totalRevenue - totalExpenses;
    
    // Total Balance = Arbitrary starting balance + Net Profit
    const totalBalance = 150000000 + netProfit;

    return { totalBalance, totalRevenue, totalExpenses, netProfit };
  }, [orders]);

  // Generate data for line chart (Income vs Expense)
  const chartData = useMemo(() => {
    const dataMap = {};
    
    // Add income
    orders.forEach(order => {
      if (order.status === 'Selesai') {
        const dateStr = format(new Date(order.date), 'dd MMM');
        if (!dataMap[dateStr]) {
          dataMap[dateStr] = { date: dateStr, Income: 0, Expense: 0 };
        }
        dataMap[dateStr].Income += order.totalPrice;
      }
    });

    // Add expenses
    MOCK_EXPENSES.forEach(exp => {
      const dateStr = format(new Date(exp.date), 'dd MMM');
      if (!dataMap[dateStr]) {
        dataMap[dateStr] = { date: dateStr, Income: 0, Expense: 0 };
      }
      dataMap[dateStr].Expense += exp.amount;
    });

    return Object.values(dataMap).slice(-7);
  }, [orders]);

  // Generate data for Donut Chart (Branch Revenue)
  const branchData = useMemo(() => {
    let gallardo = 0, newRatu = 0;
    orders.forEach(order => {
      if (order.status === 'Selesai') {
        if (order.location === 'Gallardo') gallardo += order.totalPrice;
        if (order.location === 'New Ratu') newRatu += order.totalPrice;
      }
    });
    return [
      { name: 'Gallardo', value: gallardo },
      { name: 'New Ratu', value: newRatu }
    ];
  }, [orders]);

  // Combine Orders & Expenses for Activity Table
  const activityData = useMemo(() => {
    const incomes = orders.map(order => ({
      id: order.id,
      date: order.date,
      type: 'Income',
      branch: order.location,
      amount: order.totalPrice,
      status: order.status === 'Selesai' ? 'Completed' : 'Pending'
    }));

    const allActivities = [...incomes, ...MOCK_EXPENSES.map(e => ({...e, type: e.category}))];
    allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
    return allActivities.slice(0, 8); 
  }, [orders]);

  return (
    <div className="approx-dashboard pb-10">
      <div className="dashboard-header">
        <h1 className="font-sans text-2xl font-bold">Analytics Dashboard</h1>
        <p className="font-mono-ui text-secondary text-sm">Welcome back, here is your financial summary.</p>
      </div>

      {/* TOP ROW: 4 Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-title">TOTAL BALANCE</span>
            <div className="metric-icon-wrapper"><Wallet size={18} /></div>
          </div>
          <div className="metric-value">{formatCurrency(financeStats.totalBalance)}</div>
          <div className="metric-trend text-success">
            <ArrowUpRight size={14} /> <span>+2.5%</span>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-title">TOTAL REVENUE</span>
            <div className="metric-icon-wrapper"><TrendingUp size={18} /></div>
          </div>
          <div className="metric-value">{formatCurrency(financeStats.totalRevenue)}</div>
          <div className="metric-trend text-success">
            <ArrowUpRight size={14} /> <span>+12.4%</span>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-title">TOTAL EXPENSES</span>
            <div className="metric-icon-wrapper"><TrendingDown size={18} /></div>
          </div>
          <div className="metric-value">{formatCurrency(financeStats.totalExpenses)}</div>
          <div className="metric-trend text-danger">
            <ArrowDownRight size={14} /> <span>-4.2%</span>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-header">
            <span className="metric-title">NET PROFIT</span>
            <div className="metric-icon-wrapper"><DollarSign size={18} /></div>
          </div>
          <div className="metric-value">{formatCurrency(financeStats.netProfit)}</div>
          <div className="metric-trend text-success">
            <ArrowUpRight size={14} /> <span>+18.2%</span>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: Main Line Chart */}
      <div className="chart-panel glass-panel mb-6">
        <div className="panel-header">
          <h3 className="panel-title font-sans">Income vs Expense</h3>
          <button className="icon-btn"><MoreHorizontal size={18} /></button>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000000}M`} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip 
                formatter={(value) => formatCurrency(value)} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontFamily: 'var(--font-sans)' }} 
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="Income" stroke="#000000" strokeWidth={3} dot={{ r: 4, fill: '#000000', strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Expense" stroke="#9ca3af" strokeWidth={3} dot={{ r: 4, fill: '#9ca3af', strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BOTTOM ROW: Split View (Table + Donut Chart) */}
      <div className="split-view">
        {/* Left: Table (70%) */}
        <div className="table-panel glass-panel">
          <div className="panel-header border-b">
            <h3 className="panel-title font-sans">Recent Transactions</h3>
            <button className="icon-btn"><MoreHorizontal size={18} /></button>
          </div>
          <div className="table-responsive">
            <table className="finance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Branch</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {activityData.map((item, idx) => (
                  <tr key={`${item.id}-${idx}`}>
                    <td className="text-secondary">{format(new Date(item.date), 'dd MMM yyyy')}</td>
                    <td className="font-medium">{item.branch}</td>
                    <td>
                      <span className={`status-badge ${item.type === 'Income' ? 'badge-income' : 'badge-expense'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${item.status === 'Completed' || item.status === 'Paid' ? 'badge-completed' : 'badge-pending'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className={`text-right font-bold ${item.type === 'Income' ? 'text-success' : 'text-danger'}`}>
                      {item.type === 'Income' ? '+' : '-'}{formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Donut Chart (30%) */}
        <div className="donut-panel glass-panel">
          <div className="panel-header border-b">
            <h3 className="panel-title font-sans">Revenue by Branch</h3>
          </div>
          <div className="donut-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={branchData}
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {branchData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend to mimic Approx style */}
            <div className="custom-legend">
              {branchData.map((entry, index) => (
                <div key={entry.name} className="legend-item">
                  <div className="legend-marker" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="legend-label">{entry.name}</span>
                  <span className="legend-value font-mono-ui">
                    {Math.round((entry.value / (branchData[0].value + branchData[1].value)) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
