import { Tool } from "../schema";
import { Model } from "@vlcn.io/model";

type Data = {
  readonly currentTool: Tool;
};

export default class DrawingInteractionState extends Model<Data> {
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
