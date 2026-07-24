// jsdom does not implement HTMLDialogElement.showModal()/close(), which the
// bespoke design/Modal uses. Shim just enough for component tests: reflect
// the open state and fire the close event Modal listens to.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
