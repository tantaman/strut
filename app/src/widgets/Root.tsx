'use strict';

import React, { ReactNode } from 'react';
import 'styles/widgets/main.css';

function Root(props: {children: ReactNode}) {
	return (
		<div className="wdgt-root">
			{props.children}
		</div>
	);
}

export default Root;
