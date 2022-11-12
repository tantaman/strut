// import { ExcalidrawElement } from "../../../../git_modules/excalidraw/src/element/types";
// import {
//   changeset,
//   Changeset,
//   createChangeset,
//   CreateChangeset,
// } from "@strut/model/Changeset";
// import PersistedModel from "@strut/model/PersistedModel";
// import { SID_of } from "@strut/sid";

// export type Data = {
//   id: SID_of<Drawing>;
//   type?: string;
//   version?: number;
//   elements: readonly ExcalidrawElement[];
//   // see ImportedDataState
// };

// export default class Drawing extends PersistedModel<Data> {
//   static SCHEMA_NAME = "drawing";
//   schemaName = Drawing.SCHEMA_NAME;

//   static create(
//     elements: readonly ExcalidrawElement[]
//   ): CreateChangeset<Drawing, Data> {
//     const data = {
//       id: this.newId(),
//       elements,
//     };
//     return createChangeset(new Drawing(data), data);
//   }

//   static createFromStorage(rawDrawing: Data): Drawing {
//     return new Drawing(rawDrawing);
//   }

//   toStorage(): Data {
//     return this.data;
//   }

//   get elements() {
//     return this.data.elements;
//   }

//   setElements(elements: readonly ExcalidrawElement[]) {
//     return this.change({
//       elements,
//     });
//   }
// }
