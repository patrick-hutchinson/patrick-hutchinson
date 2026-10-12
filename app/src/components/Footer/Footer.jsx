import styles from "./Footer.module.css";

function formatLastUpdated(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const Footer = ({ className, lastUpdatedAt }) => {
  const currentYear = new Date().getFullYear();
  const lastUpdated = formatLastUpdated(lastUpdatedAt);

  return (
    <footer className={[className, styles.footer].filter(Boolean).join(" ")}>
      <div className={styles.copyright}>
        <div
          typo="fineprint"
          className={styles.copyrightNotice}
          style={{ fontSize: "clamp(1.25rem, calc(0.8892rem + 0.2385vw), 1.5rem)" }}
        >
          © {currentYear}, Patrick Hutchinson. All rights reserved.
        </div>
        <div typo="microtype" className={styles.legalNotice}>
          This website and all of its content, including all text, graphics, video, and photos, are the copyrighted works of
          Patrick Hutchinson.
        </div>

        <div typo="microtype" className={styles.legalNotice}>
          Font in Use: Neue Haas Grotesk, via CommercialType. <br />
          Hosted via Vercel.
        </div>
      </div>

      <div className={styles.lastUpdated} typo="microtype">
        Site was last updated{lastUpdated ? ` ${lastUpdated}.` : "."}
      </div>
    </footer>
  );
};

export default Footer;
