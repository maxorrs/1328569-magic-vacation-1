import throttle from 'lodash/throttle';
import AnimateText from '../utils/animate-text';

export default class FullPageScroll {
  constructor() {
    this.THROTTLE_TIMEOUT = 1000;
    this.DELAY_BETWEEN_SCREEN_SWITCHING = 700;
    this.DELAY_BETWEEN_SCREEN_SWITCHING_ACTIVE_CLASS = this.DELAY_BETWEEN_SCREEN_SWITCHING + 100;
    this.DELAY_ACTIVE_CLASS = 100;
    this.scrollFlag = true;
    this.timeout = null;

    this.screenElements = document.querySelectorAll(`.screen:not(.screen--result)`);
    this.menuElements = document.querySelectorAll(`.page-header__menu .js-menu-link`);

    this.activeScreen = 0;
    this.prevScreen = 0;

    this.onScrollHandler = this.onScroll.bind(this);
    this.onUrlHashChangedHandler = this.onUrlHashChanged.bind(this);

    this.backgroundScreenAppearingTimeoutId = null;
    this.resetHidingStylesScreensTimeoutId = null;
    this.removingHidingStylesScreenTimeoutId = null;
    this.addingActivateStylesScreenTimeoutId = null;

    this._titleAnimation = null;
    this._dateCompetitionTitleAnimation = null;

    this.screenTitleSelector = {
      top: `.intro__title`,
      story: `.slider__item-title`,
      prizes: `.prizes__title`,
      rules: `.rules__title`,
      game: `.game__title`,
    };
  }

  init() {
    document.addEventListener(`wheel`, throttle(this.onScrollHandler, this.THROTTLE_TIMEOUT, {trailing: true}));
    window.addEventListener(`popstate`, this.onUrlHashChangedHandler);

    this.onUrlHashChanged();
  }

  getScreenIndex(screenSelector) {
    return Array.from(this.screenElements).findIndex((screenElement) => document.querySelector(screenSelector) === screenElement);
  }

  getIsFirstLoading() {
    return this.activeScreen === 0 && this.prevScreen === 0;
  }

  onScroll(evt) {
    if (this.scrollFlag) {
      this.reCalculateActiveScreenPosition(evt.deltaY);
      const currentPosition = this.activeScreen;
      if (currentPosition !== this.activeScreen) {
        this.changePageDisplay();
      }
    }
    this.scrollFlag = false;
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.timeout = null;
      this.scrollFlag = true;
    }, this.THROTTLE_TIMEOUT);
  }

  onUrlHashChanged() {
    this.prevScreen = this.activeScreen;
    const newIndex = Array.from(this.screenElements).findIndex((screen) => location.hash.slice(1) === screen.id);
    this.activeScreen = (newIndex < 0) ? 0 : newIndex;
    this.changePageDisplay();
  }

  clearPageLoadedAnimateClass() {
    if (document.body.classList.contains(`page--loadedAnimate`)) {
      document.body.classList.remove(`page--loadedAnimate`);
    }
  }

  switchAnimateScreen() {
    const mainScreenIndex = this.getScreenIndex(`#top`);
    const animationScreen = document.querySelector(`.animation-screen`);
    if (this.activeScreen === mainScreenIndex) {
      animationScreen.classList.remove(`animation-screen--hidden`);
    } else {
      animationScreen.classList.add(`animation-screen--hidden`);
    }
  }

  updateTitlesAnimations() {
    const {id: activeScreenId} = this.screenElements[this.activeScreen];
    const activeScreenTitleSelector = this.screenTitleSelector[activeScreenId];
    const isFirstLoading = this.getIsFirstLoading();
    const isInitialScreen = this.activeScreen === 0;
    const titleAnimationDelay = isFirstLoading && isInitialScreen ? 1000 : 0;

    if (this._titleAnimation) {
      this._titleAnimation.destroyAnimation();
    }

    if (this._dateCompetitionTitleAnimation) {
      this._dateCompetitionTitleAnimation.destroyAnimation();
      this._dateCompetitionTitleAnimation = null;
    }

    this._titleAnimation = new AnimateText({
      delay: titleAnimationDelay,
      elementSelector: activeScreenTitleSelector
    });

    if (this.activeScreen === 0) {
      const dateCompetitionAnimationDelay = isFirstLoading ? 1700 : 0;
      this._dateCompetitionTitleAnimation = new AnimateText({
        elementSelector: `.intro__date`,
        delay: dateCompetitionAnimationDelay,
        isSaveSpaces: true,
      });
    }
  }

  changePageDisplay() {
    this.updateTitlesAnimations();
    this.changeVisibilityDisplay();
    this.changeActiveMenuItem();
    this.emitChangeDisplayEvent();
    this.clearPageLoadedAnimateClass();
    this.switchAnimateScreen();
  }

  enableScreenBackground() {
    document.querySelector(`.background-screen`).classList.add(`background-screen--active`);
    this.backgroundScreenAppearingTimeoutId = setTimeout(() => {
      document.querySelector(`.background-screen`).classList.remove(`background-screen--active`);
    }, this.DELAY_BETWEEN_SCREEN_SWITCHING);
  }

  changeVisibilityDisplay() {
    clearTimeout(this.resetHidingStylesScreensTimeoutId);
    clearTimeout(this.backgroundScreenAppearingTimeoutId);
    clearTimeout(this.removingHidingStylesScreenTimeoutId);
    clearTimeout(this.addingActivateStylesScreenTimeoutId);

    const storyScreenIndex = this.getScreenIndex(`#story`);
    const prizesScreenIndex = this.getScreenIndex(`#prizes`);

    const isDelayBetweenScreenSwitching = this.prevScreen === storyScreenIndex && this.activeScreen === prizesScreenIndex;

    if (isDelayBetweenScreenSwitching) {
      this.enableScreenBackground();
    }

    this.screenElements.forEach((screen) => {
      this.resetHidingStylesScreensTimeoutId = setTimeout(() => {
        screen.classList.add(`screen--hidden`);
        screen.classList.remove(`active`);
      }, isDelayBetweenScreenSwitching ? this.DELAY_BETWEEN_SCREEN_SWITCHING : 0);
    });

    this.removingHidingStylesScreenTimeoutId = setTimeout(() => {
      this.screenElements[this.activeScreen].classList.remove(`screen--hidden`);
    }, isDelayBetweenScreenSwitching ? this.DELAY_BETWEEN_SCREEN_SWITCHING : 0);

    this.addingActivateStylesScreenTimeoutId = setTimeout(() => {
      const activeScreenElement = this.screenElements[this.activeScreen];
      activeScreenElement.classList.add(`active`);
      this._titleAnimation.runAnimation();

      const isNeedToRunDateCompetitionTitleAnimation = this.activeScreen === 0 && this._dateCompetitionTitleAnimation;
      if (isNeedToRunDateCompetitionTitleAnimation) {
        this._dateCompetitionTitleAnimation.runAnimation();
      }
    }, isDelayBetweenScreenSwitching ? this.DELAY_BETWEEN_SCREEN_SWITCHING_ACTIVE_CLASS : this.DELAY_ACTIVE_CLASS);
  }

  changeActiveMenuItem() {
    const activeItem = Array.from(this.menuElements).find((item) => item.dataset.href === this.screenElements[this.activeScreen].id);
    if (activeItem) {
      this.menuElements.forEach((item) => item.classList.remove(`active`));
      activeItem.classList.add(`active`);
    }
  }

  emitChangeDisplayEvent() {
    const event = new CustomEvent(`screenChanged`, {
      detail: {
        'screenId': this.activeScreen,
        'screenName': this.screenElements[this.activeScreen].id,
        'screenElement': this.screenElements[this.activeScreen]
      }
    });

    document.body.dispatchEvent(event);
  }

  reCalculateActiveScreenPosition(delta) {
    this.prevScreen = this.activeScreen;

    if (delta > 0) {
      this.activeScreen = Math.min(this.screenElements.length - 1, ++this.activeScreen);
    } else {
      this.activeScreen = Math.max(0, --this.activeScreen);
    }
  }
}
