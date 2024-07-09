import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";

function useOutsideClicker(ref, onOutsideClick) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onOutsideClick();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, onOutsideClick]);
}

function OutsideClicker({ children, onOutsideClick }) {
  const wrapperRef = useRef(null);
  useOutsideClicker(wrapperRef, onOutsideClick);

  return <div ref={wrapperRef}>{children}</div>;
}

OutsideClicker.propTypes = {
  children: PropTypes.node.isRequired,
  onOutsideClick: PropTypes.func,
};

OutsideClicker.defaultProps = {
  onOutsideClick: () => console.log('Clicked outside!')
};

export default OutsideClicker;
