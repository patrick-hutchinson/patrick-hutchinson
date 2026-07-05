const Copyright = ({ className }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className={className} style={{ fontSize: "12px" }}>
      © Patrick Hutchinson {currentYear}
    </div>
  );
};

export default Copyright;
