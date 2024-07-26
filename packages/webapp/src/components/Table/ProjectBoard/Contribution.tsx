import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { PlayerID } from 'boardgame.io';
import { IconButton } from '@mui/material';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import RemoveCircleOutlinedIcon from '@mui/icons-material/RemoveCircleOutlined';
import ContributionAvatarWithPlayerBadge from '@/components/common/ContributionAvatarWithPlayerBadge';
import { playerNameMap } from '@/components/playerNameMap';

interface Props {
  worker: PlayerID
  initialValue: number;
  min: number;
  max: number;
  isInteractive: boolean;
  onChange: (value: number) => void;
}

const Contribution: React.FC<Props> = ({ worker, initialValue, min, max, isInteractive, onChange }) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [isInteractive, initialValue]);

  const handleIncrement = () => {
    if (value < max) {
      const newValue = value + 1;
      setValue(newValue);
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      const newValue = value - 1;
      setValue(newValue);
      onChange(newValue);
    }
  };

  const displayValue = isInteractive ? value : initialValue;

  return (
    <Box margin='8px'>
      {isInteractive && (
        <IconButton size="medium" color="primary" onClick={handleDecrement}>
          <RemoveCircleOutlinedIcon />
        </IconButton>
      )}
      <ContributionAvatarWithPlayerBadge sizes='medium' contributions={displayValue} playerID={playerNameMap[worker]} />
      {isInteractive &&(
        <IconButton size="small" color="primary" onClick={handleIncrement}>
          <AddCircleOutlinedIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default Contribution;
