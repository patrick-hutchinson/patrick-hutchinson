const Section = ({ children, className, typo }) => {
  return (
    <section className={className} style={{ marginBottom: "var(--margin-1)" }} typo={typo}>
      {children}
    </section>
  );
};

export default Section;
