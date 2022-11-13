import {
  DrawingInteractionState as IDrawingInteractionState,
  Tool,
} from "../schema";
import { Model } from "@vlcn.io/model";

export default class DrawingInteractionState
  extends Model<IDrawingInteractionState>
  implements IDrawingInteractionState
{
  get currentTool(): Tool {
    return this.data.currentTool;
  }

  // TODO: does it notify subscribers when updating
  // outside of a tx?
  activateTool(t: Tool): void {
    this.update({
      currentTool: t,
    });
  }
}
