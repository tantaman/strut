import React, { useCallback, useState } from "react";
import { IPresenter, Transition } from "../../bundles/PluginInterfaces";
import useOnDocClick from "../../interactions/useOnDocClick";
import useSyncify from "../../interactions/useSyncify";
import { commit } from "@strut/model/Changeset";
import { useQuery } from "@strut/model/Hooks";
import { persistLog, undoLog } from "../app_state/AppLogs";
import Deck from "../deck/Deck";
import * as styles from "./HeaderButton.module.css";

const pos = { left: -100 };
export default function PresentButton({
  genPresenter,
  deck,
}: {
  genPresenter: Promise<IPresenter>;
  deck: Deck;
}) {
  const presenterResolution = useSyncify(genPresenter);

  // then the promise
  // cache result
  // return fallbak till have cached result
  if (presenterResolution == null) {
    return <div>Loading Presenter</div>;
  } else if (presenterResolution?.type === "EXCEPTION") {
    console.error(presenterResolution.resolution);
    return <div>Fatal</div>;
  }

  return (
    <PresentButtonImpl presenter={presenterResolution.resolution} deck={deck} />
  );
}

function PresentButtonImpl({
  presenter,
  deck,
}: {
  presenter: IPresenter;
  deck: Deck;
}) {
  const [show, setShow] = useState(false);
  useOnDocClick(() => {
    if (show) {
      setShow(false);
    }
  }, [show]);
  useQuery(["transitionType"], presenter);
  const transitions = presenter.cannedTransitions();
  const launchPresentation = useCallback(
    // If other plugins augment the deck, we'll need to gather their state
    // from the plugins themselves to pass along for rendering?
    () => presenter.launchPresentation(deck),
    [deck]
  );

  const onTransitionTypeChange = useCallback(
    (transitionType: string) => {
      commit(presenter.setTransitionType(transitionType), [persistLog]);
    },
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
            selected={presenter.transitionType === t.name}
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
                (presenter.transitionType === "Custom"
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
  onClick: (name) => void;
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
