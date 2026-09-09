import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Target,
  Percent,
  DollarSign,
} from "lucide-react";
import type { UserAccount } from "../types/finance";
import { formatCurrency } from "../utils/money";

interface Props {
  user: UserAccount;
}

const ProfitLoss = ({ user }: Props) => {
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  const stats = useMemo(() => {
    // Use grossAmount for display values
    const totalProfit = user.transactions
      .filter((transaction) => transaction.type === "profit")
      .reduce((sum, transaction) => sum + (transaction.grossAmount ?? transaction.amount), 0);

    const totalLoss = user.transactions
      .filter((transaction) => transaction.type === "loss")
      .reduce((sum, transaction) => sum + (transaction.grossAmount ?? transaction.amount), 0);

    const netPL = totalProfit - totalLoss;
    const profitCount = user.transactions.filter((t) => t.type === "profit").length;
    const lossCount = user.transactions.filter((t) => t.type === "loss").length;
    const totalTrades = profitCount + lossCount;
    const winRate = totalTrades > 0 ? (profitCount / totalTrades) * 100 : 0;
    const avgProfitPerTrade = profitCount > 0 ? totalProfit / profitCount : 0;
    const avgLossPerTrade = lossCount > 0 ? totalLoss / lossCount : 0;

    return {
      totalProfit,
      totalLoss,
      netPL,
      profitCount,
      lossCount,
      totalTrades,
      winRate,
      avgProfitPerTrade,
      avgLossPerTrade,
    };
  }, [user.transactions]);

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
          <div className={`pl-card-value ${stats.netPL >= 0 ? 'profit' : 'loss'}`}>
            {stats.netPL >= 0 ? '+' : ''}{formatCurrency(stats.netPL, user.currency)}
          </div>
          <div className="pl-card-subtitle">
            {stats.winRate.toFixed(1)}% win rate
          </div>
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