import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { ProjectCard } from '@/game';
import { getSelectedHandProjectCards, toggleHandProjectCardSelection } from '@/lib/reducers/handProjectCardSlice';
import { Chip } from '@mui/material';

type UserPanelProps = {
  userName: string;
  workerTokens: number;
  actionTokens: number;
  score: number;
  projectCards: ProjectCard[];
};

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100vh', // Full height
  overflowY: 'auto', // Scroll if content overflows
  width: '300px', // Fixed width
}));

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

const UserPanel: React.FC<UserPanelProps> = ({ userName, workerTokens, actionTokens, score, projectCards }) => {
  const dispatch = useDispatch();
  const selectedProjectCards = useSelector(getSelectedHandProjectCards);

  const handleSelect = (cardId: string) => {
    dispatch(toggleHandProjectCardSelection(cardId));
  };

  return (
    <StyledPaper>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6">{userName}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>Workers: {workerTokens}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>Actions: {actionTokens}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>Score: {score}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">Project Cards</Typography>
        </Grid>
        <Grid container direction="column" spacing={2}>
          {projectCards.map((card) => (
            <Grid item key={card.id}>
              <SelectablePaper
                onClick={() => handleSelect(card.id)}
                className={selectedProjectCards[card.id] ? 'selected' : ''}
              >
                <Grid container justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" style={{ flexGrow: 1 }}>{card.name}</Typography> {/* Emphasized title */}
                  {!!card.type && (
                    <Chip
                      label={card.type}
                      color="primary"
                      size="small"
                      style={{ marginLeft: '8px' }}
                    />
                  )}
                </Grid>
                {Object.keys(card.requirements).map((jobName) => (
                  <Typography key={jobName}>{card.requirements[jobName]} {jobName}</Typography>
                ))}
              </SelectablePaper>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </StyledPaper>
  );
};

export default UserPanel;
