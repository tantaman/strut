const tempEl = document.createElement("div");
export const toDOM = (htmlString: string) => {
  tempEl.innerHTML = "<div class='markdown'>" + htmlString + "</div>";
  return tempEl.children.item(0) as HTMLElement;
};
