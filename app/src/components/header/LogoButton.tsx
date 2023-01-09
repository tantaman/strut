"use strict";

import * as React from "react";
import Button from "../../widgets/Button";
import DropdownButton from "../../widgets/DropdownButton";
const Options = DropdownButton.Options;

import "styles/components/Header.css";
import Css from "../../html/Css";
import { Deck } from "../../domain/schema";
import { Ctx, useQuery } from "../../hooks";
import queries from "../../domain/queries";
import mutations from "../../domain/mutations";
import { ID_of } from "../../id";

function LogoButton({ ctx, deckId }: { ctx: Ctx; deckId: ID_of<Deck> }) {
  const canUndo = useQuery(queries.canUndo(ctx, deckId)).data;
  const canRedo = useQuery(queries.canRedo(ctx, deckId)).data;

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
            })}
            href="#!"
            onClick={() => {}}
          >
            Connect to Server
          </a>
        </li>
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
      </Options>
    </DropdownButton>
  );
}

export default LogoButton;
