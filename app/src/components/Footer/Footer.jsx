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
        <div typo="fineprint" className={styles.copyrightNotice}>
          © {currentYear}, Patrick Hutchinson. All rights reserved.
        </div>
        <div typo="h5" className={styles.legalNotice}>
          Patrick Hutchinson. This website and all of its content, including all text, graphics, video, and photos, are the
          copyrighted works of PH.
        </div>

        <div typo="h5" className={styles.legalNotice}>
          Font in Use: Neue Haas Grotesk, via CommercialType. <br />
          Hosten via Vercel.
        </div>
      </div>

      <div className={styles.lastUpdated} typo="fineprint">
        Site was last updated{lastUpdated ? ` ${lastUpdated}.` : "."}
      </div>
    </footer>
  );
};

export default Footer;
