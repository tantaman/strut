'use strict';

import React from 'react';
import Css from '../html/Css';

function Button(props) {
	return (
		<button
			type="button"
			className={Css.joinClasses("btn", props.className)}>
			{props.children}
		</button>
	);
}

export default Button;
