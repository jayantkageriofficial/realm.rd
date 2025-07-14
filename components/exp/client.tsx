/*
 realm.rd, Scribble the plans, spill the thoughts.
 Copyright (C) 2025 Jayant Hegde Kageri <https://jayantkageri.in/>

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

"use client";

import {
  Button,
  Divider,
  Group,
  MantineProvider,
  Paper,
  Stack,
  Title,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { toast } from "react-hot-toast";
import { dltMonth, editMonth } from "@/lib/actions/exp";

import { TrashIcon } from "@/components/exp/utils";
import {
  theme,
  Accounts,
  Transaction,
  Transactions,
  exportToExcel,
  exportToCSV,
} from "@/components/exp/utils";
import AddAccountModal from "@/components/exp/modals/AddAccount";
import EditAccountModal from "@/components/exp/modals/EditAccount";
import DeleteAccountModal from "@/components/exp/modals/DeleteAccount";
import DeleteMonthModal from "@/components/exp/modals/DeleteMonth";
import AccountsList from "@/components/exp/accounts/List";
import AccountSummary from "@/components/exp/accounts/Summary";
import TransactionTable from "@/components/exp/accounts/TxnTable";

interface AccountManagementClientProps {
  initialData: {
    accounts: Accounts;
    transactions: Transactions;
    monthName: string;
    id: string;
  };
}

interface TransactionRow {
  original: Transaction;
  [key: string]: any;
}

const AccountManagementClient: React.FC<AccountManagementClientProps> = ({
  initialData,
}) => {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Accounts>(initialData.accounts);
  const [transactions, setTransactions] = useState<Transactions>(
    initialData.transactions
  );
  const [activeAccount, setActiveAccount] = useState<string>("");
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(
    null
  );
  const [isDeleteMonthModalOpen, setDeleteMonthModalOpen] = useState(false);
  const [monthName] = useState(initialData.monthName);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const firstAccountId = Object.keys(initialData.accounts)[0];
    if (firstAccountId) setActiveAccount(firstAccountId);
  }, [initialData.accounts]);

  const currentAccountData = useMemo(
    () => transactions[activeAccount] || [],
    [transactions, activeAccount]
  );

  const currentAccount = useMemo(
    () => accounts[activeAccount],
    [accounts, activeAccount]
  );

  const saveData = useCallback(
    async (
      updatedAccounts: Accounts,
      updatedTransactions: Transactions,
      month: string
    ) => {
      try {
        const data = JSON.stringify({
          accounts: updatedAccounts,
          transactions: updatedTransactions,
        });
        await editMonth(initialData.id, month, data);
      } catch {
        toast.error("Failed to save data.");
      }
    },
    [initialData.id]
  );

  const handleCreateAccount = useCallback(
    (name: string, balance: number, icon: "cash" | "bank") => {
      if (!name.trim()) return;

      const accountId = name.toLowerCase().replace(/\s+/g, "_");
      if (accounts[accountId])
        return toast.error("Account with this name already exists");

      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

      const newAccount = { name, icon };
      const newTransaction: Transaction = {
        id: Date.now(),
        date: firstDay.toISOString().split("T")[0],
        description: "Opening Balance",
        amount: balance,
        category: "Credit",
        type: "Credit",
      };

      const updatedAccounts = { ...accounts, [accountId]: newAccount };
      const updatedTransactions = {
        ...transactions,
        [accountId]: [newTransaction],
      };

      setAccounts(updatedAccounts);
      setTransactions(updatedTransactions);
      saveData(updatedAccounts, updatedTransactions, monthName);
      setActiveAccount(accountId);
      setAddModalOpen(false);
      toast.success("Account created successfully");
    },
    [accounts, transactions, saveData, monthName]
  );

  const handleUpdateAccount = useCallback(
    (name: string, icon: "cash" | "bank") => {
      if (!editingAccountId || !name.trim()) return;

      const isDuplicate = Object.entries(accounts).some(
        ([id, acc]) => id !== editingAccountId && acc.name === name
      );

      if (isDuplicate)
        return toast.error("An account with this name already exists.");

      const updatedAccounts = {
        ...accounts,
        [editingAccountId]: { ...accounts[editingAccountId], name, icon },
      };

      setAccounts(updatedAccounts);
      saveData(updatedAccounts, transactions, monthName);
      setEditingAccountId(null);
      toast.success("Account updated successfully");
    },
    [editingAccountId, accounts, transactions, saveData, monthName]
  );

  const handleDeleteAccount = useCallback(() => {
    if (!deletingAccountId) return;

    const newAccounts = { ...accounts };
    const newTransactions = { ...transactions };
    delete newAccounts[deletingAccountId];
    delete newTransactions[deletingAccountId];

    setAccounts(newAccounts);
    setTransactions(newTransactions);
    saveData(newAccounts, newTransactions, monthName);

    if (activeAccount === deletingAccountId)
      setActiveAccount(Object.keys(newAccounts)[0] || "");

    setDeletingAccountId(null);
    toast.success("Account deleted successfully");
  }, [
    deletingAccountId,
    accounts,
    transactions,
    activeAccount,
    saveData,
    monthName,
  ]);

  const handleDeleteMonth = useCallback(async () => {
    try {
      await dltMonth(initialData.id);
      toast.success("Month deleted successfully");
      router.push("/exp");
    } catch {
      toast.error("Failed to delete month.");
    } finally {
      setDeleteMonthModalOpen(false);
    }
  }, [initialData.id, router]);

  const handleSaveTransaction = useCallback(
    async ({
      values,
      exitEditingMode,
      row,
    }: {
      values: Transaction;
      exitEditingMode: () => void;
      row: TransactionRow;
    }) => {
      const amount =
        values.type === "Debit"
          ? -Math.abs(Number(values.amount))
          : Math.abs(Number(values.amount));

      const updatedTransactionsList = transactions[activeAccount].map(
        (transaction) =>
          transaction.id === row.original.id
            ? {
                ...transaction,
                ...values,
                amount,
              }
            : transaction
      );
      const updatedTransactions = {
        ...transactions,
        [activeAccount]: updatedTransactionsList,
      };
      setTransactions(updatedTransactions);
      saveData(accounts, updatedTransactions, monthName);

      exitEditingMode();
      toast.success("Transaction updated successfully");
    },
    [activeAccount, transactions, saveData, monthName, accounts]
  );

  const handleCreateTransaction = useCallback(() => {
    const newTransaction: Transaction = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      description: "New Transaction",
      amount: 0,
      category: "Other",
      type: "Debit",
    };

    const updatedTransactions = {
      ...transactions,
      [activeAccount]: [...(transactions[activeAccount] || []), newTransaction],
    };

    setTransactions(updatedTransactions);
    saveData(accounts, updatedTransactions, monthName);
  }, [activeAccount, transactions, saveData, monthName, accounts]);

  const handleDeleteTransaction = useCallback(
    (transactionId: number) => {
      const updatedTransactionsList = transactions[activeAccount].filter(
        (t) => t.id !== transactionId
      );
      const updatedTransactions = {
        ...transactions,
        [activeAccount]: updatedTransactionsList,
      };
      setTransactions(updatedTransactions);
      saveData(accounts, updatedTransactions, monthName);
      toast.success("Transaction deleted successfully");
    },
    [activeAccount, transactions, saveData, monthName, accounts]
  );

  const handleExportExcel = useCallback(async () => {
    try {
      toast.loading("Processing", { id: "excel-export" });
      await exportToExcel(accounts, transactions, monthName);
      toast.success("Data exported successfully", { id: "excel-export" });
    } catch {
      toast.error("Failed to export data", { id: "excel-export" });
    }
  }, [accounts, transactions, monthName]);

  const handleExportCSV = useCallback(() => {
    try {
      exportToCSV(currentAccountData, currentAccount?.name);
      toast.success("CSV exported successfully");
    } catch {
      toast.error("Failed to export CSV");
    }
  }, [currentAccountData, currentAccount]);

  return (
    <MantineProvider theme={theme}>
      <div
        style={{
          backgroundColor: "var(--mantine-color-dark-9)",
          minHeight: "100vh",
          padding: "2rem",
        }}
      >
        <Stack spacing="lg">
          <Group position="apart">
            <Title order={1} c="white">
              {monthName || "Account Management System"}
            </Title>
            <Button
              color="red"
              variant="outline"
              onClick={() => setDeleteMonthModalOpen(true)}
              leftIcon={<TrashIcon />}
            >
              Delete Month
            </Button>
          </Group>

          <AccountsList
            accounts={accounts}
            transactions={transactions}
            activeAccount={activeAccount}
            onSelectAccount={setActiveAccount}
            onAddAccount={() => setAddModalOpen(true)}
            onEditAccount={setEditingAccountId}
            onDeleteAccount={setDeletingAccountId}
            onExportData={handleExportExcel}
          />

          <Paper p="md" bg="dark.8" radius="md">
            <Divider my="md" />
            <Group>
              <AccountSummary
                account={currentAccount}
                transactions={currentAccountData}
              />
            </Group>
          </Paper>

          <TransactionTable
            transactions={currentAccountData}
            onSaveTransaction={handleSaveTransaction}
            onCreateTransaction={handleCreateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onExportCSV={handleExportCSV}
            tableContainerRef={tableContainerRef}
          />
        </Stack>

        <AddAccountModal
          opened={isAddModalOpen}
          onClose={() => setAddModalOpen(false)}
          onCreate={handleCreateAccount}
        />

        <DeleteAccountModal
          opened={!!deletingAccountId}
          onClose={() => setDeletingAccountId(null)}
          onConfirm={handleDeleteAccount}
          accountName={
            deletingAccountId ? accounts[deletingAccountId]?.name || "" : ""
          }
        />

        <DeleteMonthModal
          opened={isDeleteMonthModalOpen}
          onClose={() => setDeleteMonthModalOpen(false)}
          onConfirm={handleDeleteMonth}
          monthName={monthName}
        />

        <EditAccountModal
          opened={!!editingAccountId}
          onClose={() => setEditingAccountId(null)}
          onSave={handleUpdateAccount}
          account={editingAccountId ? accounts[editingAccountId] : null}
        />
      </div>
    </MantineProvider>
  );
};

export default AccountManagementClient;
