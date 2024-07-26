import React from 'react';
import { ProjectSlotState } from '@/game';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { styled } from '@mui/material/styles';
import { playerNameMap } from '../../playerNameMap';
import { JobAndContributions } from './JobAndContributions';
import { PlayerID } from 'boardgame.io';
import { DispatchProps, mapDispatchToProps, mapStateToProps, StateProps } from './ProjectSlot.selectors';
import { connect } from 'react-redux';

type OwnProps = {
  slot: ProjectSlotState;
  playerID: PlayerID | null;
};

type Props = OwnProps & StateProps & DispatchProps;

const StyledPaper = styled(Paper)(({ theme }) => ({
  minHeight: '200px',
  border: '1px solid black',
  cursor: 'pointer',
  padding: '16px',
  position: 'relative',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.selected': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const ProjectSlot: React.FC<Props> = ({
  slot,
  playerID,
  isInteractive,
  isJoinedInteractive,
  isOwnedInteractive,
  selectedSlots,
  toggleProjectSlotSelection,
  updateContribution,
}) => {
  const selected = isInteractive && !!selectedSlots[slot.id];

  const onProjectSlotClick = () => {
    if (!isInteractive) return;
    toggleProjectSlotSelection(slot.id);
  };

  const projectName = slot.card?.name;
  const projectType = slot.card?.type;
  const owner = playerNameMap[slot.owner];
  const requirements = slot.card?.requirements || {};
  const requiredJobs = Object.keys(slot.card?.requirements || []);

  const interactivePlayers = playerID === null ? {} : {
    [playerID!]: (isOwnedInteractive && slot.owner === playerID) || (isJoinedInteractive && slot.owner !== playerID),
  };

  const onContributionChange = (jobName: string, diffAmount: number) => {
    updateContribution(slot.id, jobName, diffAmount);
  };

  return (
    <Grid spacing={3} xs={12}>
      <StyledPaper
        onClick={onProjectSlotClick}
        className={selected ? 'selected' : ''}
      >
        <Box display="flex" alignItems="center">
          <Avatar sizes="medium">{owner}</Avatar>
          <Typography variant="h6" sx={{ marginLeft: '8px' }}>{projectName}</Typography>
        </Box>
        {!!projectType && (<Chip label={projectType} color="primary" size="small" />)}
        <Grid container direction="column" justifyContent="center" alignItems="flex-start" width='100%'>
          {requiredJobs.map((jobName) => (
            <JobAndContributions
              key={`${slot.id}-${jobName}`}
              jobName={jobName}
              requirements={requirements[jobName]}
              contributions={slot.contributions.filter((contribution) => contribution.jobName === jobName)}
              interactivePlayers={interactivePlayers}
              onContributionChange={onContributionChange}
            />
          ))}
        </Grid>
      </StyledPaper>
    </Grid>
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(ProjectSlot);
