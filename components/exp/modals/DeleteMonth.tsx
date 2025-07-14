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

import React, { useState, useEffect } from "react";
import {
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { AlertCircleIcon } from "@/components/exp/utils";

interface DeleteMonthModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  monthName: string;
}

const DeleteMonthModal: React.FC<DeleteMonthModalProps> = ({
  opened,
  onClose,
  onConfirm,
  monthName,
}) => {
  const [confirmationText, setConfirmationText] = useState<string>("");
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

export default DeleteMonthModal;
