import { PortableText } from "@portabletext/react";
import styles from "./Interview.module.css";

const Interview = ({ text, className }) => {
  if (!text || text.length === 0) return;
  return (
    <div className={`interview ${styles.interview} ${className}`} typo="fineprint">
      {text.map((block) => {
        if (block._type === "block") {
          return (
            <p className={styles.runningText} key={block._key}>
              {block.children.map((c) => c.text).join("")}
            </p>
          );
        }

        if (block._type === "speech") {
          return (
            <div key={block._key} className={styles.row}>
              {block.initials && (
                <span
                  className={`${block.speaker === "interviewer" ? styles.interviewerInitials : styles.intervieweeInitials} ${styles.initials}`}
                  typo="fineprint"
                >
                  ({block.initials})
                </span>
              )}

              <div
                className={`${styles.speech} ${block.speaker === "interviewer" ? styles.interviewer : styles.interviewee}`}
              >
                <PortableText value={block.text} />
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default Interview;
