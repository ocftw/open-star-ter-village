import { fetchCards } from "../lib/fetchCards";

const getSupportLanguages = () => {
  return ["en", "zh-tw"];
};

export const getStaticProps = async () => {
  const lang = "zh-tw";
  const cards = await fetchCards(lang);
  console.log(cards);
  const formattedCards = JSON.stringify(cards);

  return {
    props: { cards },
  };
};

const test = ({ cards }) => {
  return (
    <div>
      <div>card</div>
      {cards.map((card) => (
        <>
          <div>{card.image}</div>
          <div>{card.title}</div>
          <div>{card.description}</div>
          <div>{card.draft}</div>
          <div>{card.type}</div>
        </>
      ))}
    </div>
  );
};

export default test;
