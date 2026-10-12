import { randomInt } from "node:crypto";
import { profileInput, type PublicProfile } from "./validation";
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateCode() {
  let code: string;
  do {
    code = Array.from(
      { length: 12 },
      () => alphabet[randomInt(alphabet.length)],
    ).join("");
  } while (!/[A-Z]/.test(code) || !/[0-9]/.test(code));
  return code;
}
export function publicRecord(row: Record<string, unknown>): PublicProfile {
  const fields = [
    "surname",
    "firstName",
    "baptized",
    "baptism",
    "confirmed",
    "confirmation",
    "hasOrganizations",
    "organizations",
    "married",
    "marriage",
    "churched",
    "churching",
    "priestComment",
    "commentPriest",
  ];
  const input = Object.fromEntries(
    fields.filter((k) => row[k] !== undefined).map((k) => [k, row[k]]),
  );
  return {
    ...profileInput.parse(input),
    churchCode: String(row.churchCode),
    updatedAt: new Date(String(row.updatedAt)).toISOString(),
  };
}
