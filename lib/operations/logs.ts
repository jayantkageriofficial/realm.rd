import Config from "@/lib/constant";
import { getDate } from "@/lib/operations/auth";

export async function log(
  category: "login" | "lock" | "password" | "build",
  message: string,
  ip: string,
  date: Date
): Promise<boolean> {
  const msg = `
$${category.toUpperCase()}

${message}

Host: ${Config.DOMAIN}
IP Address: \`${ip}\` (ipinfo.io/${ip})
Timestamp: ${getDate(date)}
    `;
  const req = await fetch(
    `https://api.telegram.org/bot${Config.TG_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Access-Control-Allow-Origin": "https://api.telegram.org",
        "Content-Type": "application/json",
      },
      redirect: "follow",
      body: JSON.stringify({
        chat_id: Config.TG_CHAT_ID,
        text: msg,
        disable_web_page_preview: true,
        parse_mode: "markdown",
      }),
    }
  );
  const res = await req.json();
  return res.ok;
}
