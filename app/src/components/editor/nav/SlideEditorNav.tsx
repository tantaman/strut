import * as React from "react";
import SlideComponentsButtons from "../../header/SlideComponentsButtons";
import * as styles from "./SlideEditorNav.module.css";
import DrawingTools from "../../header/DrawingTools";
import * as headerBtn from "../../header/HeaderButton.module.css";
import StylingMenu from "../markdown/styling_menu/StylingMenu";
import StructureStyleButtons from "../../header/StructureStyleButtons";
import LayoutButton from "../../header/LayoutButton";
import PresentButton from "../../header/PresentButton";
import Header from "../../../widgets/Header";
import LogoButton from "../../header/LogoButton";
import useMatchMedia from "../../../interactions/useMatchMedia";
import mediaCuts from "../../mobile/mediaCuts";
import { Deck, AppState } from "../../../domain/schema";
import mutations from "../../../domain/mutations";

export default function SlideEditorNav({
  deck,
  appState,
}: {
  deck: Deck;
  appState: AppState;
}) {
  // listen for media state
  // collapse or not the slide editor menu
  // or should we just put everything back into the floating menu?
  // const genPresenter = useMemo(
  //   () => Presenter.queryFrom(appState.deck)?.gen(),
  //   [appState.deck.id]
  // );
  const genPresenter = null;

  const orientHorizontally = useMatchMedia(
    "(max-width: " + mediaCuts.horizontal + "px)"
  );

  return (
    <Header>
      <div>
        <LogoButton ctx={appState.ctx} deckId={appState.current_deck_id} />
        <div
          className={
            "btn-group strt-search-btn " +
            headerBtn.root +
            " " +
            styles.searchBtn
          }
          onClick={() => mutations.toggleOpenType()}
        >
          <button type="button" className="btn btn-outline-warning">
            <i className={"bi bi-search " + headerBtn.icon}></i>
            <span>Search</span>
          </button>
        </div>
        <StructureStyleButtons
          appState={appState}
          className="inline-block left-pad"
        />
      </div>
      <div className={styles.middle_buttons}>
        {orientHorizontally ? (
          <div />
        ) : appState.drawing ? (
          <>
            <DrawingTools appState={appState} />
          </>
        ) : (
          <>
            <StylingMenu
              state={appState.authoringState}
              theme={deck.theme_id}
            />
            <div className={styles.header_spacer + " strt-header-spacer"} />
            <SlideComponentsButtons appState={appState} />
          </>
        )}
      </div>
      <div>
        {genPresenter && (
          <LayoutButton genPresenter={genPresenter} appState={appState} />
        )}
        {genPresenter && (
          <PresentButton genPresenter={genPresenter} deck={deck} />
        )}
      </div>
    </Header>
  );
}
