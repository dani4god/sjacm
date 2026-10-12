import { currentAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard";
export const metadata = {
  title: "Admin dashboard | SJACM",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const admin = await currentAdmin();
  if (!admin) redirect("/login");
  return <Dashboard name={admin.name} />;
}
