import Link from "next/link";
import Slideshow from "@/components/Slideshow";
import RegistryButton from "@/components/RegistryButton";
import { db } from "@/lib/db";
import { PublicationModel } from "@/lib/models";
import type { Publication } from "@/lib/validation";
export const dynamic = "force-dynamic";
async function publications() {
  try {
    await db();
    const rows = await PublicationModel.find({ published: true })
      .select("kind title body eventDate location createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return {
      items: JSON.parse(JSON.stringify(rows)) as Publication[],
      unavailable: false,
    };
  } catch {
    return { items: [] as Publication[], unavailable: true };
  }
}
export default async function Home() {
  const { items, unavailable } = await publications();
  return (
    <>
      <div className="topline">CHURCH OF NIGERIA · ANGLICAN COMMUNION</div>
      <header className="nav">
        <Link className="brand" href="/">
          <span className="brand-cross" aria-hidden="true">
            ✝
          </span>
          <span>
            SJACM<small>St John’s Anglican Church, Makurdi</small>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#church-life">Church life</a>
          <RegistryButton nav />
          <Link href="/login">Admin login</Link>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              FAITH. FELLOWSHIP. A LASTING RECORD.
            </span>
            <h1>
              Our church family.
              <br />
              <em>Our shared story.</em>
            </h1>
            <p>
              Welcome to St John’s Anglican Church, Makurdi. Our digital church
              registry preserves the important milestones of our members’ lives
              and helps you check the records entrusted to the church.
            </p>
            <RegistryButton />
            <span className="hero-note">
              Your registered name. Your church code. Your record.
            </span>
          </div>
          <Slideshow />
        </section>
        <section className="intro" id="registry-about">
          <div>
            <span className="eyebrow">THE CHURCH REGISTRY</span>
            <h2>
              Remembering life’s
              <br />
              milestones with care.
            </h2>
          </div>
          <div>
            <p>
              Find recorded details of baptism, confirmation, marriage,
              churching, and membership of Mothers’ Union, Fathers’ Fellowship
              and other church organizations.
            </p>
            <p>
              Use your candidate name and the unique church code supplied by the
              church office to view a matching record and download a registry
              extract. No account is required.
            </p>
          </div>
        </section>
        <section className="milestones">
          <article>
            <span>01</span>
            <h3>Faith & sacraments</h3>
            <p>
              Baptism and confirmation details, kept together in one member
              profile.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Family & fellowship</h3>
            <p>
              Marriage, churching and the organizations that connect our church
              family.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>A record you can check</h3>
            <p>
              A private church code helps you find and download your registered
              details.
            </p>
          </article>
        </section>
        <section id="church-life" className="church-life">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FROM OUR CHURCH OFFICE</span>
              <h2>Church life & announcements</h2>
            </div>
            <span className="section-note">
              Stay connected with our community.
            </span>
          </div>
          {unavailable ? (
            <p className="notice">
              Announcements are temporarily unavailable. Please check again
              later.
            </p>
          ) : (
            <>
              {items.length === 0 && (
                <p className="notice">
                  Church activities and announcements will appear here when
                  published by the church office.
                </p>
              )}
              <div className="publication-grid">
                {items.map((item) => (
                  <article className="publication" key={item._id}>
                    <span className="tag">{item.kind}</span>
                    <h3>{item.title}</h3>
                    {item.eventDate && (
                      <p className="event-meta">
                        {new Date(
                          item.eventDate + "T00:00:00",
                        ).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {item.location && ` · ${item.location}`}
                      </p>
                    )}
                    {!item.eventDate && item.location && (
                      <p className="event-meta">{item.location}</p>
                    )}
                    <p className="publication-body">{item.body}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <footer>
        <div className="footer-grid">
          <div>
            <strong>SJACM</strong>
            <p>
              St John’s Anglican Church, Makurdi
              <br />
              Church of Nigeria (Anglican Communion)
            </p>
          </div>
          <div>
            <h3>Explore</h3>
            <a href="#registry-about">About the registry</a>
            <a href="#church-life">Activities & announcements</a>
            <Link href="/login">Admin login</Link>
          </div>
          <div>
            <h3>Registry support</h3>
            <p>
              For corrections or a church code, contact the church office
              directly. Keep your code private.
            </p>
            <Link href="/privacy">Registry privacy</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} St John’s Anglican Church, Makurdi
          </span>
          <span>Faith · Community · Service</span>
        </div>
      </footer>
    </>
  );
}
