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

"use server";

import { notFound } from "next/navigation";
import Client, {
  type Accounts,
  type Transactions,
} from "@/components/exp/client";
import { getMonth } from "@/lib/actions/exp";

interface AppData {
  accounts: Accounts;
  transactions: Transactions;
}

export default async function AccountPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const data = await getMonth(params.id);

  if (!data) {
    notFound();
  }

  const fullData = JSON.parse(data);
  const contentData: AppData = JSON.parse(fullData.content || "{}");

  const initialData = {
    accounts: contentData.accounts || {},
    transactions: contentData.transactions || {},
    monthName: fullData.month || "Untitled Month",
    id: params.id,
  };

  return <Client initialData={initialData} />;
}
