import React, { useCallback, useState } from "react";
import useOnDocClick from "../../interactions/useOnDocClick";
import { Deck, Presenter, Transition } from "../../domain/schema";
import * as styles from "./HeaderButton.module.css";
import { ID_of } from "../../id";
import fns from "../../domain/fns";
import { Ctx, first, useQuery } from "../../hooks";
import queries from "../../domain/queries";
import actions from "../../domain/actions";
import mutations from "../../domain/mutations";

const pos = { left: -100 };
export default function PresentButton({
  ctx,
  deckId,
}: {
  ctx: Ctx;
  deckId: ID_of<Deck>;
}) {
  const presenter = useQuery(queries.chosenPresenter(ctx, deckId)).data;
  console.log(queries.chosenPresenter(ctx, deckId));

  if (!presenter) {
    return <div>No presenter chosen?</div>;
  }

  return <PresentButtonImpl ctx={ctx} presenter={presenter} deckId={deckId} />;
}

function PresentButtonImpl({
  ctx,
  presenter,
  deckId,
}: {
  ctx: Ctx;
  presenter: Presenter;
  deckId: ID_of<Deck>;
}) {
  const [show, setShow] = useState(false);
  useOnDocClick(() => {
    if (show) {
      setShow(false);
    }
  }, [show]);
  const transitions = fns.decodeTransitions(presenter.available_transitions);
  const launchPresentation = useCallback(
    () => actions.launchPresentation(deckId),
    [deckId]
  );

  const onTransitionTypeChange = useCallback(
    (transitionType: string) =>
      mutations.setTransitionType(ctx, presenter.name, transitionType),
    [presenter]
  );

  return (
    <div className={"btn-group " + styles.root}>
      <button
        type="button"
        className="btn btn-outline-warning"
        onClick={launchPresentation}
      >
        <i className={"bi bi-play-fill " + styles.icon}></i>
        <span>Present</span>
      </button>
      <button
        onClick={() => setShow(!show)}
        type="button"
        className={
          "btn btn-outline-warning dropdown-toggle dropdown-toggle-split" +
          (show ? " show" : "")
        }
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <span className="visually-hidden">Toggle Dropdown</span>
      </button>
      <ul className={"dropdown-menu" + (show ? " show" : "")} style={pos}>
        {transitions.map((t) => (
          <TransitionItem
            transition={t}
            key={t.name}
            selected={presenter.picked_transition === t.name}
            onClick={onTransitionTypeChange}
          />
        ))}
        <li>
          <hr className="dropdown-divider" />
        </li>
        <li>
          <a
            className="dropdown-item"
            href="#"
            onClick={() => onTransitionTypeChange("Custom")}
          >
            Custom Layout
            <i
              className={
                "bi abs-pull-right" +
                (presenter.picked_transition === "Custom"
                  ? " bi-check-circle-fill"
                  : "")
              }
            ></i>
          </a>
        </li>
      </ul>
    </div>
  );
}

function TransitionItem({
  transition,
  selected,
  onClick,
}: {
  transition: Transition;
  selected: boolean;
  onClick: (name: string) => void;
}) {
  return (
    <li onClick={() => onClick(transition.name)}>
      <a className="dropdown-item" href="#">
        {transition.name}
        <i
          className={
            "bi abs-pull-right" + (selected ? " bi-check-circle-fill" : "")
          }
        ></i>
      </a>
    </li>
  );
}
