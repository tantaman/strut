"use strict";

import * as React from "react";
import Button from "../../widgets/Button";
import DropdownButton from "../../widgets/DropdownButton";
const Options = DropdownButton.Options;

import "styles/components/Header.css";
import Css from "../../html/Css";
import { Deck } from "../../domain/schema";
import { Ctx, firstPick, useQuery } from "../../hooks";
import queries from "../../domain/queries";
import mutations from "../../domain/mutations";

function LogoButton({ ctx, deck }: { ctx: Ctx; deck: Deck }) {
  const canUndo = firstPick(useQuery(...queries.canUndo(ctx, deck.id)).data);
  const canRedo = firstPick(useQuery(...queries.canRedo(ctx, deck.id)).data);

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
            onClick={() => mutations.undo()}
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
            onClick={() => mutations.redo()}
          >
            Redo
          </a>
        </li>
      </Options>
    </DropdownButton>
  );
}

export default LogoButton;
