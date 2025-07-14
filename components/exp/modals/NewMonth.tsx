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

import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Group,
  MantineProvider,
  type MantineThemeOverride,
  Modal,
  Stack,
  Tabs,
  TextInput,
} from "@mantine/core";
import { toast } from "react-hot-toast";
import { read, utils } from "sheetjs-style";
import ImportDataForm, {
  ImportSummaryData,
} from "@/components/exp/modals/ImportData";

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

interface Account {
  name: string;
  icon: "cash" | "bank";
}

interface Accounts {
  [key: string]: Account;
}

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: "Credit" | "Debit";
  balance?: number;
}

interface Transactions {
  [key: string]: Transaction[];
}

interface NewMonthModalProps {
  opened: boolean;
  onClose: () => void;
  onCreate: (month: string, data?: string) => void;
}

const NewMonthModal: React.FC<NewMonthModalProps> = ({
  opened,
  onClose,
  onCreate,
}) => {
  const [month, setMonth] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>("create");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummaryData | null>(
    null
  );
  const [processedData, setProcessedData] = useState<string | null>(null);

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

          const workbook = read(data, { type: "array" });

          if (workbook.SheetNames.length === 0) {
            setImportError("No sheets found in the file");
            setIsProcessing(false);
            return;
          }

          const accounts: Accounts = {};
          const transactions: Transactions = {};
          const summary: ImportSummaryData = {
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
            const jsonData = utils.sheet_to_json<ExcelRow>(worksheet);

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
        } catch (error) {
          console.error(error);
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
    } catch (error) {
      console.error(error);
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
            <ImportDataForm
              month={month}
              setMonth={setMonth}
              file={file}
              setFile={setFile}
              isProcessing={isProcessing}
              importError={importError}
              importSummary={importSummary}
              onClose={onClose}
              onImport={handleImport}
              processedData={processedData}
            />
          </Tabs.Panel>
        </Tabs>
      </Modal>
    </MantineProvider>
  );
};

export default NewMonthModal;
