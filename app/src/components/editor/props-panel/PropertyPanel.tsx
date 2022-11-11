"use strict";

import React, { memo, useState } from "react";
import {
  getFormValue,
  actionChangeFillStyle,
  actionChangeStrokeWidth,
  actionChangeSloppiness,
  actionChangeTextAlign,
  actionChangeSharpness,
  actionChangeFontSize,
  actionChangeFontFamily,
  actionChangeStrokeColor,
  actionChangeBackgroundColor,
} from "../../../../../git_modules/excalidraw/src/actions/actionProperties";
import { ColorPicker } from "../../../../../git_modules/excalidraw/src/components/ColorPicker";
import {
  AlignBottomIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  BringForwardIcon,
  BringToFrontIcon,
  CenterHorizontallyIcon,
  CenterVerticallyIcon,
  clone,
  EdgeRoundIcon,
  EdgeSharpIcon,
  FillCrossHatchIcon,
  FillHachureIcon,
  FillSolidIcon,
  FontFamilyCodeIcon,
  FontFamilyHandDrawnIcon,
  FontFamilyNormalIcon,
  FontSizeExtraLargeIcon,
  FontSizeLargeIcon,
  FontSizeMediumIcon,
  FontSizeSmallIcon,
  GroupIcon,
  SendBackwardIcon,
  SendToBackIcon,
  SloppinessArchitectIcon,
  SloppinessArtistIcon,
  SloppinessCartoonistIcon,
  StrokeWidthIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  trash,
  UngroupIcon,
} from "../../../../../git_modules/excalidraw/src/components/icons";
import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  FONT_FAMILY,
} from "../../../../../git_modules/excalidraw/src/constants";
import {
  isLinearElementType,
  isTextElement,
} from "../../../../../git_modules/excalidraw/src/element/typeChecks";
import { canChangeSharpness } from "../../../../../git_modules/excalidraw/src/scene";
import { useQuery } from "@strut/model/Hooks";
import counter from "@strut/counter";
import BadgeGroup from "../../../widgets/BadgeGroup";
import ExclusiveBadgeGroup from "../../../widgets/ExclusiveBadgeGroup";
import AppState from "../../app_state/AppState";
import DrawingInteractionState from "../../app_state/DrawingInteractionState";
import * as styles from "./PropertyPanel.module.css";

const count = counter("PropertyPanel");
function PropertyPanel({
  appState,
  state,
}: {
  appState: AppState;
  state: DrawingInteractionState;
}) {
  // To understand if our optimization below is actually working
  // and to see if it breaks in the future
  count.bump("render");
  // We only responde to selection changes so only useQuery that guy
  // We don't query the "state" variable for perf reasons
  // "state" is always different but the values inside we care about are stable
  useQuery(
    [
      "selectedElementIds",
      "currentItemFillStyle",
      "currentItemStrokeWidth",
      "currentItemRoughness",
      "currentItemLinearStrokeSharpness",
      "currentItemStrokeSharpness",
      "currentItemFontSize",
      "currentItemFontFamily",
      "currentItemTextAlign",
    ],
    state
  );
  useQuery(["slideEditMode"], appState);
  const elements = state.selectedElements;
  const excaliState = state.excaliState || ({} as any);
  const actionManager = state.actionManager;

  const [showStrokeColorPicker, setShowStrokeColorPicker] = useState(false);
  const [showBackgroundColorPicker, setShowBackgroundColorPicker] =
    useState(false);

  if (!appState.isDrawing) {
    return null;
  }

  return (
    <div className={styles.root}>
      <div>
        <strong>Stroke</strong>
        <div>
          <ColorPicker
            type="elementStroke"
            label="Stroke"
            color={getFormValue(
              elements,
              excaliState,
              (element) => element.strokeColor,
              excaliState.currentItemStrokeColor
            )}
            onChange={(color) =>
              actionManager?.executeAction(actionChangeStrokeColor, {
                currentItemStrokeColor: color,
              })
            }
            isActive={showStrokeColorPicker}
            setActive={(active) => setShowStrokeColorPicker(active)}
          />
        </div>
      </div>
      <div>
        <strong>Background</strong>
        <div>
          <ColorPicker
            type="elementBackground"
            label="Background"
            color={getFormValue(
              elements,
              excaliState,
              (element) => element.backgroundColor,
              excaliState.currentItemBackgroundColor
            )}
            onChange={(color) =>
              actionManager?.executeAction(actionChangeBackgroundColor, {
                currentItemBackgroundColor: color,
              })
            }
            isActive={showBackgroundColorPicker}
            setActive={(active) => setShowBackgroundColorPicker(active)}
          />
        </div>
      </div>
      <div>
        <strong>Fill</strong>
        <div>
          <ExclusiveBadgeGroup
            onChange={(v) => {
              actionManager?.executeAction(actionChangeFillStyle, v);
            }}
            value={getFormValue(
              elements,
              excaliState,
              (e) => e.fillStyle,
              excaliState.currentItemFillStyle
            )}
            options={[
              {
                value: "hachure",
                text: "Hachure",
                icon: <FillHachureIcon theme="light" />,
              },
              {
                value: "cross-hatch",
                text: "Cross-Hatch",
                icon: <FillCrossHatchIcon theme="light" />,
              },
              {
                value: "solid",
                text: "Solid",
                icon: <FillSolidIcon theme="light" />,
              },
            ]}
          />
        </div>
      </div>
      <div>
        <strong>Stroke Width</strong>
        <div>
          <ExclusiveBadgeGroup
            onChange={(v) => {
              actionManager?.executeAction(actionChangeStrokeWidth, v);
            }}
            value={getFormValue(
              elements,
              excaliState,
              (element) => element.strokeWidth,
              excaliState.currentItemStrokeWidth
            )}
            options={[
              {
                value: 1,
                text: "Thin",
                icon: <StrokeWidthIcon theme="light" strokeWidth={2} />,
              },
              {
                value: 2,
                text: "Bold",
                icon: <StrokeWidthIcon theme="light" strokeWidth={6} />,
              },
              {
                value: 4,
                text: "Extra Bold",
                icon: <StrokeWidthIcon theme="light" strokeWidth={10} />,
              },
            ]}
          />
        </div>
      </div>
      <div>
        <strong>Sloppiness</strong>
        <div>
          <ExclusiveBadgeGroup
            onChange={(v) => {
              actionManager?.executeAction(actionChangeSloppiness, v);
            }}
            value={getFormValue(
              elements,
              excaliState,
              (element) => element.roughness,
              excaliState.currentItemRoughness
            )}
            options={[
              {
                value: 0,
                text: "Architect",
                icon: <SloppinessArchitectIcon theme="light" />,
              },
              {
                value: 1,
                text: "Artist",
                icon: <SloppinessArtistIcon theme="light" />,
              },
              {
                value: 2,
                text: "Cartoon",
                icon: <SloppinessCartoonistIcon theme="light" />,
              },
            ]}
          />
        </div>
      </div>
      <div>
        <strong>Edges</strong>
        <div>
          <ExclusiveBadgeGroup
            onChange={(v) => {
              actionManager?.executeAction(actionChangeSharpness, v);
            }}
            value={getFormValue(
              elements,
              excaliState,
              (element) => element.strokeSharpness,
              (canChangeSharpness(excaliState.elementType) &&
                (isLinearElementType(excaliState.elementType)
                  ? excaliState.currentItemLinearStrokeSharpness
                  : excaliState.currentItemStrokeSharpness)) ||
                null
            )}
            options={[
              {
                value: "sharp",
                text: "Sharp",
                icon: <EdgeSharpIcon theme="light" />,
              },
              {
                value: "round",
                text: "Round",
                icon: <EdgeRoundIcon theme="light" />,
              },
            ]}
          />
        </div>
      </div>
      <div>
        <strong>Arrowheads</strong>
        <div></div>
      </div>
      <div>
        <strong>Font Size</strong>
        <div>
          <ExclusiveBadgeGroup
            onChange={(v) => {
              actionManager?.executeAction(actionChangeFontSize, v);
            }}
            value={getFormValue(
              elements,
              excaliState,
              (element) => isTextElement(element) && element.fontSize,
              excaliState.currentItemFontSize || DEFAULT_FONT_SIZE
            )}
            options={[
              {
                value: 16,
                text: "Small",
                icon: <FontSizeSmallIcon theme="light" />,
              },
              {
                value: 20,
                text: "Medium",
                icon: <FontSizeMediumIcon theme="light" />,
              },
              {
                value: 28,
                text: "Large",
                icon: <FontSizeLargeIcon theme="light" />,
              },
              {
                value: 36,
                text: "Extra Large",
                icon: <FontSizeExtraLargeIcon theme="light" />,
              },
            ]}
          />
        </div>
      </div>
      <div>
        <strong>Font Family</strong>
        <div>
          <ExclusiveBadgeGroup
            onChange={(v) => {
              actionManager?.executeAction(actionChangeFontFamily, v);
            }}
            value={getFormValue(
              elements,
              excaliState,
              (element) => isTextElement(element) && element.fontFamily,
              excaliState.currentItemFontFamily || DEFAULT_FONT_FAMILY
            )}
            options={[
              {
                value: FONT_FAMILY.Virgil,
                text: "Hand Drawn",
                icon: <FontFamilyHandDrawnIcon theme="light" />,
              },
              {
                value: FONT_FAMILY.Helvetica,
                text: "Normal",
                icon: <FontFamilyNormalIcon theme="light" />,
              },
              {
                value: FONT_FAMILY.Cascadia,
                text: "Monospace",
                icon: <FontFamilyCodeIcon theme="light" />,
              },
            ]}
          />
        </div>
      </div>
      <div>
        <strong>Text Align</strong>
        <div>
          <ExclusiveBadgeGroup
            onChange={(v) => {
              actionManager?.executeAction(actionChangeTextAlign, v);
            }}
            value={getFormValue(
              elements,
              excaliState,
              (element) => isTextElement(element) && element.textAlign,
              excaliState.currentItemTextAlign
            )}
            options={[
              {
                value: "left",
                text: "Left",
                icon: <TextAlignLeftIcon theme="light" />,
              },
              {
                value: "center",
                text: "Center",
                icon: <TextAlignCenterIcon theme="light" />,
              },
              {
                value: "right",
                text: "Right",
                icon: <TextAlignRightIcon theme="light" />,
              },
            ]}
          />
        </div>
      </div>
      <div>
        <strong>Opacity</strong>
        <div>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value="100"
            className={styles.opacity}
            onChange={() => {}}
          />
        </div>
      </div>
      <div>
        <strong>Layers</strong>
        <div className={styles.layers}>
          <BadgeGroup
            options={[
              {
                value: "sendBackward",
                text: "Send Backward",
                icon: <SendBackwardIcon theme="light" />,
              },
              {
                value: "bringForward",
                text: "Bring Forward",
                icon: <BringForwardIcon theme="light" />,
              },
              {
                value: "sendToBack",
                text: "Send to Back",
                icon: <SendToBackIcon theme="light" />,
              },
              {
                value: "bringToFront",
                text: "Bring to Front",
                icon: <BringToFrontIcon theme="light" />,
              },
            ]}
            onClick={() => {}}
          />
        </div>
      </div>
      <div>
        <strong>Align</strong>
        <div className={styles.layers}>
          <BadgeGroup
            options={[
              {
                value: "alignTop",
                text: "Align Top",
                icon: <AlignTopIcon theme="light" />,
              },
              {
                value: "alignBottom",
                text: "Align Bottom",
                icon: <AlignBottomIcon theme="light" />,
              },
              {
                value: "alignLeft",
                text: "Align Left",
                icon: <AlignLeftIcon theme="light" />,
              },
              {
                value: "alignRight",
                text: "Align Right",
                icon: <AlignRightIcon theme="light" />,
              },
              {
                value: "centerVertically",
                text: "Center Vertically",
                icon: <CenterVerticallyIcon theme="light" />,
              },
              {
                value: "centerHorizontally",
                text: "Center Horizontally",
                icon: <CenterHorizontallyIcon theme="light" />,
              },
            ]}
            onClick={() => {}}
          />
        </div>
      </div>
      <div>
        <strong>Actions</strong>
        <div>
          <BadgeGroup
            options={[
              {
                value: "duplicate",
                text: "Duplicate",
                icon: clone,
              },
              {
                value: "delete",
                text: "Delete",
                icon: trash,
              },
              {
                value: "group",
                text: "Group Selection",
                icon: <GroupIcon theme="light" />,
              },
              {
                value: "ungroup",
                text: "Ungroup Selection",
                icon: <UngroupIcon theme="light" />,
              },
            ]}
            onClick={() => {}}
          />
        </div>
      </div>
    </div>
    // TODO: change arrowhead
  );
}

const memoized = memo(PropertyPanel);

export default memoized;

function pick<T>(vs: T[]): T | null {
  const s = new Set(vs);
  if (s.size === 1) {
    return vs[0];
  }

  return null;
}
