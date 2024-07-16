import React from 'react';
import PropTypes from 'prop-types';
import './Button.css';

function Button({ type, text, onClick, img, alt, disabled }) {
    const buttonClass = `button ${type}`;
    
    return (
        <button className={buttonClass} onClick={onClick} disabled={disabled}>
            {text}
            {img && <img src={img} alt={alt} />}
        </button>
    );
}

Button.propTypes = {
    type: PropTypes.string.isRequired,
    text: PropTypes.string,
    img: PropTypes.string,
    alt: PropTypes.string
};

export default Button;
