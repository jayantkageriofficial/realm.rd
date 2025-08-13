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

import XLSX from "sheetjs-style";
import type { MantineThemeOverride } from "@mantine/core";

export const categories = [
  "Credit",
  "Food",
  "Utility",
  "Investment",
  "Lending",
  "Hospital",
  "Entertainment",
  "Shopping",
  "Travel",
  "Other",
];

export const theme: MantineThemeOverride = {
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

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const CashIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
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

export const BankIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    style={{ width: size, height: size }}
    {...props}
  >
    <title>Bank Icon</title>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"
    />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
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

export const PlusIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
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

export const EditIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
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

export const DotsVerticalIcon: React.FC<IconProps> = ({
  size = 24,
  ...props
}) => (
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

export const FileExportIcon: React.FC<IconProps> = ({
  size = 24,
  ...props
}) => (
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

export const AlertCircleIcon: React.FC<IconProps> = ({
  size = 24,
  ...props
}) => (
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

export const exportToExcel = async (
  accounts: Accounts,
  transactions: Transactions,
  monthName: string
): Promise<void> => {
  try {
    const wb = XLSX.utils.book_new();

    const allTransactions: {
      Account: string;
      Date: string;
      Description: string;
      Debit: number | "";
      Credit: number | "";
      Balance: number;
      Type: "Credit" | "Debit";
      Category: string;
      AccountId: string;
    }[] = [];

    Object.entries(accounts).forEach(([accountId, account]) => {
      const accountTransactions = transactions[accountId] || [];
      let runningBalance = 0;

      const dataForSheet = accountTransactions.map((t) => {
        runningBalance += t.amount;
        allTransactions.push({
          Account: account.name,
          Date: t.date,
          Description: t.description,
          Debit: t.type === "Debit" ? Math.abs(t.amount) : "",
          Credit: t.type === "Credit" ? t.amount : "",
          Balance: runningBalance,
          Type: t.type,
          Category: t.category,
          AccountId: accountId,
        });

        return {
          Date: new Date(t.date)
            .toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
            .replace(/\//g, "-"),
          Description: t.description,
          Debit: t.type === "Debit" ? Math.abs(t.amount) : "",
          Credit: t.type === "Credit" ? t.amount : "",
          Balance: runningBalance,
          Category: t.category,
        };
      });

      const sheetName = account.name
        .replace(/[*?:/\\[\]]/g, "_")
        .substring(0, 31);

      const ws = XLSX.utils.json_to_sheet(dataForSheet);
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;

        ws[cellAddress].s = {
          font: {
            bold: true,
            color: { rgb: "000000" },
          },
          fill: {
            patternType: "solid",
            fgColor: { rgb: "FFFF00" },
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }

      for (let row = 1; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });

          if (!ws[cellAddress]) ws[cellAddress] = { v: null, t: "z" };

          ws[cellAddress].s = {
            font: { color: { rgb: "000000" } },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } },
            },
            alignment: { vertical: "center" },
          };

          if (col === 2) {
            ws[cellAddress].s.numFmt = "₹#,##0.00";
            ws[cellAddress].s.alignment = {
              horizontal: "right",
              vertical: "center",
            };
          }

          if (col === 3) {
            ws[cellAddress].s.numFmt = "₹#,##0.00";
            ws[cellAddress].s.alignment = {
              horizontal: "right",
              vertical: "center",
            };
          }

          if (col === 4) {
            ws[cellAddress].s.numFmt = "₹#,##0.00";
            ws[cellAddress].s.alignment = {
              horizontal: "right",
              vertical: "center",
            };
          }

          if (col === 5)
            ws[cellAddress].s.alignment = {
              horizontal: "center",
              vertical: "center",
            };
        }
      }

      ws["!cols"] = [
        { width: 12 }, // Date
        { width: 25 }, // Description
        { width: 15 }, // Debit
        { width: 15 }, // Credit
        { width: 15 }, // Balance
        { width: 15 }, // Category
      ];

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    allTransactions.sort(
      (a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime()
    );

    const accountBalances: { [accountId: string]: number } = {};
    const summaryData = allTransactions.map((t) => {
      if (!accountBalances[t.AccountId]) {
        accountBalances[t.AccountId] = 0;
      }

      const amount =
        t.Type === "Credit" ? (t.Credit as number) : -(t.Debit as number);
      accountBalances[t.AccountId] += amount;

      return {
        Account: t.Account,
        Date: new Date(t.Date)
          .toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, "-"),
        Description: t.Description,
        Debit: t.Type === "Debit" ? t.Debit : "",
        Credit: t.Type === "Credit" ? t.Credit : "",
        Balance: accountBalances[t.AccountId],
        Category: t.Category,
      };
    });

    const summaryWSData = summaryData.map((item) => ({
      Account: item.Account,
      Date: item.Date,
      Description: item.Description,
      Debit: item.Debit,
      Credit: item.Credit,
      Balance: item.Balance,
      Category: item.Category,
    }));

    const summaryWS = XLSX.utils.json_to_sheet(summaryWSData);

    const dataRange = XLSX.utils.decode_range(summaryWS["!ref"] || "A1");
    const lastDataRow = dataRange.e.r;

    const categoryData: {
      [category: string]: {
        Category: string;
        Credit: number;
        Debit: number;
      };
    } = {};

    allTransactions.forEach((t) => {
      if (!categoryData[t.Category])
        categoryData[t.Category] = {
          Category: t.Category,
          Credit: 0,
          Debit: 0,
        };

      if (t.Type === "Credit")
        categoryData[t.Category].Credit += t.Credit as number;
      else categoryData[t.Category].Debit += t.Debit as number;
    });

    const pivotData = Object.values(categoryData);
    pivotData.sort((a, b) => b.Credit - b.Debit - (a.Credit - a.Debit));

    const totalRow = {
      Category: "TOTAL",
      Debit: pivotData.reduce((sum, item) => sum + item.Debit, 0),
      Credit: pivotData.reduce((sum, item) => sum + item.Credit, 0),
    };

    pivotData.push(totalRow);

    const pivotStartRow = lastDataRow + 3;
    const headers = ["Category", "Debit", "Credit"]; // Swapped order
    headers.forEach((header, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({
        r: pivotStartRow,
        c: colIndex,
      });
      summaryWS[cellAddress] = { v: header, t: "s" };
      summaryWS[cellAddress].s = {
        font: {
          bold: true,
          color: { rgb: "000000" },
        },
        fill: {
          patternType: "solid",
          fgColor: { rgb: "FFFF00" },
        },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
        alignment: { horizontal: "center", vertical: "center" },
      };
    });

    pivotData.forEach((row, rowIndex) => {
      const isTotal = rowIndex === pivotData.length - 1;
      const currentRow = pivotStartRow + rowIndex + 1;

      const categoryCell = XLSX.utils.encode_cell({ r: currentRow, c: 0 });
      summaryWS[categoryCell] = { v: row.Category, t: "s" };

      const debitCell = XLSX.utils.encode_cell({ r: currentRow, c: 1 });
      summaryWS[debitCell] = { v: row.Debit, t: "n" };

      const creditCell = XLSX.utils.encode_cell({ r: currentRow, c: 2 });
      summaryWS[creditCell] = { v: row.Credit, t: "n" };

      [categoryCell, debitCell, creditCell].forEach((cell, colIndex) => {
        summaryWS[cell].s = {
          font: {
            color: { rgb: "000000" },
            bold: isTotal,
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
          alignment: { vertical: "center" },
          ...(isTotal && {
            fill: {
              patternType: "solid",
              fgColor: { rgb: "FFFF00" },
            },
          }),
        };

        if (colIndex >= 1) {
          summaryWS[cell].s.numFmt = "₹#,##0.00";
          summaryWS[cell].s.alignment = {
            horizontal: "right",
            vertical: "center",
          };
        }
      });
    });

    const lastPivotRow = pivotStartRow + pivotData.length;
    summaryWS["!ref"] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: lastPivotRow, c: 6 },
    });

    const summaryRange = XLSX.utils.decode_range(
      XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: lastDataRow, c: 6 },
      })
    );

    for (let col = summaryRange.s.c; col <= summaryRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });

      if (!summaryWS[cellAddress]) summaryWS[cellAddress] = { v: "", t: "s" };

      summaryWS[cellAddress].s = {
        font: {
          bold: true,
          color: { rgb: "000000" },
        },
        fill: {
          patternType: "solid",
          fgColor: { rgb: "FFFF00" },
        },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    for (let row = 1; row <= summaryRange.e.r; row++) {
      for (let col = summaryRange.s.c; col <= summaryRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });

        if (!summaryWS[cellAddress])
          summaryWS[cellAddress] = { v: null, t: "z" };

        summaryWS[cellAddress].s = {
          font: { color: { rgb: "000000" } },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
          alignment: { vertical: "center" },
        };

        if (col === 3) {
          summaryWS[cellAddress].s.numFmt = "₹#,##0.00";
          summaryWS[cellAddress].s.alignment = {
            horizontal: "right",
            vertical: "center",
          };
        }

        if (col === 4) {
          summaryWS[cellAddress].s.numFmt = "₹#,##0.00";
          summaryWS[cellAddress].s.alignment = {
            horizontal: "right",
            vertical: "center",
          };
        }

        if (col === 5) {
          summaryWS[cellAddress].s.numFmt = "₹#,##0.00";
          summaryWS[cellAddress].s.alignment = {
            horizontal: "right",
            vertical: "center",
          };
        }

        if (col === 6)
          summaryWS[cellAddress].s.alignment = {
            horizontal: "center",
            vertical: "center",
          };
      }
    }

    summaryWS["!cols"] = [
      { width: 20 }, // Account
      { width: 12 }, // Date
      { width: 25 }, // Description
      { width: 15 }, // Debit
      { width: 15 }, // Credit
      { width: 15 }, // Balance
      { width: 15 }, // Category
    ];

    XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

    const wbout = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });

    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${monthName} (as on ${
      new Date().toISOString().split("T")[0]
    }).xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

export const exportToCSV = (
  transactions: Transaction[],
  accountName?: string
): void => {
  const headers = [
    "Date",
    "Description",
    "Amount",
    "Type",
    "Category",
    "Balance",
  ];

  const sortedData = [...transactions].sort(
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
  a.download = `${accountName || "account"}-${
    new Date().toISOString().split("T")[0]
  }.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
