import styles from "./Credits.module.css";

const Credits = ({ credits }) => {
  return (
    <div className={styles.credits}>
      {credits.map((credit) => (
        <div key={credit._id} className={styles.credit}>
          <div className={styles.creditTitle} typo="h5">
            {credit.role}
          </div>
          <div className={styles.entries}>
            {credit.entries?.map((entry, index) => (
              <div className={styles.entry} key={index} typo="longcopy">
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
