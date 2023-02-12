class AnimateText {
  constructor({
    elementSelector,
    delay = 0,
    duration = 400,
    classForActivate = `text-animation--active`,
    property = `transform`,
    isSaveSpaces = false,
  }) {
    this._WORD_OFFSET = 250;
    this._elementSelector = elementSelector;
    this._duration = duration;
    this._classForActivate = classForActivate;
    this._property = property;
    this._element = document.querySelector(this._elementSelector);
    this._wordTimeOffset = 0;
    this._delay = delay;
    this._isSaveSpaces = isSaveSpaces;
    this._initialInnerHTML = this._element.innerHTML;

    this.prepareText();
  }

  getLetterTimeOffset(position) {
    if (position % 2 === 0) {
      return 100;
    }

    if (position % 3 === 0) {
      return 50;
    }

    return 150;
  }

  createElement(letter, index) {
    const span = document.createElement(`span`);
    span.textContent = letter;
    const letterTimeOffset = this.getLetterTimeOffset(index + 1);
    const delay = this._delay + this._wordTimeOffset + letterTimeOffset;
    span.style.transition = `${this._property} ${this._duration}ms ease ${delay}ms`;
    return span;
  }

  prepareText() {
    const text = this._isSaveSpaces
      ? Array(this._element.textContent.trim())
      : this._element.textContent.trim().split(` `).filter((letter) => letter !== ``);

    const content = text.reduce((fragmentParent, word) => {
      const wordElement = Array.from(word).reduce((fragment, letter, index) => {
        fragment.appendChild(this.createElement(letter, index));
        return fragment;
      }, document.createDocumentFragment());

      const wordContainer = document.createElement(`span`);
      wordContainer.classList.add(`text-animation__word`);
      wordContainer.appendChild(wordElement);
      fragmentParent.appendChild(wordContainer);

      this._wordTimeOffset += this._WORD_OFFSET;

      return fragmentParent;
    }, document.createDocumentFragment());

    this._element.innerHTML = ``;
    this._element.classList.add(`text-animation`);
    this._element.appendChild(content);
  }

  runAnimation() {
    if (!this._element) {
      return;
    }

    this._element.classList.add(this._classForActivate);
  }

  destroyAnimation() {
    this._element.innerHTML = this._initialInnerHTML;
    this._element.classList.remove(this._classForActivate);
  }
}

export default AnimateText;
