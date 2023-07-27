const CardsGrid = ({
  id,
  title,
  cards,
  filter,
  projectCardSubtype = '',
  projectCardSubtitle = '',
}) => {
  // Group cards by type
  const groupCards = cards.filter((card) => card.frontMatter.type === filter);
  // Filter cards by draft
  let filterGroupedCards = groupCards.filter((card) => !card.frontMatter.draft);
  // Project cards grouped by subtype tag
  if (projectCardSubtype) {
    filterGroupedCards = filterGroupedCards.filter((card) =>
      card.frontMatter.tags?.includes(projectCardSubtype),
    );
  }

  return (
    <div className="section" id={id}>
      <div className="container">
        <div className="section-head">
          {projectCardSubtype ? (
            <h2>
              {title} | {projectCardSubtitle}
            </h2>
          ) : (
            <h2>{title}</h2>
          )}
        </div>
        <div className="row">
          {filterGroupedCards.map((card, index) => (
            <Card key={index} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
};

const Card = ({ card }) => (
  <div className="col-md-4 mb-3">
    <div className="section-main">
      <h3>{card.frontMatter.title}</h3>
      <div>
        <img src={card.frontMatter.image} alt={card.frontMatter.title} />
        <strong>{card.frontMatter.description}</strong>
        <div dangerouslySetInnerHTML={{ __html: card.content }} />
      </div>
    </div>
  </div>
);

export default CardsGrid;
