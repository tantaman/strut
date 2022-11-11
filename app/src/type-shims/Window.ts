'use strict';

import { Logger } from '../logger/Log';

declare global {
  interface Window {
    log: Logger,
    serviceRegistry: any,
  }
}

declare global {
  interface ParentNode {
    replaceChildren(...x: Node[]);
  }
}

export {};
