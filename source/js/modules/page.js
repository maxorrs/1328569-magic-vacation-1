export default () => {
  const documentBody = document.querySelector(`body`);

  window.addEventListener(`load`, () => {
    documentBody.classList.add(`page--loaded`);
    documentBody.classList.add(`page--loadedAnimate`);
  });
};
