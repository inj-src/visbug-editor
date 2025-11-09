import { Handles } from "./handles.element.js";
import { HandlesStyles, HoverStyles } from "./styles.store.js";

export class Hover extends Handles {
  constructor() {
    super();
    this.styles = [HandlesStyles, HoverStyles];
  }

  connectedCallback() {
    this.$shadow.adoptedStyleSheets = this.styles;
  }

  disconnectedCallback() {}

  set position({ el, boundingRect, isFixed, uiContainer }) {
    this.$shadow.innerHTML = this.render(
      boundingRect || el.getBoundingClientRect(),
      null,
      isFixed,
      uiContainer
    );
  }

  render({ width, height, top, left, x, y }, node_label_id, isFixed, uiContainer) {
    // Calculate offset if uiContainer is not body
    let offsetX = 0;
    let offsetY = 0;

    if (uiContainer && uiContainer !== document.body) {
      const containerRect = uiContainer.getBoundingClientRect();
      offsetX = containerRect.left + (isFixed ? 0 : window.scrollX);
      offsetY = containerRect.top + (isFixed ? 0 : window.scrollY);
    }

    const finalY = y + (isFixed ? 0 : window.scrollY) - offsetY;
    const finalX = x - offsetX;

    this.style.setProperty("--top", `${finalY}px`);
    this.style.setProperty("--left", `${finalX}px`);
    this.style.setProperty("--position", isFixed ? "fixed" : "absolute");

    return `
      <svg
        width="${width}" height="${height}"
        viewBox="0 0 ${width} ${height}"
      >
        <rect fill="none" width="100%" height="100%"></rect>
    `;
  }
}

customElements.define("visbug-hover", Hover);
