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
import { Alert, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { AlertCircleIcon } from "@/components/exp/utils";

interface DeleteAccountModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  accountName: string;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  opened,
  onClose,
  onConfirm,
  accountName,
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

export default DeleteAccountModal;
