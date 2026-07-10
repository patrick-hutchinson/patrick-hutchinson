import styles from "./Credits.module.css";

const Credits = ({ credits }) => {
  return (
    <div className={styles.credits}>
      {credits.map((credit) => (
        <div key={credit._id} className={styles.credit}>
          <div className={styles.creditTitle}>{credit.role}</div>
          <div className={styles.entries}>
            {credit.entries?.map((entry, index) => (
              <div className={styles.entry} key={index} typo="h2">
                {entry}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Credits;
