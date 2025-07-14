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
  Button,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  TextInput,
} from "@mantine/core";
import { Account } from "@/components/exp/utils";

interface EditAccountModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (name: string, icon: "cash" | "bank") => void;
  account: Account | null;
}

const EditAccountModal: React.FC<EditAccountModalProps> = ({
  opened,
  onClose,
  onSave,
  account,
}) => {
  const [name, setName] = useState<string>("");
  const [icon, setIcon] = useState<"cash" | "bank">("bank");

  useEffect(() => {
    if (account) {
      setName(account.name);
      setIcon(account.icon);
    }
  }, [account]);

  const handleSave = () => onSave(name, icon);

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Account" centered>
      <Stack>
        <TextInput
          label="Account Name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <SegmentedControl
          value={icon}
          onChange={(value: "cash" | "bank") => setIcon(value)}
          data={[
            { label: "Bank", value: "bank" },
            { label: "Cash", value: "cash" },
          ]}
          fullWidth
          mt="md"
        />
        <Group position="right" mt="md">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default EditAccountModal;
