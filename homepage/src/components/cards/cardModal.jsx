import { useRef } from 'react';
import { ParseMarkdownAndHtml } from '../parseMarkdownAndHtml';

function CardModal({ card }) {
  const dialogRef = useRef(null);
  const titleId = `${card.data.id}-modal-title`;

  const handleClose = () => dialogRef.current?.close();
  const handleShow = () => dialogRef.current?.showModal();
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn project-card-more"
        onClick={handleShow}
      >
        More…
      </button>

      <dialog
        ref={dialogRef}
        className="project-card-modal"
        aria-labelledby={titleId}
        onClick={handleBackdropClick}
      >
        <div
          className="project-card-modal-frame"
          style={{ borderColor: card.data.color.background }}
        >
          <header className="project-card-modal-header">
            <h2 id={titleId}>{card.data.title}</h2>
            <button
              type="button"
              className="project-card-modal-close"
              aria-label="Close"
              onClick={handleClose}
            >
              ×
            </button>
          </header>
          <div className="project-card-modal-body">
            <div className="d-flex flex-column">
              <div className="d-flex flex-wrap mb-3 justify-content-evenly">
                {card.data.avatarList.map((avatar) => (
                  <div
                    key={avatar.data.title}
                    className="col-3 avatar avatar-list"
                    style={{
                      backgroundColor: avatar.data.color.background,
                      border: `3px solid ${avatar.data.color.border}`,
                    }}
                  >
                    <div
                      style={{
                        backgroundImage: `url(${avatar.data.image})`,
                      }}
                    >
                      &nbsp;
                    </div>
                  </div>
                ))}
              </div>
              <strong className="mb-3">{card.data.description}</strong>
              <div className="project-card-modal-content">
                <ParseMarkdownAndHtml markdown={true}>
                  {card.content}
                </ParseMarkdownAndHtml>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}

export default CardModal;
