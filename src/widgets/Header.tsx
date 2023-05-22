"use strict";

import { ReactNode } from "react";

function Header(props: { children: ReactNode }) {
  return (
    <nav className="navbar navbar-default navbar-static-top" role="navigation">
      <div className="container-fluid">{props.children}</div>
    </nav>
  );
}

Header.Brand = function (props: { href: string; children: ReactNode }) {
  return (
    <div className="navbar-header">
      <a href={props.href} className="navbar-brand">
        {props.children}
      </a>
    </div>
  );
};

export default Header;
