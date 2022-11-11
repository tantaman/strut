import React from "react";
import { IPresenter } from "~src/scripts/bundles/PluginInterfaces";
import useSyncify from "~src/scripts/interactions/useSyncify";
import { commit } from "@strut/model/Changeset";
import { useQuery } from "@strut/model/Hooks";
import AppState from "../app_state/AppState";
import * as headerStyles from "./HeaderButton.module.css";
import * as styles from "./LayoutButton.module.css";

type Props = {
  genPresenter: Promise<IPresenter>;
  appState: AppState;
};

export default function LayoutButton({ genPresenter, appState }: Props) {
  // TODO: can we useSuspense instead?
  const presenterResolution = useSyncify(genPresenter);

  if (presenterResolution == null) {
    return <div>Loading Presenter</div>;
  } else if (presenterResolution?.type === "EXCEPTION") {
    console.error(presenterResolution.resolution);
    return <div>Fatal</div>;
  }

  return (
    <LayoutButtonImpl
      presenter={presenterResolution.resolution}
      appState={appState}
    />
  );
}

function LayoutButtonImpl({
  presenter,
  appState,
}: {
  presenter: IPresenter;
  appState: AppState;
}) {
  useQuery(["transitionType"], presenter);
  const switchToLayoutEditor = () => {
    commit(appState.setEditorMode("layout"), []);
  };
  return (
    <div
      className={
        styles.root +
        " " +
        headerStyles.root +
        " right-pad" +
        (presenter.transitionType !== "Custom" ? " disp-none" : " inline-block")
      }
    >
      <button
        className={"btn btn-outline-warning"}
        type="button"
        aria-expanded="false"
        title="Only enabled when using a custom layout (see dropdown to the right)"
        onClick={switchToLayoutEditor}
      >
        <i className={"bi bi-layout-wtf " + headerStyles.icon}></i>
        Layout
      </button>
    </div>
  );
}
