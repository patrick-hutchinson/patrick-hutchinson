import styles from "./FilterMenu.module.css";

import { useState } from "react";

const FilterMenu = ({ array, className }) => {
  const [activeFilters, setActiveFilters] = useState([]);

  const handleClick = (entry) => {
    setActiveFilters(
      (prev) =>
        prev.includes(entry)
          ? prev.filter((item) => item !== entry) // remove if already selected
          : [...prev, entry], // otherwise add it
    );
  };

  return (
    <div className={`${className} ${styles.filterMenu}`}>
      {array.map((entry) => (
        <div onClick={() => handleClick()}>{entry}</div>
      ))}
    </div>
  );
};

export default FilterMenu;
