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
import { Group, Text, Title } from "@mantine/core";
import { Account, Transaction } from "@/components/exp/utils";

interface AccountSummaryProps {
  account: Account | undefined;
  transactions: Transaction[];
}

const AccountSummary: React.FC<AccountSummaryProps> = ({
  account,
  transactions,
}) => {
  const currentBalance = transactions.reduce((sum, row) => sum + row.amount, 0);
  const totalCredits = transactions.reduce(
    (sum, row) => sum + (row.amount > 0 ? row.amount : 0),
    0
  );
  const totalDebits = transactions.reduce(
    (sum, row) => sum + (row.amount < 0 ? Math.abs(row.amount) : 0),
    0
  );

  return (
    <div>
      <Title order={4} c="white" mb="xs">
        {account?.name} - Summary
      </Title>
      <Group>
        <div>
          <Text size="sm" c="dimmed">
            Current Balance
          </Text>
          <Text size="xl" fw={700} c={currentBalance >= 0 ? "green" : "red"}>
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
            {transactions.length}
          </Text>
        </div>
      </Group>
    </div>
  );
};

export default AccountSummary;
