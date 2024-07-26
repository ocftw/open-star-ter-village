import React from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { ProjectCard } from '@/game';
import { getSelectedHandProjectCards, toggleHandProjectCardSelection } from '@/lib/reducers/handProjectCardSlice';
import { Chip, Paper, styled } from '@mui/material';
import JobNameAvatarWithContributionBadges from '../common/JobNameAvatarWithContributionBadges';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { isHandProjectCardsInteractive } from '@/lib/reducers/actionStepSlice';

const SelectablePaper = styled(Paper)(({ theme }) => ({
  padding: '16px',
  display: 'flex',
  flexDirection: 'column', // Ensures children are stacked vertically
  alignItems: 'flex-start', // Align children to the start
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.selected': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const HandProjectCard: React.FC<{ card: ProjectCard; }> = ({ card }) => {
  const dispatch = useAppDispatch();
  const selectedProjectCards = useAppSelector(getSelectedHandProjectCards);
  const isInteractive = useAppSelector(isHandProjectCardsInteractive);
  const selected = isInteractive && !!selectedProjectCards[card.id];

  const handleSelect = (cardId: string) => {
    if (!isInteractive) return;
    dispatch(toggleHandProjectCardSelection(cardId));
  };

  return (
    <Grid item>
      <SelectablePaper
        onClick={() => handleSelect(card.id)}
        className={selected ? 'selected' : ''}
      >
        <Grid container justifyContent="space-between" alignItems="center">
          <Typography variant="h6" style={{ flexGrow: 1 }}>{card.name}</Typography> {/* Emphasized title */}
          {!!card.type && (
            <Chip
              label={card.type}
              color="primary"
              size="small"
              style={{ marginLeft: '8px' }} />
          )}
        </Grid>
        <Grid container spacing={1}>
          {Object.keys(card.requirements).map((jobName) => (
            <Grid item key={jobName} margin='4px'>
              <JobNameAvatarWithContributionBadges key={jobName} jobTitle={jobName} requirements={card.requirements[jobName]} />
            </Grid>
          ))}
        </Grid>
      </SelectablePaper>
    </Grid>
  );
};

export default HandProjectCard;
