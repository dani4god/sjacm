import { z } from "zod";
export const organizations = [
  "Girls’ Guild",
  "Girls’ Brigade",
  "Boys’ Brigade",
  "Anglican Children Ministry",
  "Fathers’ Fellowship (Men’s Fellowship)",
  "Mothers’ Union",
  "Parochial Church Council",
  "Anglican Youth Fellowship",
  "Choir",
  "Evangelical Fellowship",
  "Wardens",
] as const;
const text = z.string().trim().min(1, "This field is required.").max(200);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date.")
  .refine((v) => {
    const d = new Date(v + "T00:00:00Z");
    return (
      !Number.isNaN(d.getTime()) &&
      d.toISOString().slice(0, 10) === v &&
      v <= new Date().toISOString().slice(0, 10)
    );
  }, "Enter a real date that is not in the future.");
const baptismSchema = z
  .object({
    date: date,
    dateOfBirth: date,
    registerNumber: text,
    registerPage: text,
    parentsOrFormerReligion: text,
    sponsors: z.array(text).min(1, "Enter at least one sponsor.").max(30),
    residence: text,
    priest: text,
  })
  .strict()
  .refine(
    (v) => v.dateOfBirth <= v.date,
    "Birth date cannot be after baptism date.",
  );
const confirmationSchema = z
  .object({ date: date, place: text, priest: text })
  .strict();
const marriageSchema = z
  .object({
    spouse: text,
    date: date,
    priests: z
      .array(text)
      .min(1, "Enter at least one officiating priest.")
      .max(20),
  })
  .strict();
const churchingSchema = z.object({ date: date, priest: text }).strict();
export const profileInput = z
  .object({
    surname: text.max(80),
    firstName: text.max(80),
    baptized: z.boolean(),
    baptism: baptismSchema.optional(),
    confirmed: z.boolean(),
    confirmation: confirmationSchema.optional(),
    hasOrganizations: z.boolean(),
    organizations: z.array(z.enum(organizations)).max(organizations.length),
    married: z.boolean(),
    marriage: marriageSchema.optional(),
    churched: z.boolean(),
    churching: churchingSchema.optional(),
    priestComment: z
      .string()
      .trim()
      .min(1, "Enter the priest’s comment.")
      .max(4000),
    commentPriest: text,
  })
  .strict()
  .superRefine((v, c) => {
    for (const [flag, field] of [
      ["baptized", "baptism"],
      ["confirmed", "confirmation"],
      ["married", "marriage"],
      ["churched", "churching"],
    ] as const) {
      if (v[flag] && !v[field])
        c.addIssue({
          code: "custom",
          path: [field],
          message: `Complete the ${field} details.`,
        });
    }
    if (v.hasOrganizations && v.organizations.length === 0)
      c.addIssue({
        code: "custom",
        path: ["organizations"],
        message: "Select at least one organization.",
      });
  })
  .transform((v) => ({
    ...v,
    baptism: v.baptized ? v.baptism : undefined,
    confirmation: v.confirmed ? v.confirmation : undefined,
    marriage: v.married ? v.marriage : undefined,
    churching: v.churched ? v.churching : undefined,
    organizations: v.hasOrganizations ? [...new Set(v.organizations)] : [],
  }));
export type ProfileInput = z.input<typeof profileInput>;
export type ProfileData = z.output<typeof profileInput>;
export type PublicProfile = ProfileData & {
  churchCode: string;
  updatedAt: string;
};
export type AdminProfile = PublicProfile & { _id: string };
export function normalizeName(name: string) {
  return name.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}
export function fullName(v: { surname: string; firstName: string }) {
  return `${v.surname} ${v.firstName}`;
}
export const lookupInput = z
  .object({
    name: text,
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{12}$/, "Enter your 12-character church code."),
  })
  .strict();
export const publicationInput = z
  .object({
    kind: z.enum(["Announcement", "Activity"]),
    title: z.string().trim().min(2).max(160),
    body: z.string().trim().min(2).max(5000),
    eventDate: z
      .string()
      .refine(
        (v) =>
          v === "" ||
          (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
            !Number.isNaN(new Date(v).getTime()) &&
            new Date(v).toISOString().slice(0, 10) === v),
        "Enter a valid event date.",
      )
      .default(""),
    location: z.string().trim().max(200).default(""),
    published: z.boolean(),
  })
  .strict();
export type Publication = z.infer<typeof publicationInput> & {
  _id: string;
  createdAt?: string;
};
