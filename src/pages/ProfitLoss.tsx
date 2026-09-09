import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Calendar,
  Target,
  Percent,
  DollarSign,
} from "lucide-react";
import type { UserAccount } from "../types/finance";
import { formatCurrency } from "../utils/money";
import { calculateBalanceStats } from "../utils/balance";

const parseLocalDate = (value: string) => {
  const date = value.includes("T")
    ? new Date(value)
    : new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const generateCalendarDays = (month: Date, transactions: any[]) => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days = [];
  const current = new Date(startDate);
  
  // Group transactions by date
  const transactionsByDate: Record<string, { profit: number; loss: number }> = {};
  transactions.forEach(transaction => {
    const date = parseLocalDate(transaction.date);
    if (date) {
      const dateKey = date.toISOString().split('T')[0];
      if (!transactionsByDate[dateKey]) {
        transactionsByDate[dateKey] = { profit: 0, loss: 0 };
      }
      const amount = transaction.grossAmount || transaction.amount;
      if (transaction.type === 'profit') {
        transactionsByDate[dateKey].profit += amount;
      } else {
        transactionsByDate[dateKey].loss += amount;
      }
    }
  });
  
  // Generate 42 days (6 weeks)
  for (let i = 0; i < 42; i++) {
    const dateKey = current.toISOString().split('T')[0];
    const dayData = transactionsByDate[dateKey];
    const isCurrentMonth = current.getMonth() === monthIndex;
    
    let dayType = 'neutral';
    let amount = null;
    let tooltip = current.toLocaleDateString();
    
    if (dayData && isCurrentMonth) {
      const netAmount = dayData.profit - dayData.loss;
      if (netAmount > 0) {
        dayType = 'profit';
        amount = netAmount;
        tooltip = `${tooltip} - Profit: ₹${dayData.profit}, Loss: ₹${dayData.loss}, Net: +₹${netAmount}`;
      } else if (netAmount < 0) {
        dayType = 'loss';
        amount = Math.abs(netAmount);
        tooltip = `${tooltip} - Profit: ₹${dayData.profit}, Loss: ₹${dayData.loss}, Net: -₹${Math.abs(netAmount)}`;
      } else if (dayData.profit > 0 || dayData.loss > 0) {
        dayType = 'neutral';
        tooltip = `${tooltip} - Profit: ₹${dayData.profit}, Loss: ₹${dayData.loss}, Net: ₹0`;
      }
    }
    
    days.push({
      day: current.getDate(),
      type: dayType,
      amount: amount,
      isEmpty: !isCurrentMonth,
      tooltip: tooltip
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return days;
};

interface Props {
  user: UserAccount;
}

const ProfitLoss = ({ user }: Props) => {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [calendarMonths, setCalendarMonths] = useState(1);

  const stats = useMemo(() => {
    const balanceStats = calculateBalanceStats(user);
    
    const profitCount = user.transactions.filter((t) => t.type === "profit").length;
    const lossCount = user.transactions.filter((t) => t.type === "loss").length;
    const totalTrades = profitCount + lossCount;
    const winRate = totalTrades > 0 ? (profitCount / totalTrades) * 100 : 0;
    const avgProfitPerTrade = profitCount > 0 ? balanceStats.totalProfit / profitCount : 0;
    const avgLossPerTrade = lossCount > 0 ? balanceStats.totalLoss / lossCount : 0;

    return {
      ...balanceStats,
      profitCount,
      lossCount,
      totalTrades,
      winRate,
      avgProfitPerTrade,
      avgLossPerTrade,
    };
  }, [user.transactions, user.startingBalance]);

  const dailyPL = useMemo(() => {
    const dailyData: Record<string, { profit: number; loss: number; net: number }> = {};
    
    user.transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { profit: 0, loss: 0, net: 0 };
      }
      
      const amount = transaction.grossAmount ?? transaction.amount;
      if (transaction.type === 'profit') {
        dailyData[dateKey].profit += amount;
        dailyData[dateKey].net += amount;
      } else {
        dailyData[dateKey].loss += amount;
        dailyData[dateKey].net -= amount;
      }
    });
    
    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date: new Date(date),
        ...data,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
  }, [user.transactions]);

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">P&L ANALYSIS</span>
          <h1>Profit & Loss</h1>
          <p>Comprehensive view of your trading performance and profitability.</p>
        </div>
        
        <div className="heading-actions">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-selector"
          >
            <option value="all">All Time</option>
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>

      {/* P&L Overview Cards */}
      <div className="pl-overview-grid">
        <div className="pl-card profit-card">
          <div className="pl-card-header">
            <TrendingUp size={24} />
            <h3>Total Profit</h3>
          </div>
          <div className="pl-card-value profit">
            {formatCurrency(stats.totalProfit, user.currency)}
          </div>
          <div className="pl-card-subtitle">
            {stats.profitCount} profitable trades
          </div>
        </div>

        <div className="pl-card loss-card">
          <div className="pl-card-header">
            <TrendingDown size={24} />
            <h3>Total Loss</h3>
          </div>
          <div className="pl-card-value loss">
            {formatCurrency(stats.totalLoss, user.currency)}
          </div>
          <div className="pl-card-subtitle">
            {stats.lossCount} losing trades
          </div>
        </div>

        <div className="pl-card net-card">
          <div className="pl-card-header">
            <BarChart3 size={24} />
            <h3>Net P&L</h3>
          </div>
          <div className={`pl-card-value ${stats.netPerformance >= 0 ? 'profit' : 'loss'}`}>
            {stats.netPerformance >= 0 ? '+' : ''}{formatCurrency(stats.netPerformance, user.currency)}
          </div>
          <div className="pl-card-subtitle">
            {stats.winRate.toFixed(1)}% win rate
          </div>
        </div>
      </div>

      {/* Trading Calendar */}
      <div className="calendar-section">
        <div className="calendar-header">
          <div className="calendar-title">
            <Calendar size={20} />
            <h2>Trading Calendar</h2>
          </div>
          <div className="calendar-controls">
            <select 
              value={calendarMonths} 
              onChange={(e) => setCalendarMonths(Number(e.target.value))}
              className="calendar-dropdown"
            >
              <option value={1}>1 Month</option>
              <option value={2}>2 Months</option>
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
            </select>
          </div>
        </div>
        
        <div className="calendar-grid">
          {Array.from({ length: calendarMonths }, (_, monthOffset) => {
            const currentMonth = new Date();
            currentMonth.setMonth(currentMonth.getMonth() - monthOffset);
            
            return (
              <div key={monthOffset} className="month-calendar">
                <div className="month-header">
                  <h3>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                </div>
                <div className="calendar-days">
                  <div className="day-headers">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                      <div key={day} className="day-header">{day}</div>
                    ))}
                  </div>
                  <div className="days-grid">
                    {generateCalendarDays(currentMonth, user.transactions).map((day, index) => (
                      <div 
                        key={index} 
                        className={`calendar-day ${day.type} ${day.isEmpty ? 'empty' : ''}`}
                        title={day.tooltip}
                      >
                        <span className="day-number">{day.day}</span>
                        {day.amount && <span className="day-amount">₹{day.amount}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="performance-metrics">
        <h2>Performance Metrics</h2>
        <div className="metrics-grid">
          <div className="metric-item">
            <Activity size={20} />
            <div className="metric-content">
              <span className="metric-label">Total Trades</span>
              <span className="metric-value">{stats.totalTrades}</span>
            </div>
          </div>

          <div className="metric-item">
            <Percent size={20} />
            <div className="metric-content">
              <span className="metric-label">Win Rate</span>
              <span className="metric-value">{stats.winRate.toFixed(1)}%</span>
            </div>
          </div>

          <div className="metric-item">
            <Target size={20} />
            <div className="metric-content">
              <span className="metric-label">Avg Profit/Trade</span>
              <span className="metric-value">{formatCurrency(stats.avgProfitPerTrade, user.currency)}</span>
            </div>
          </div>

          <div className="metric-item">
            <DollarSign size={20} />
            <div className="metric-content">
              <span className="metric-label">Avg Loss/Trade</span>
              <span className="metric-value">{formatCurrency(stats.avgLossPerTrade, user.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily P&L History */}
      <div className="daily-pl-section">
        <h2>Recent Daily P&L</h2>
        <div className="daily-pl-list">
          {dailyPL.map((day, index) => (
            <div key={index} className="daily-pl-item">
              <div className="day-info">
                <span className="day-date">
                  {day.date.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div className="day-amounts">
                <span className="day-profit">+{formatCurrency(day.profit, user.currency)}</span>
                <span className="day-loss">-{formatCurrency(day.loss, user.currency)}</span>
              </div>
              <div className={`day-net ${day.net >= 0 ? 'positive' : 'negative'}`}>
                {day.net >= 0 ? '+' : ''}{formatCurrency(day.net, user.currency)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfitLoss;