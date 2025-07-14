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

import React from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  FileInput,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";

export interface ImportSummaryData {
  accounts: number;
  totalTransactions: number;
  accountDetails: {
    name: string;
    transactions: number;
    balance: number;
  }[];
}

interface ImportDataFormProps {
  month: string;
  setMonth: (value: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  isProcessing: boolean;
  importError: string | null;
  importSummary: ImportSummaryData | null;
  onClose: () => void;
  onImport: () => void;
  processedData: string | null;
}

const ImportDataForm: React.FC<ImportDataFormProps> = ({
  month,
  setMonth,
  file,
  setFile,
  isProcessing,
  importError,
  importSummary,
  onClose,
  onImport,
  processedData,
}) => {
  return (
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
                <Text size="sm" color={account.balance >= 0 ? "green" : "red"}>
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
        <Button variant="outline" onClick={onClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button
          onClick={onImport}
          loading={isProcessing}
          disabled={!processedData || !month.trim()}
          color="green"
        >
          Import Data
        </Button>
      </Group>
    </Stack>
  );
};

export default ImportDataForm;
