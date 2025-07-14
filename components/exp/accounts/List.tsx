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
import { Button, Group, Paper, SimpleGrid, Title } from "@mantine/core";
import Card from "@/components/exp/accounts/Card";
import {
  FileExportIcon,
  PlusIcon,
  Accounts,
  Transactions,
} from "@/components/exp/utils";

interface AccountsListProps {
  accounts: Accounts;
  transactions: Transactions;
  activeAccount: string;
  onSelectAccount: (accountId: string) => void;
  onAddAccount: () => void;
  onEditAccount: (accountId: string) => void;
  onDeleteAccount: (accountId: string) => void;
  onExportData: () => void;
}

const AccountsList: React.FC<AccountsListProps> = ({
  accounts,
  transactions,
  activeAccount,
  onSelectAccount,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onExportData,
}) => {
  return (
    <Paper p="md" bg="dark.8" radius="md">
      <Group position="apart" mb="md">
        <Title order={3} c="white">
          Accounts Overview
        </Title>
        <Group>
          <Button onClick={onAddAccount} leftIcon={<PlusIcon />}>
            Add Account
          </Button>
          <Button
            onClick={onExportData}
            variant="outline"
            leftIcon={<FileExportIcon />}
          >
            Export All Data
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={3} breakpoints={[{ maxWidth: "sm", cols: 1 }]}>
        {Object.entries(accounts).map(([accountId, account]) => (
          <Card
            key={accountId}
            accountId={accountId}
            account={account}
            transactions={transactions}
            isActive={activeAccount === accountId}
            onSelect={() => onSelectAccount(accountId)}
            onEdit={onEditAccount}
            onDelete={onDeleteAccount}
          />
        ))}
      </SimpleGrid>
    </Paper>
  );
};

export default AccountsList;
