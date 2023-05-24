import SlideComponentsButtons from "../../header/SlideComponentsButtons";
import styles from "./SlideEditorNav.module.css";
import StructureStyleButtons from "../../header/StructureStyleButtons";
import LayoutButton from "../../header/LayoutButton";
import PresentButton from "../../header/PresentButton";
import Header from "../../../widgets/Header";
import LogoButton from "../../header/LogoButton";
import AppState from "../../../domain/ephemeral/AppState";
import { UserButton } from "@clerk/clerk-react";

export default function SlideEditorNav({ appState }: { appState: AppState }) {
  // TODO listen for media state
  // collapse or not the slide editor menu
  // or should we just put everything back into the floating menu?

  // const orientHorizontally = useMatchMedia(
  //   "(max-width: " + mediaCuts.horizontal + "px)"
  // );

  return (
    <Header>
      <div>
        <LogoButton ctx={appState.ctx} deckId={appState.current_deck_id} />
        <StructureStyleButtons
          appState={appState}
          className="inline-block left-pad"
        />
      </div>
      <div className={styles.middle_buttons}>
        <>
          <SlideComponentsButtons appState={appState} />
        </>
      </div>
      <div>
        <LayoutButton appState={appState} />
        <PresentButton ctx={appState.ctx} deckId={appState.current_deck_id} />
        <div style={{ display: "inline-block", marginTop: 10 }}>
          <UserButton />
        </div>
      </div>
    </Header>
  );
}

/*
<StylingMenu appState={appState} />
            <div className={styles.header_spacer + " strt-header-spacer"} />
*/
