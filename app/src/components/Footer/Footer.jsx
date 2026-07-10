import styles from "./Footer.module.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.copyright}>
        <div typo="h2">PH</div>
        <div typo="fineprint" className={styles.copyrightNotice}>
          © {currentYear}, Patrick Hutchinson. All rights reserved.
        </div>
        <div typo="h5" className={styles.legalNotice}>
          Patrick Hutchinson. This website and all of its content, including all text, graphics, video, and photos, are the
          copyrighted works of PH.
        </div>
      </div>

      <div className={styles.lastUpdated} typo="fineprint">
        Site was last updated.
      </div>
    </footer>
  );
};

export default Footer;
