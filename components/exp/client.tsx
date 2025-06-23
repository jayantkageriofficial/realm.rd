/*
 realm.rd, Scribble the plans, spill the thoughts.
 Copyright (C) 2025 Jayant Hegde Kageri <https://github.com/jayantkageri/>

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
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  MantineProvider,
  type MantineThemeOverride,
  Menu,
  Modal,
  NumberInput,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  MantineReactTable,
  type MRT_ColumnDef,
  useMantineReactTable,
} from "mantine-react-table";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { utils, write } from "xlsx";
import { dltMonth, editMonth } from "@/lib/actions/exp";

const CashIcon = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: size, height: size }}
    {...props}
  >
    <title>Cash Icon</title>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
    />
  </svg>
);

const BankIcon = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: size, height: size }}
    {...props}
  >
    <title>Back Icon</title>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"
    />
  </svg>
);

const TrashIcon = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: size, height: size }}
    {...props}
  >
    <title>Trash Icon</title>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </svg>
);

const PlusIcon = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: size, height: size }}
    {...props}
  >
    <title>Plus Icon</title>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

const EditIcon = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: size, height: size }}
    {...props}
  >
    <title>Edit Icon</title>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
    />
  </svg>
);

const DotsVerticalIcon = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: size, height: size }}
    {...props}
  >
    <title>Menu Icon</title>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
    />
  </svg>
);

const FileExportIcon = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: size, height: size }}
    {...props}
  >
    <title>Export Icon</title>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
    />
  </svg>
);

const AlertCircleIcon = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: size, height: size }}
    {...props}
  >
    <title>Close Icon</title>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18 18 6M6 6l12 12"
    />
  </svg>
);

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: "Credit" | "Debit";
  balance?: number;
}

export interface Account {
  name: string;
  icon: "cash" | "bank";
}

export interface Accounts {
  [key: string]: Account;
}

export interface Transactions {
  [key: string]: Transaction[];
}

const theme: MantineThemeOverride = {
  colorScheme: "dark",
  colors: {
    dark: [
      "#C1C2C5",
      "#A6A7AB",
      "#909296",
      "#5c5f66",
      "#373A40",
      "#2C2E33",
      "#25262b",
      "#1A1B1E",
      "#141517",
      "#101113",
    ],
  },
};

const categories = [
  "Credit",
  "Food",
  "Utility",
  "Investment",
  "Hospital",
  "Entertainment",
  "Shopping",
  "Travel",
  "Other",
];

const AddAccountModal = ({
  opened,
  onClose,
  onCreate,
}: {
  opened: boolean;
  onClose: () => void;
  onCreate: (name: string, balance: number, icon: "cash" | "bank") => void;
}) => {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState(0);
  const [icon, setIcon] = useState<"cash" | "bank">("bank");

  const handleCreate = () => {
    onCreate(name, balance, icon);
    setName("");
    setBalance(0);
    setIcon("bank");
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Add New Account" centered>
      <Stack spacing="md">
        <TextInput
          label="Account Name"
          placeholder="e.g., Main Bank Account"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          required
        />
        <NumberInput
          label="Opening Balance"
          value={balance}
          onChange={(value) => setBalance(value || 0)}
          required
        />
        <SegmentedControl
          value={icon}
          onChange={(value: "cash" | "bank") => setIcon(value)}
          data={[
            { label: "Bank", value: "bank" },
            { label: "Cash", value: "cash" },
          ]}
        />
        <Group position="right" mt="md">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Account</Button>
        </Group>
      </Stack>
    </Modal>
  );
};

const EditAccountModal = ({
  opened,
  onClose,
  onSave,
  account,
}: {
  opened: boolean;
  onClose: () => void;
  onSave: (name: string, icon: "cash" | "bank") => void;
  account: Account | null;
}) => {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<"cash" | "bank">("bank");

  useEffect(() => {
    if (account) {
      setName(account.name);
      setIcon(account.icon);
    }
  }, [account]);

  const handleSave = () => onSave(name, icon);

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Account" centered>
      <Stack>
        <TextInput
          label="Account Name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <SegmentedControl
          value={icon}
          onChange={(value: "cash" | "bank") => setIcon(value)}
          data={[
            { label: "Bank", value: "bank" },
            { label: "Cash", value: "cash" },
          ]}
          fullWidth
          mt="md"
        />
        <Group position="right" mt="md">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </Group>
      </Stack>
    </Modal>
  );
};

const DeleteAccountModal = ({
  opened,
  onClose,
  onConfirm,
  accountName,
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  accountName: string;
}) => (
  <Modal opened={opened} onClose={onClose} title="Delete Account" centered>
    <Stack spacing="md">
      <Alert color="red" icon={<AlertCircleIcon />}>
        Are you sure you want to delete this account? This action cannot be
        undone and will remove all associated transactions.
      </Alert>
      <Text>
        Account: <strong>{accountName}</strong>
      </Text>
      <Group position="right">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button color="red" onClick={onConfirm}>
          Delete Account
        </Button>
      </Group>
    </Stack>
  </Modal>
);

const DeleteMonthModal = ({
  opened,
  onClose,
  onConfirm,
  monthName,
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  monthName: string;
}) => {
  const [confirmationText, setConfirmationText] = useState("");
  const isConfirmed = confirmationText === "ok delete";

  const handleConfirm = () => {
    if (isConfirmed) onConfirm();
  };

  useEffect(() => {
    if (opened) setConfirmationText("");
  }, [opened]);

  return (
    <Modal opened={opened} onClose={onClose} title="Delete Month" centered>
      <Stack spacing="md">
        <Alert color="red" icon={<AlertCircleIcon />}>
          Are you sure you want to delete this month? This action cannot be
          undone and will remove all associated accounts and transactions.
        </Alert>
        <Text>
          Month: <strong>{monthName}</strong>
        </Text>
        <Text size="sm">
          To confirm, please type &quot;ok delete&quot; in the box below.
        </Text>
        <TextInput
          placeholder="ok delete"
          value={confirmationText}
          onChange={(event) => setConfirmationText(event.currentTarget.value)}
        />
        <Group position="right">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={handleConfirm} disabled={!isConfirmed}>
            Delete Month
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

interface AccountManagementClientProps {
  initialData: {
    accounts: Accounts;
    transactions: Transactions;
    monthName: string;
    id: string;
  };
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
  const currentAccount = accounts[activeAccount];

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
      } catch (error) {
        console.error("Failed to save data:", error);
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
    } catch (error) {
      console.error("Failed to delete month:", error);
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
      row: import("mantine-react-table").MRT_Row<Transaction>;
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

  const handleExportExcel = useCallback(() => {
    try {
      const wb = utils.book_new();

      Object.entries(accounts).forEach(([accountId, account]) => {
        const accountTransactions = transactions[accountId] || [];
        let runningBalance = 0;
        const dataForSheet = accountTransactions.map((t) => {
          runningBalance += t.amount;
          return {
            Date: t.date,
            Description: t.description,
            Amount: t.amount,
            Type: t.type,
            Category: t.category,
            Balance: runningBalance,
          };
        });

        const ws = utils.json_to_sheet(dataForSheet);
        const sheetName = account.name
          .replace(/[*?:/\\[\]]/g, "_")
          .substring(0, 31);
        utils.book_append_sheet(wb, ws, sheetName);
      });

      const wbout = write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `account-data-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export data");
    }
  }, [accounts, transactions]);

  const handleExportCSV = useCallback(() => {
    try {
      const headers = [
        "Date",
        "Description",
        "Amount",
        "Type",
        "Category",
        "Balance",
      ];

      const sortedData = [...currentAccountData].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      let runningBalance = 0;
      const csvRows = sortedData.map((row) => {
        runningBalance += row.amount;
        return [
          row.date,
          `"${row.description.replace(/"/g, '""')}"`,
          row.amount,
          row.type,
          row.category,
          runningBalance,
        ].join(",");
      });

      const csvContent = [headers.join(","), ...csvRows].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentAccount?.name || "account"}-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    } catch {
      toast.error("Failed to export CSV");
    }
  }, [currentAccountData, currentAccount]);

  const AmountCell = useCallback(
    ({
      cell,
    }: {
      cell: import("mantine-react-table").MRT_Cell<Transaction>;
    }) => {
      const value = cell.getValue() as number;
      return (
        <Text color={value >= 0 ? "green" : "red"} fw={500} size="sm">
          ₹
          {Math.abs(value).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </Text>
      );
    },
    []
  );

  const columns = useMemo<MRT_ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        size: 130,
        mantineEditTextInputProps: {
          type: "date",
        },
        Cell: ({ cell }) => {
          const dateString = cell.getValue() as string;
          if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
          }
          const [year, month, day] = dateString.split("-");
          return `${day}-${month}-${year}`;
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        size: 250,
        mantineEditTextInputProps: {
          autoComplete: "off",
        },
      },
      {
        accessorKey: "amount",
        header: "Amount",
        size: 120,
        Cell: AmountCell,
        mantineEditTextInputProps: {
          type: "number",
          styles: {
            input: {
              backgroundColor: "var(--mantine-color-dark-7)",
              color: "white",
              border: "1px solid var(--mantine-color-blue-6)",
            },
          },
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        size: 100,
        editVariant: "select",
        mantineEditSelectProps: {
          data: ["Credit", "Debit"],
          onKeyDown: (e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
            }
          },
        },
        Cell: ({ cell }) => {
          const value = cell.getValue() as string;
          return (
            <Badge
              color={value === "Credit" ? "green" : "red"}
              variant="filled"
              size="sm"
            >
              {value}
            </Badge>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        size: 130,
        editVariant: "select",
        mantineEditSelectProps: {
          data: categories,
          onKeyDown: (e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
            }
          },
        },
      },
      {
        id: "balance",
        header: "Balance",
        size: 140,
        enableEditing: false,
        Cell: ({ row, table }) => {
          const sortedRows = table.getSortedRowModel().rows;
          const currentRowIndex = sortedRows.findIndex(
            (sortedRow) => sortedRow.id === row.id
          );
          if (currentRowIndex === -1) return null;

          let runningBalance = 0;
          for (let i = 0; i <= currentRowIndex; i++) {
            runningBalance += sortedRows[i].original.amount;
          }

          return (
            <Text
              color={runningBalance >= 0 ? "green" : "red"}
              fw={600}
              size="sm"
            >
              ₹
              {runningBalance.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </Text>
          );
        },
      },
    ],
    [AmountCell]
  );

  const table = useMantineReactTable({
    columns,
    data: currentAccountData,
    enableEditing: true,
    editDisplayMode: "row",
    enableRowActions: true,
    positionActionsColumn: "last",
    enableDensityToggle: false,
    enablePagination: false,
    enableBottomToolbar: false,
    enableSorting: true,
    getRowId: (row) => row.id.toString(),
    onEditingRowSave: handleSaveTransaction,
    mantineTableBodyRowProps: ({ row, table }) => ({
      onDoubleClick: () => table.setEditingRow(row),
      sx: {
        backgroundColor:
          table.getState().editingRow?.id === row.id
            ? "var(--mantine-color-dark-6)"
            : "inherit",
      },
      onKeyDown: (event) => {
        if (event.key === "Escape") table.setEditingRow(null);
        else if (event.key === "Enter") {
          const saveButton =
            tableContainerRef.current?.querySelector<HTMLButtonElement>(
              'button[aria-label="Save"]'
            );
          if (saveButton) saveButton.click();
        }
      },
    }),
    mantineTableProps: {
      sx: {
        "& .mantine-Table-root": {
          backgroundColor: "var(--mantine-color-dark-8)",
        },
      },
    },
    mantineTableHeadProps: {
      sx: {
        "& .mantine-TableTh-root": {
          backgroundColor: "var(--mantine-color-dark-7)",
          color: "var(--mantine-color-gray-0)",
        },
      },
    },
    mantineTableBodyProps: {
      sx: {
        "& .mantine-TableTr-root": {
          backgroundColor: "var(--mantine-color-dark-8)",
          "&:hover": {
            backgroundColor: "var(--mantine-color-dark-7)",
          },
        },
        "& .mantine-TableTd-root": {
          borderColor: "var(--mantine-color-dark-6)",
        },
      },
    },
    renderTopToolbarCustomActions: () => (
      <Group position="apart" style={{ width: "100%" }}>
        <Title order={4} c="white">
          Transactions
        </Title>
        <Group>
          <Button
            onClick={handleCreateTransaction}
            leftIcon={<PlusIcon />}
            variant="filled"
          >
            Add Transaction
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            leftIcon={<FileExportIcon />}
          >
            Export CSV
          </Button>
        </Group>
      </Group>
    ),
    renderRowActions: ({ row, table }) => (
      <Group spacing="xs">
        <ActionIcon
          color="blue"
          onClick={() => table.setEditingRow(row)}
          variant="filled"
          size="sm"
        >
          <EditIcon size={14} />
        </ActionIcon>
        <ActionIcon
          color="red"
          onClick={() => handleDeleteTransaction(row.original.id)}
          variant="filled"
          size="sm"
        >
          <TrashIcon size={14} />
        </ActionIcon>
      </Group>
    ),
    initialState: {
      density: "xs",
      sorting: [{ id: "date", desc: false }],
    },
  });

  const currentBalance = useMemo(
    () => currentAccountData.reduce((sum, row) => sum + row.amount, 0),
    [currentAccountData]
  );

  const totalCredits = useMemo(
    () =>
      currentAccountData.reduce(
        (sum, row) => sum + (row.amount > 0 ? row.amount : 0),
        0
      ),
    [currentAccountData]
  );

  const totalDebits = useMemo(
    () =>
      currentAccountData.reduce(
        (sum, row) => sum + (row.amount < 0 ? Math.abs(row.amount) : 0),
        0
      ),
    [currentAccountData]
  );

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

          <Paper p="md" bg="dark.8" radius="md">
            <Group position="apart" mb="md">
              <Title order={3} c="white">
                Accounts Overview
              </Title>
              <Group>
                <Button
                  onClick={() => setAddModalOpen(true)}
                  leftIcon={<PlusIcon />}
                >
                  Add Account
                </Button>
                <Button
                  onClick={handleExportExcel}
                  variant="outline"
                  leftIcon={<FileExportIcon />}
                >
                  Export All Data
                </Button>
              </Group>
            </Group>

            <SimpleGrid cols={3} breakpoints={[{ maxWidth: "sm", cols: 1 }]}>
              {Object.entries(accounts).map(([accountId, account]) => {
                const accountTransactions = transactions[accountId] || [];
                const accountBalance = accountTransactions.reduce(
                  (sum, t) => sum + t.amount,
                  0
                );

                return (
                  <Card
                    key={accountId}
                    p="md"
                    bg={activeAccount === accountId ? "dark.6" : "dark.7"}
                    style={{
                      cursor: "pointer",
                      border:
                        activeAccount === accountId
                          ? "2px solid #339af0"
                          : "2px solid transparent",
                    }}
                    onClick={() => setActiveAccount(accountId)}
                  >
                    <Group position="apart" align="flex-start">
                      <Stack spacing="xs">
                        <Group>
                          {account.icon === "cash" ? (
                            <CashIcon size={20} />
                          ) : (
                            <BankIcon size={20} />
                          )}
                          <Text fw={600} c="white">
                            {account.name}
                          </Text>
                        </Group>
                        <Text
                          size="xl"
                          fw={700}
                          c={accountBalance >= 0 ? "green" : "red"}
                        >
                          ₹
                          {accountBalance.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {accountTransactions.length} transactions
                        </Text>
                      </Stack>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={(e: React.MouseEvent) =>
                              e.stopPropagation()
                            }
                          >
                            <DotsVerticalIcon size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            icon={<EditIcon size={14} />}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setEditingAccountId(accountId);
                            }}
                          >
                            Edit Account
                          </Menu.Item>
                          <Menu.Item
                            color="red"
                            icon={<TrashIcon size={14} />}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setDeletingAccountId(accountId);
                            }}
                          >
                            Delete Account
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Card>
                );
              })}
            </SimpleGrid>
            <Divider my="md" />
            <Group>
              <div>
                <Title order={4} c="white" mb="xs">
                  {currentAccount?.name} - Summary
                </Title>
                <Group>
                  <div>
                    <Text size="sm" c="dimmed">
                      Current Balance
                    </Text>
                    <Text
                      size="xl"
                      fw={700}
                      c={currentBalance >= 0 ? "green" : "red"}
                    >
                      ₹
                      {currentBalance.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">
                      Total Credits
                    </Text>
                    <Text size="lg" fw={600} c="green">
                      ₹
                      {totalCredits.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">
                      Total Debits
                    </Text>
                    <Text size="lg" fw={600} c="red">
                      ₹
                      {totalDebits.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">
                      Total Transactions
                    </Text>
                    <Text size="lg" fw={600} c="blue">
                      {currentAccountData.length}
                    </Text>
                  </div>
                </Group>
              </div>
            </Group>
          </Paper>

          <Paper p="md" bg="dark.8" radius="md">
            <div ref={tableContainerRef}>
              <MantineReactTable table={table} />
            </div>
          </Paper>
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
