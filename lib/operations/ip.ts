/*
 realm.rd, Scribble the plans, spill the thoughts.
 Copyright (C) 2025 Jayant Hegde Kageri <https://github.com/jayantkageri/>

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

import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

const regexes = {
  ipv4: /^(?:(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/,
  ipv6: /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i,
};

function checkIp(value: string | null): boolean {
  return (
    (value != null && regexes.ipv4.test(value)) ||
    regexes.ipv6.test(value || "")
  );
}

function getClientIpFromXForwardedFor(value: string): string | null {
  if (!(value != null)) return null;
  const forwardedIps = value.split(",").map((e) => {
    const ip = e.trim();
    if (ip.includes(":") && ip.split(":").length === 2) return ip.split(":")[0];
    return ip;
  });

  for (let i = 0; i < forwardedIps.length; i++) {
    if (checkIp(forwardedIps[i])) return forwardedIps[i];
  }

  return null;
}

export function getClientIp(headers: ReadonlyHeaders): string | null {
  if (checkIp(headers.get("x-client-ip"))) return headers.get("x-client-ip");
  const xForwardedFor = getClientIpFromXForwardedFor(
    headers.get("x-forwarded-for") || ""
  );
  if (checkIp(xForwardedFor)) return xForwardedFor;
  if (checkIp(headers.get("cf-connecting-ip")))
    return headers.get("cf-connecting-ip");
  if (checkIp(headers.get("do-connecting-ip")))
    return headers.get("do-connecting-ip");
  if (checkIp(headers.get("fastly-client-ip")))
    return headers.get("fastly-client-ip");
  if (checkIp(headers.get("true-client-ip")))
    return headers.get("true-client-ip");
  if (checkIp(headers.get("x-real-ip"))) return headers.get("x-real-ip");
  if (checkIp(headers.get("x-cluster-client-ip")))
    return headers.get("x-cluster-client-ip");
  if (checkIp(headers.get("x-forwarded"))) return headers.get("x-forwarded");
  if (checkIp(headers.get("forwarded-for")))
    return headers.get("forwarded-for");
  if (checkIp(headers.get("forwarded"))) return headers.get("forwarded");
  if (checkIp(headers.get("x-appengine-user-ip")))
    return headers.get("x-appengine-user-ip");
  if (checkIp(headers.get("Cf-Pseudo-IPv4")))
    return headers.get("Cf-Pseudo-IPv4");
  return null;
}
