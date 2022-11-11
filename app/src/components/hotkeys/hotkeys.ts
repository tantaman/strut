import hotkeysjs from 'hotkeys-js';
import AppState from '../app_state/AppState';

export const bridge: {[key: string]: [string, string, (appState: AppState) => void]} = {
  toggleOpenType: [
    'ctrl+p, command+p',
    'Mod-p',
    (appState: AppState) => appState.toggleOpenType(),
  ],
}

export default {
  install(appState: AppState) {
    Object.values(bridge).forEach(
      (v) =>
        hotkeysjs(v[0], () => { v[2](appState); return false; }),
    );
  }
}
