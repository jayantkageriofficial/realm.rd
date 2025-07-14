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

import React, { useState } from "react";
import {
  Button,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Stack,
  TextInput,
} from "@mantine/core";

interface AddAccountModalProps {
  opened: boolean;
  onClose: () => void;
  onCreate: (name: string, balance: number, icon: "cash" | "bank") => void;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({
  opened,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState<string>("");
  const [balance, setBalance] = useState<number>(0);
  const [icon, setIcon] = useState<"cash" | "bank">("bank");

  const handleCreate = () => {
    onCreate(name, balance, icon);
    setName("");
    setBalance(0);
    setIcon("bank");
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Add New Account" centered>
      <Stack spacing="md">
        <TextInput
          label="Account Name"
          placeholder="e.g., Main Bank Account"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          required
        />
        <NumberInput
          label="Opening Balance"
          value={balance}
          onChange={(value) => setBalance(value || 0)}
          required
        />
        <SegmentedControl
          value={icon}
          onChange={(value: "cash" | "bank") => setIcon(value)}
          data={[
            { label: "Bank", value: "bank" },
            { label: "Cash", value: "cash" },
          ]}
        />
        <Group position="right" mt="md">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Account</Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default AddAccountModal;
