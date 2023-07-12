const CardsColumns = ({ id, title, cards, type }) => {
  // Group cards by type
  const groupCards = cards.filter((card) => card.frontMatter.type === type);
  // Filter cards by draft
  const filterGroupedCards = groupCards.filter(
    (card) => !card.frontMatter.draft,
  );

  return (
    <div className="section" id={id}>
      <div className="container">
        <div className="section-head">
          <h2>{title}</h2>
        </div>
        <div className="row">
          {filterGroupedCards.map((card, index) => (
            <CardUnit key={index} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
};

const CardUnit = ({ card }) => (
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

export default CardsColumns;
