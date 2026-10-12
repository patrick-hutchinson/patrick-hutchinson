const Copyright = ({ className }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className={className} typo="caption">
      © Patrick Hutchinson {currentYear}
    </div>
  );
};

export default Copyright;
