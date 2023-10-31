import { ParseMarkdownAndHtml } from '../parseMarkdownAndHtml';

const ProjectCard = ({ card }) => (
  <div className="col-md-6 col-xl-4 mb-3" id={card.data.id}>
    <div
      className="section-main"
      style={{ border: `1rem solid ${card.data.color.background}` }}
    >
      <h3>{card.data.title}</h3>
      <div className="d-flex flex-column">
        <div className="d-flex flex-wrap mb-3 justify-content-evenly">
          {card.data.avatarList.map((avatar) => (
            <div
              key={avatar.data.title}
              className="col-3 avatar avatar-list"
              style={{
                backgroundColor: `${avatar.data.color.background}`,
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
        <ParseMarkdownAndHtml markdown={true}>
          {card.content}
        </ParseMarkdownAndHtml>
      </div>
    </div>
  </div>
);

export default ProjectCard;
