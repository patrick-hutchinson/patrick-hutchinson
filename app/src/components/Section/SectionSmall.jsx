const Section = ({ children, className, typo }) => {
  return (
    <section className={className} style={{ marginBottom: "var(--section-small-spacing)" }} typo={typo}>
      {children}
    </section>
  );
};

export default Section;
