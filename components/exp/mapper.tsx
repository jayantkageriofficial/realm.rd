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
  Group,
  MantineProvider,
  type MantineThemeOverride,
  Modal,
  Stack,
  TextInput,
  Tabs,
  FileInput,
  Text,
  Alert,
  Badge,
  Divider,
  Box,
  Card,
} from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect } from "react";
import { createMonth, getMonths } from "@/lib/actions/exp";
import type { Expenditure } from "@/lib/database/schema";
import { toast } from "react-hot-toast";
import * as XLSX from "sheetjs-style";

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

const useDisclosure = (initialState = false) => {
  const [opened, setOpened] = React.useState(initialState);

  const open = React.useCallback(() => setOpened(true), []);
  const close = React.useCallback(() => setOpened(false), []);
  const toggle = React.useCallback(() => setOpened((prev) => !prev), []);

  return [opened, { open, close, toggle }] as const;
};

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: "Credit" | "Debit";
  balance?: number;
}

interface Account {
  name: string;
  icon: "cash" | "bank";
}

interface Accounts {
  [key: string]: Account;
}

interface Transactions {
  [key: string]: Transaction[];
}

interface ImportSummary {
  accounts: number;
  totalTransactions: number;
  accountDetails: {
    name: string;
    transactions: number;
    balance: number;
  }[];
}

const NewMonthModal = ({
  opened,
  onClose,
  onCreate,
}: {
  opened: boolean;
  onClose: () => void;
  onCreate: (month: string, data?: string) => void;
}) => {
  const [month, setMonth] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [activeTab, setActiveTab] = React.useState<string | null>("create");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [importError, setImportError] = React.useState<string | null>(null);
  const [importSummary, setImportSummary] =
    React.useState<ImportSummary | null>(null);
  const [processedData, setProcessedData] = React.useState<string | null>(null);

  const handleCreate = () => {
    if (!month.trim()) {
      toast.error("Month name is required");
      return;
    }
    onCreate(month);
    setMonth("");
  };

  const processExcelFile = useCallback(async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    setImportError(null);
    setImportSummary(null);
    setProcessedData(null);

    try {
      const fileReader = new FileReader();

      fileReader.onload = async (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            setImportError("Failed to read file");
            setIsProcessing(false);
            return;
          }

          const workbook = XLSX.read(data, { type: "array" });

          if (workbook.SheetNames.length === 0) {
            setImportError("No sheets found in the file");
            setIsProcessing(false);
            return;
          }

          const accounts: Accounts = {};
          const transactions: Transactions = {};
          const summary: ImportSummary = {
            accounts: 0,
            totalTransactions: 0,
            accountDetails: [],
          };

          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const accountName = sheetName;

            interface ExcelRow {
              Date?: string;
              Description?: string;
              Amount?: string | number;
              Category?: string;
              Type?: string;
            }
            const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

            if (jsonData.length > 0) {
              const accountId = accountName.toLowerCase().replace(/\s+/g, "_");

              accounts[accountId] = {
                name: accountName,
                icon: accountName.toLowerCase().includes("cash")
                  ? "cash"
                  : "bank",
              };

              const accountTransactions = jsonData.map((row, index) => {
                let dateStr = row.Date;
                if (typeof dateStr === "string" && dateStr.includes("-")) {
                  const parts = dateStr.split("-");
                  if (parts.length === 3) {
                    const [day, month, year] = parts;
                    dateStr = `${year}-${month}-${day}`;
                  }
                }

                const amount =
                  typeof row.Amount === "number"
                    ? row.Amount
                    : parseFloat(row.Amount ?? "0") || 0;

                let type: "Credit" | "Debit";
                if (row.Type === "Credit" || row.Type === "Debit")
                  type = row.Type;
                else type = amount >= 0 ? "Credit" : "Debit";

                return {
                  id: Date.now() + index,
                  date: dateStr || new Date().toISOString().split("T")[0],
                  description: row.Description || "Imported transaction",
                  amount: amount,
                  category: row.Category || (amount >= 0 ? "Credit" : "Other"),
                  type: type,
                };
              });

              transactions[accountId] = accountTransactions;

              summary.accounts++;
              summary.totalTransactions += accountTransactions.length;

              const balance = accountTransactions.reduce(
                (sum, t) => sum + t.amount,
                0
              );

              summary.accountDetails.push({
                name: accountName,
                transactions: accountTransactions.length,
                balance: balance,
              });
            }
          });

          if (Object.keys(accounts).length === 0) {
            setImportError("No valid account data found in the file");
            setIsProcessing(false);
            return;
          }

          const dataJson = JSON.stringify({
            accounts,
            transactions,
          });

          setImportSummary(summary);
          setProcessedData(dataJson);
          setIsProcessing(false);
        } catch {
          setImportError(
            "Failed to process the file. Make sure it's a valid Excel file exported from Account Management."
          );
          setIsProcessing(false);
        }
      };

      fileReader.onerror = () => {
        setImportError("Failed to read the file");
        setIsProcessing(false);
      };

      fileReader.readAsArrayBuffer(file);
    } catch {
      setImportError("An error occurred while processing the file");
      setIsProcessing(false);
    }
  }, []);

  const handleImport = () => {
    if (!month.trim()) return toast.error("Month name is required");
    if (!processedData) return toast.error("No data to import");
    onCreate(month, processedData);
  };

  useEffect(() => {
    if (file) processExcelFile(file);
  }, [file, processExcelFile]);

  useEffect(() => {
    if (!opened) {
      setMonth("");
      setFile(null);
      setImportError(null);
      setImportSummary(null);
      setProcessedData(null);
      setActiveTab("create");
    }
  }, [opened]);

  return (
    <MantineProvider theme={theme}>
      <Modal
        opened={opened}
        onClose={onClose}
        title="Add New Month"
        centered
        size="lg"
      >
        <Tabs value={activeTab} onTabChange={setActiveTab}>
          <Tabs.List grow>
            <Tabs.Tab value="create">Create Empty Month</Tabs.Tab>
            <Tabs.Tab value="import">Import Data</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="create" pt="md">
            <Stack spacing="md">
              <TextInput
                label="Month Name"
                placeholder="e.g., September 2025"
                value={month}
                onChange={(event) => setMonth(event.currentTarget.value)}
                required
              />
              <Group position="right" mt="md">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!month.trim()}>
                  Create
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="import" pt="md">
            <Stack spacing="md">
              <Text size="sm" color="dimmed">
                Import data from an Excel file exported from Account Management
              </Text>

              <TextInput
                label="Month Name"
                placeholder="e.g., September 2025"
                value={month}
                onChange={(event) => setMonth(event.currentTarget.value)}
                required
              />

              <FileInput
                label="Select Excel File"
                // @ts-expect-error: Mantine types conflict with FileInput
                placeholder="Click to select file"
                accept=".xlsx"
                value={file}
                onChange={setFile}
                clearable
                required
              />

              {isProcessing && (
                <Alert color="blue" title="Processing">
                  Analyzing file data... This may take a moment.
                </Alert>
              )}

              {importError && (
                <Alert color="red" title="Import Error">
                  {importError}
                </Alert>
              )}

              {importSummary && (
                <Card withBorder shadow="sm" p="md">
                  <Text weight={700} size="lg" mb="xs">
                    Import Summary
                  </Text>
                  <Group position="apart" mb="xs">
                    <Text>Accounts Found:</Text>
                    <Badge size="lg" color="blue">
                      {importSummary.accounts}
                    </Badge>
                  </Group>
                  <Group position="apart" mb="xs">
                    <Text>Total Transactions:</Text>
                    <Badge size="lg" color="green">
                      {importSummary.totalTransactions}
                    </Badge>
                  </Group>

                  <Divider my="sm" />

                  <Text weight={600} size="sm" mb="xs">
                    Account Details:
                  </Text>
                  {importSummary.accountDetails.map((account, index) => (
                    <Box key={index} mb="xs">
                      <Group position="apart">
                        <Text weight={500}>{account.name}</Text>
                        <Text
                          size="sm"
                          color={account.balance >= 0 ? "green" : "red"}
                        >
                          Balance: ₹
                          {Math.abs(account.balance).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                      </Group>
                      <Text size="xs" color="dimmed">
                        {account.transactions} transactions
                      </Text>
                    </Box>
                  ))}
                </Card>
              )}

              <Group position="right" mt="md">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  loading={isProcessing}
                  disabled={!processedData || !month.trim()}
                  color="green"
                >
                  Import Data
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Modal>
    </MantineProvider>
  );
};

export default function ExpComponent(props: {
  total: number;
  init: Expenditure[];
}) {
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);
  const [info, setInfo] = React.useState<{
    total: number;
    page: number;
    months: Expenditure[];
    loading: boolean;
  }>({
    total: props.total,
    page: 1,
    months: props.init,
    loading: false,
  });

  const handleCreateMonth = async (month: string, data?: string) => {
    try {
      const id = await createMonth(month, data || "{}");
      close();
      router.push(`/exp/${id}`);
      toast.success(`Month ${month} created successfully`);
    } catch {
      toast.error("Failed to create month");
    }
  };

  return (
    <>
      <NewMonthModal
        opened={opened}
        onClose={close}
        onCreate={handleCreateMonth}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold lg:text-3xl text-white">
          Book of <span className="text-red-600">Expenditure</span> (
          {info.months.length}/{info.total})
        </h1>

        <button
          className="cursor-pointer"
          onClick={open}
          onKeyDown={(e) => {
            if (e.key === "Enter") open();
          }}
          type="button"
          tabIndex={0}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-8 text-red-600 rounded-full hover:text-blue-400 transition-all"
          >
            <title>Add Month Icon</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </button>
      </div>

      <hr className="mt-3 mb-8 border-gray-700" />

      <div className="grid md:grid-cols-2 gap-4">
        {info.months.map((month) => (
          <Link
            key={month.id}
            href={`/exp/${month.id}`}
            className="w-full p-8 rounded-lg shadow-md border-2 border-secondary hover:border-blue-700 transition-all transform-border overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-light text-gray-200">
                {month.timestamp?.toLocaleDateString()}
              </span>
            </div>

            <div className="mt-2">
              <span className="text-xl font-bold text-white underline">
                {month.month}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {info.total !== info.months.length && (
        <div className="flex justify-end">
          <button
            className={`px-6 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-300 transform rounded-lg bg-red-600 hover:bg-red-500 focus:outline-none focus:ring focus:ring-blue-500 focus:ring-opacity-80 justify-center ${
              info.loading ? "cursor-not-allowed" : "cursor-pointer"
            }`}
            disabled={info.loading}
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              setInfo({
                ...info,
                loading: true,
              });
              const notes = await getMonths(++info.page);
              setInfo({
                ...info,
                months: [...info.months, ...JSON.parse(notes)],
                page: ++info.page,
                loading: false,
              });
            }}
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
}
