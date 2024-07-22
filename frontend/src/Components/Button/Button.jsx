import React from 'react';
import './Button.css';

function Button({ children, disabled, ...props }) {
    return (
        <button disabled={disabled} {...props}>
            {children}
        </button>
    );
}

export default Button;
