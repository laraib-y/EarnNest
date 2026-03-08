import Link from "next/link";
import ParentAuth from "@/components/ParentAuth";
import styles from "./page.module.css";
import Image from "next/image";

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.phoneShell}>
        <h1 className={styles.title}>
          <span style={{ color: "#423B49" }}>Earn</span>
          <span style={{ color: "#E26F17" }}>Nest</span>
        </h1>

        <div className={styles.heroSection}>
          <div className={styles.mascot}>
            <Image
              src="/assets/MascotLogo.svg"
              alt="EarnNest Mascot"
              fill
              priority
            />
          </div>

          <div className={styles.contentContainer}>
            <h2 className={styles.roleLabel}>I&apos;M A ...</h2>

            <div className={styles.actions}>
              <ParentAuth className={styles.roleCardPurple}>
                <span className={styles.roleCardText}>PARENT</span>
                <div className={styles.roleCardImage}>
                  <Image
                    src="/assets/Parent.svg"
                    alt="Parent"
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </div>
              </ParentAuth>

              <Link href="/kid" className={styles.childLink}>
                <div className={styles.roleCardImage}>
                  <Image
                    src="/assets/Child.svg"
                    alt="Child"
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <span className={styles.roleCardText}>CHILD</span>
              </Link>
            </div>

            <p className={styles.footerText}>
              Financial literacy for kids, connected to real family habits.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}