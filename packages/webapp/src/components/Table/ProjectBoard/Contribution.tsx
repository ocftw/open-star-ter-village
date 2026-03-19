import React from 'react';
import { Box } from '@mui/material';
import { PlayerID } from 'boardgame.io';
import { IconButton } from '@mui/material';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import RemoveCircleOutlinedIcon from '@mui/icons-material/RemoveCircleOutlined';
import ContributionAvatarWithPlayerBadge from '@/components/common/ContributionAvatarWithPlayerBadge';
import { playerNameMap } from '@/components/playerNameMap';

interface Props {
  worker: PlayerID
  value: number;
  min: number;
  max: number;
  isInteractive: boolean;
  onChange: (value: number) => void;
}

const Contribution: React.FC<Props> = ({ worker, value, min, max, isInteractive, onChange }) => {
  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  return (
    <Box margin='8px'>
      {isInteractive && (
        <IconButton size="medium" color="primary" data-testid="contribution-decrement" onClick={handleDecrement}>
          <RemoveCircleOutlinedIcon />
        </IconButton>
      )}
      <ContributionAvatarWithPlayerBadge sizes='medium' contributions={value} playerID={playerNameMap[worker]} />
      {isInteractive &&(
        <IconButton size="small" color="primary" data-testid="contribution-increment" data-remaining={max - value} onClick={handleIncrement}>
          <AddCircleOutlinedIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default Contribution;
