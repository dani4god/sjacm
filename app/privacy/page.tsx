import Link from "next/link";
export default function Privacy() {
  return (
    <main className="legal">
      <Link href="/" className="brand">
        SJACM
      </Link>
      <h1>Registry privacy</h1>
      <p>
        The registry stores details entered by the church administrator,
        including baptism, confirmation, marriage, churching, organizational
        membership and a priest’s comment.
      </p>
      <p>
        Anyone with your registered full name and church code can view and
        download your profile. Treat the code as private and share it only with
        people you authorize to check your record.
      </p>
      <p>
        Contact the church office directly if your details are incorrect, if you
        need access assistance, or if you believe your code has been shared
        without your permission.
      </p>
      <p>
        This service does not replace signed certificates issued by the church.
        A matching record confirms that the supplied details match an entry in
        this registry; accuracy depends on the church’s source records.
      </p>
      <Link className="secondary" href="/">
        Return home
      </Link>
    </main>
  );
}
