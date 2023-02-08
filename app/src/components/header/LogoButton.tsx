"use strict";

import * as React from "react";
import Button from "../../widgets/Button";
import DropdownButton from "../../widgets/DropdownButton";
const Options = DropdownButton.Options;

import "styles/components/Header.css";
import Css from "../../html/Css";
import { Deck } from "../../domain/schema";
import { CtxAsync as Ctx } from "@vlcn.io/react";
import queries from "../../domain/queries";
import mutations from "../../domain/mutations";
import { IID_of } from "../../id";
import { useAuth0 } from "@auth0/auth0-react";

function LogoButton({ ctx, deckId }: { ctx: Ctx; deckId: IID_of<Deck> }) {
  const canUndo = queries.canUndo(ctx, deckId).data;
  const canRedo = queries.canRedo(ctx, deckId).data;
  const { loginWithRedirect, logout, isAuthenticated } = useAuth0();

  return (
    <DropdownButton className="strt-logo-button">
      <Button className="btn-outline-warning dropdown-toggle">
        <span className="bg"></span>
      </Button>
      <Options>
        <li>
          <a
            className={Css.toClassString({
              "dropdown-item": true,
              disabled: !canUndo,
            })}
            href="#!"
            onClick={() => mutations.undo(ctx, deckId)}
          >
            Undo
          </a>
        </li>
        <li>
          <a
            className={Css.toClassString({
              "dropdown-item": true,
              disabled: !canRedo,
            })}
            href="#!"
            onClick={() => mutations.redo(ctx, deckId)}
          >
            Redo
          </a>
        </li>
        <li>
          {isAuthenticated ? (
            <a
              href="#!"
              className="dropdown-item"
              onClick={() => logout({ returnTo: window.location.origin })}
            >
              Log Out
            </a>
          ) : (
            <a
              href="#!"
              className="dropdown-item"
              onClick={() => loginWithRedirect()}
            >
              Log In
            </a>
          )}
        </li>
      </Options>
    </DropdownButton>
  );
}

export default LogoButton;
