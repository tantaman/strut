'use strict';

import React, { ReactNode } from 'react';

function Header(props) {
	return (
		<nav
			className="navbar navbar-default navbar-static-top"
			role="navigation">
			<div className="container-fluid">
				{props.children}
			</div>
		</nav>
	);
}

Header.Brand = function(props: {href: string, children: ReactNode}) {
	return (
		<div className="navbar-header">
			<a
				href={props.href}
				className="navbar-brand">
				{props.children}
			</a>
		</div>
	);
};

export default Header;
