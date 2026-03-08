import Link from "next/link";
import ParentAuth from "@/components/ParentAuth";
import styles from "./page.module.css";
import Image from "next/image";

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.phoneShell}>
        <h1 className={styles.title}>EarnNest</h1>

        <div className={styles.mascot}>
          <Image
            src="/assets/MascotLogo.svg"
            alt="EarnNest Mascot"
            fill
            priority
          />
        </div>

        <h2 className={styles.roleLabel}>I’M A ...</h2>

        <div className={styles.actions}>
          <ParentAuth className={styles.roleCardPurple} />

          <Link href="/kid" className={`${styles.childLink} ${styles.roleCardOrange}`}>
            CHILD
          </Link>
        </div>

        <p className={styles.footerText}>
          Financial literacy for kids, connected to real family habits.
        </p>
      </section>
    </main>
  );
}