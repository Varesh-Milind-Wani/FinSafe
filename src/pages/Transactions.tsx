import {
  Download,
  Plus,
} from "lucide-react";
import type {
  Transaction,
  UserAccount,
} from "../types/finance";
import TransactionTable from "../components/TransactionTable";
import { exportFinanceToExcel } from "../utils/excel";

interface Props {
  user: UserAccount;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

const Transactions = ({
  user,
  onAdd,
  onDelete,
  onEdit,
}: Props) => {
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            LEDGER
          </span>

          <h1>
            Transaction records
          </h1>

          <p>
            View and manage all your
            finance records.
          </p>
        </div>

        <div className="heading-actions">
          <button
            className="secondary-button"
            onClick={() =>
              exportFinanceToExcel(user)
            }
          >
            <Download size={17} />
            Export Excel
          </button>

          <button
            className="primary-button"
            onClick={onAdd}
          >
            <Plus size={17} />
            Add transaction
          </button>
        </div>
      </div>

      <TransactionTable
        transactions={
          user.transactions
        }
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </div>
  );
};

export default Transactions;
