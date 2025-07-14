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
import { ActionIcon, Card, Group, Menu, Stack, Text } from "@mantine/core";
import {
  BankIcon,
  CashIcon,
  DotsVerticalIcon,
  EditIcon,
  TrashIcon,
  Account,
  Transactions,
} from "@/components/exp/utils";

interface AccountCardProps {
  accountId: string;
  account: Account;
  transactions: Transactions;
  isActive: boolean;
  onSelect: () => void;
  onEdit: (accountId: string) => void;
  onDelete: (accountId: string) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({
  accountId,
  account,
  transactions,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const accountTransactions = transactions[accountId] || [];
  const accountBalance = accountTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  return (
    <Card
      p="md"
      bg={isActive ? "dark.6" : "dark.7"}
      style={{
        cursor: "pointer",
        border: isActive ? "2px solid #339af0" : "2px solid transparent",
      }}
      onClick={onSelect}
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
          <Text size="xl" fw={700} c={accountBalance >= 0 ? "green" : "red"}>
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
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <DotsVerticalIcon size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              icon={<EditIcon size={14} />}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onEdit(accountId);
              }}
            >
              Edit Account
            </Menu.Item>
            <Menu.Item
              color="red"
              icon={<TrashIcon size={14} />}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onDelete(accountId);
              }}
            >
              Delete Account
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Card>
  );
};

export default AccountCard;
