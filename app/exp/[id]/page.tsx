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

export default async function AccountPage({
	params,
}: {
	params: { id: string };
}) {
	const { id } = await params;
	const data = await getMonth(id);

	if (!data) {
		notFound();
	}

	const fullData = JSON.parse(data);
	const contentData: AppData = JSON.parse(fullData.content || "{}");

	const initialData = {
		accounts: contentData.accounts || {},
		transactions: contentData.transactions || {},
		monthName: fullData.month || "Untitled Month",
		id,
	};

	return <Client initialData={initialData} />;
}
