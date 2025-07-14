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

import React, { useMemo, useCallback } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Paper,
  Text,
  Title,
} from "@mantine/core";
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
  type MRT_Cell,
} from "mantine-react-table";
import {
  EditIcon,
  FileExportIcon,
  PlusIcon,
  TrashIcon,
  categories,
  Transaction,
} from "@/components/exp/utils";

interface TransactionTableProps {
  transactions: Transaction[];
  onSaveTransaction: ({
    values,
    exitEditingMode,
    row,
  }: {
    values: Transaction;
    exitEditingMode: () => void;
    row: MRT_Row<Transaction>;
  }) => void;
  onCreateTransaction: () => void;
  onDeleteTransaction: (id: number) => void;
  onExportCSV: () => void;
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onSaveTransaction,
  onCreateTransaction,
  onDeleteTransaction,
  onExportCSV,
  tableContainerRef,
}) => {
  const AmountCell = useCallback(
    ({ cell }: { cell: MRT_Cell<Transaction> }) => {
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
          onKeyDown: (e: React.KeyboardEvent) => {
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
          onKeyDown: (e: React.KeyboardEvent) => {
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
    data: transactions,
    enableEditing: true,
    editDisplayMode: "row",
    enableRowActions: true,
    positionActionsColumn: "last",
    enableDensityToggle: false,
    enablePagination: false,
    enableBottomToolbar: false,
    enableSorting: true,
    getRowId: (row) => row.id.toString(),
    onEditingRowSave: onSaveTransaction,
    mantineTableBodyRowProps: ({ row, table }) => ({
      onDoubleClick: () => table.setEditingRow(row),
      sx: {
        backgroundColor:
          table.getState().editingRow?.id === row.id
            ? "var(--mantine-color-dark-6)"
            : "inherit",
      },
      onKeyDown: (event: React.KeyboardEvent) => {
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
            onClick={onCreateTransaction}
            leftIcon={<PlusIcon />}
            variant="filled"
          >
            Add Transaction
          </Button>
          <Button
            onClick={onExportCSV}
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
          onClick={() => onDeleteTransaction(row.original.id)}
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

  return (
    <Paper p="md" bg="dark.8" radius="md">
      <div ref={tableContainerRef}>
        <MantineReactTable table={table} />
      </div>
    </Paper>
  );
};

export default TransactionTable;
