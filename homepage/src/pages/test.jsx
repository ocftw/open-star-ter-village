import { fetchCard } from "../lib/fetchCard";

export const getStaticProps = async () => {
  const card = await fetchCard();

  return {
    props: {
      card,
    },
  }
};

const test = () => {
  return <div>test</div>;
};

export default test;
