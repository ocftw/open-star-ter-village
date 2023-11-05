export const getJobCardColor = (tag) => {
  const color = {};

  switch (tag) {
    case 'civil servants':
      color.avatar = '#b1bb95';
      color.background = '#8b9f6d';
      color.border = '#6f8d50';
      break;
    case 'engineer':
      color.avatar = '#95a2b2';
      color.background = '#5e7d93';
      color.border = '#2a6780';
      break;
    case 'writer':
      color.avatar = '#94a8a1';
      color.background = '#62867f';
      color.border = '#287168';
      break;
    case 'legal':
      color.avatar = '#d4ab8d';
      color.background = '#c2865f';
      color.border = '#b76a46';
      break;
    case 'designer':
      color.avatar = '#d1bb8f';
      color.background = '#be9f5f';
      color.border = '#b18b42';
      break;
    case 'marketing':
      color.avatar = '#c1907b';
      color.background = '#aa644f';
      color.border = '#984334';
      break;
    case 'advocator':
      color.avatar = '#9a91ab';
      color.background = '#6c688b';
      color.border = '#474c79';
      break;
  }

  return color;
};
