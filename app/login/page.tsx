import Link from "next/link";
import Login from "@/components/Login";
import { currentAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
export const metadata = {
  title: "Admin login | SJACM",
  robots: { index: false, follow: false },
};
export default async function Page() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <main className="login">
      <Link className="brand" href="/">
        SJACM
      </Link>
      <section className="panel">
        <span className="eyebrow">AUTHORIZED ACCESS</span>
        <h1>Admin login</h1>
        <p>Sign in to manage certificate records.</p>
        <Login />
      </section>
      <Link href="/">← Back to verification</Link>
    </main>
  );
}
