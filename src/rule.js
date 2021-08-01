// @ts-check

const Rule = (() => {
  const playProjectCard = {
    actionPoint: 2,
  };
  const playerHand = {
    projectCard: { max: 2 },
    resourceCard: { max: 5 },
  };
  return {
    playProjectCard,
    playerHand,
  };
})();
