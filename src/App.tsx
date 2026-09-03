import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

import Sidebar from "./components/Sidebar";
import AddTransactionModal from "./components/AddTransactionModal";

import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics.tsx";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Transactions from "./pages/Transactions";
import Withdrawals from "./pages/Withdrawals";
import Chat from "./pages/Chat";

import {
  addStorageChangeListener,
  getCurrentUser,
  logoutUser,
  updateUser,
} from "./utils/storage";

import type {
  Transaction,
  UserAccount,
} from "./types/finance";

const App = () => {
  const [user, setUser] =
    useState<UserAccount | null>(
      () => getCurrentUser()
    );

  const [activePage, setActivePage] =
    useState<
      "dashboard" | "transactions" | "analytics" | "withdrawals" | "settings" | "chat"
    >("dashboard");

  const [modalOpen, setModalOpen] =
    useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  useEffect(() => {
    const handleStorage = () => {
      setUser(getCurrentUser());
    };

    window.addEventListener("storage", handleStorage);
    const removeStorageListener = addStorageChangeListener(
      handleStorage
    );

    return () => {
      window.removeEventListener("storage", handleStorage);
      removeStorageListener();
    };
  }, []);

  if (!user) {
    return (
      <Login
        onAuthenticated={(newUser) => {
          setUser(newUser);
          setActivePage("dashboard");
          setMobileMenuOpen(false);
        }}
      />
    );
  }

  const handleSaveTransaction = (
    transaction: Transaction
  ) => {
    const transactionExists = user.transactions.some(
      (item) => item.id === transaction.id
    );

    const nextTransactions = transactionExists
      ? user.transactions.map((item) =>
          item.id === transaction.id ? transaction : item
        )
      : [transaction, ...user.transactions];

    const updatedUser: UserAccount = {
      ...user,
      transactions: nextTransactions,
    };

    updateUser(updatedUser);
    setUser(updatedUser);
    setModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (
    id: string
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this transaction?"
      );

    if (!confirmed) {
      return;
    }

    const updatedUser: UserAccount = {
      ...user,

      transactions:
        user.transactions.filter(
          (transaction) =>
            transaction.id !== id
        ),
    };

    updateUser(updatedUser);

    setUser(updatedUser);
  };

  const handleEditTransaction = (
    transaction: Transaction
  ) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleLogout = () => {
    logoutUser();

    setUser(null);
  };

  const handlePageChange = (
    page:
      | "dashboard"
      | "transactions"
      | "analytics"
      | "withdrawals"
      | "settings"
      | "chat"
  ) => {
    setActivePage(page);

    setMobileMenuOpen(false);
  };

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        activePage={activePage}
        onPageChange={handlePageChange}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
      />

      <main className="main-area">
        <header className="top-header">
          <button
            className="mobile-menu-button"
            onClick={() =>
              setMobileMenuOpen(
                !mobileMenuOpen
              )
            }
          >
            {mobileMenuOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>

          <div>
            <span className="breadcrumb">
              FinTrack /{" "}
              {activePage === "dashboard"
                ? "Dashboard"
                : activePage === "transactions"
                  ? "Transactions"
                  : activePage === "analytics"
                    ? "Analytics"
                    : activePage === "withdrawals"
                      ? "Withdrawals"
                      : activePage === "chat"
                        ? "Chat Assistant"
                        : "Settings"}
            </span>

            <h2>
              {activePage === "dashboard"
                ? "Financial overview"
                : activePage === "transactions"
                  ? "Transaction records"
                  : activePage === "analytics"
                    ? "Analytics"
                    : activePage === "withdrawals"
                      ? "Withdrawals"
                      : activePage === "chat"
                        ? "Chat Assistant"
                        : "Settings"}
            </h2>
          </div>
        </header>

        {activePage === "dashboard" ? (
          <Dashboard
            user={user}
            onAdd={() =>
              setModalOpen(true)
            }
          />
        ) : activePage === "transactions" ? (
          <Transactions
            user={user}
            onAdd={() => {
              setEditingTransaction(null);
              setModalOpen(true);
            }}
            onDelete={handleDeleteTransaction}
            onEdit={handleEditTransaction}
          />
        ) : activePage === "analytics" ? (
          <Analytics user={user} />
        ) : activePage === "withdrawals" ? (
          <Withdrawals
            user={user}
            onSave={(updatedUser) => {
              updateUser(updatedUser);
              setUser(updatedUser);
            }}
          />
        ) : activePage === "chat" ? (
          <Chat
            onAddTransaction={handleSaveTransaction}
            user={user}
          />
        ) : (
          <Settings
            user={user}
            onSave={(updatedUser) => {
              updateUser(updatedUser);
              setUser(updatedUser);
            }}
          />
        )}
      </main>

      {modalOpen && (
        <AddTransactionModal
          currency={user.currency}
          defaultCostAmount={user.defaultCostAmount}
          defaultCostSchedules={user.defaultCostSchedules}
          expenseIncludedByDefault={
            user.expenseIncludedByDefault
          }
          onClose={() => {
            setModalOpen(false);
            setEditingTransaction(null);
          }}
          onSave={handleSaveTransaction}
          initialTransaction={editingTransaction}
        />
      )}
    </div>
  );
};

export default App;
