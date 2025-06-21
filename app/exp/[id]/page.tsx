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

export default async function AccountPage(props: { params: Promise<{ id: string }> }) {
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
		id: params.id
	};

	return <Client initialData={initialData} />;
}
