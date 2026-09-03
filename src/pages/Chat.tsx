import { Send, X } from "lucide-react";
import { useState } from "react";
import type { Transaction, UserAccount } from "../types/finance";
import { formatCurrency } from "../utils/money";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface PendingTransaction {
  type: "profit" | "loss";
  amount: number;
  costIncluded: boolean;
}

interface ChatProps {
  onAddTransaction?: (transaction: Transaction) => void;
  user?: UserAccount;
}

const Chat = ({ onAddTransaction, user }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your FinTrack AI Assistant. You can quickly add transactions by saying 'profit 500' or 'loss 250'. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<PendingTransaction | null>(null);
  const [costIncluded, setCostIncluded] = useState(false);

  const parseTransactionInput = (text: string): PendingTransaction | null => {
    const lowerText = text.toLowerCase().trim();
    
    // Match "profit 500" or "loss 250" patterns
    const profitMatch = lowerText.match(/profit\s+([\d.]+)/);
    const lossMatch = lowerText.match(/loss\s+([\d.]+)/);

    if (profitMatch) {
      return {
        type: "profit",
        amount: parseFloat(profitMatch[1]),
        costIncluded: false,
      };
    } else if (lossMatch) {
      return {
        type: "loss",
        amount: parseFloat(lossMatch[1]),
        costIncluded: false,
      };
    }
    
    return null;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Try to parse transaction
    const transaction = parseTransactionInput(input);

    if (transaction) {
      setPendingTransaction(transaction);
      setCostIncluded(false);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I found a ${transaction.type} of ${formatCurrency(transaction.amount, user?.currency)}. Please confirm to add this transaction.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    } else {
      // Generic response for non-transaction input
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I can help you add transactions! Try saying 'profit 500' or 'loss 250' to quickly add a transaction.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 800);
    }
  };

  const handleConfirmTransaction = () => {
    if (!pendingTransaction || !user) return;

    const now = new Date();
    const costAmount = costIncluded ? user.defaultCostAmount : 0;
    const netAmount = costIncluded ? pendingTransaction.amount - costAmount : pendingTransaction.amount;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      date: now.toISOString(),
      type: pendingTransaction.type,
      amount: netAmount,
      grossAmount: pendingTransaction.amount,
      costAmount: costAmount,
      price: pendingTransaction.amount,
      category: "Quick Add",
      note: `Added via Chat Assistant - ${pendingTransaction.type} ${formatCurrency(pendingTransaction.amount, user.currency)}`,
    };

    // Call parent handler if provided
    if (onAddTransaction) {
      onAddTransaction(newTransaction);
    }

    const confirmMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `✓ Transaction confirmed! Added ${pendingTransaction.type} of ${formatCurrency(pendingTransaction.amount, user.currency)}${
        costIncluded ? ` (cost: ${formatCurrency(costAmount, user.currency)})` : ""
      } on ${now.toLocaleDateString("en-IN")} at ${now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })}.`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, confirmMessage]);
    setPendingTransaction(null);
    setCostIncluded(false);
  };

  const handleCancelTransaction = () => {
    const cancelMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "Transaction cancelled. You can try again anytime.",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, cancelMessage]);
    setPendingTransaction(null);
    setCostIncluded(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !pendingTransaction) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ASSISTANT</span>
          <h1>Chat Assistant</h1>
          <p>Quickly add transactions by chatting. Try: "profit 500" or "loss 250"</p>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`chat-message ${message.role}`}>
              <div className="chat-bubble">
                <p>{message.content}</p>
                <span className="chat-time">
                  {message.timestamp.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message assistant">
              <div className="chat-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          {pendingTransaction && (
            <div className="chat-message assistant">
              <div className="chat-confirmation">
                <div className="confirmation-header">
                  <h4>Confirm Transaction</h4>
                  <span className={`badge ${pendingTransaction.type}`}>
                    {pendingTransaction.type.toUpperCase()}
                  </span>
                </div>
                
                <div className="confirmation-details">
                  <div className="detail-row">
                    <span>Amount</span>
                    <strong>{formatCurrency(pendingTransaction.amount, user?.currency)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Date & Time</span>
                    <strong>{new Date().toLocaleString("en-IN")}</strong>
                  </div>
                </div>

                <div className="confirmation-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={costIncluded}
                      onChange={(e) => setCostIncluded(e.target.checked)}
                    />
                    <span>Include brokerage (default cost: {formatCurrency(user?.defaultCostAmount || 0, user?.currency)})</span>
                  </label>
                </div>

                {costIncluded && user && (
                  <div className="cost-breakdown">
                    <div className="breakdown-row">
                      <span>Gross Amount</span>
                      <span>{formatCurrency(pendingTransaction.amount, user.currency)}</span>
                    </div>
                    <div className="breakdown-row cost">
                      <span>Brokerage</span>
                      <span>{formatCurrency(user.defaultCostAmount, user.currency)}</span>
                    </div>
                    <div className="breakdown-row net">
                      <span>Net Amount</span>
                      <span>{formatCurrency(pendingTransaction.amount - user.defaultCostAmount, user.currency)}</span>
                    </div>
                  </div>
                )}

                <div className="confirmation-actions">
                  <button
                    className="secondary-button"
                    onClick={handleCancelTransaction}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    className="primary-button"
                    onClick={handleConfirmTransaction}
                  >
                    <Send size={16} />
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Try: 'profit 500' or 'loss 250' (Shift+Enter for new line)"
              rows={2}
              disabled={!!pendingTransaction}
            />
            <button
              className="chat-send-button"
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading || !!pendingTransaction}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
