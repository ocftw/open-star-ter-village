import React from 'react';
import Grid from '@mui/material/Grid';
import ProjectSlot from './ProjectSlot';
import { ProjectSlotState } from '@/game';

type ProjectBoardProps = {
  slots: ProjectSlotState[];
  playerID: string | null;
};

const ProjectBoard: React.FC<ProjectBoardProps> = ({ slots, playerID }) => {
  return (
    <Grid container spacing={3} style={{ padding: '0 16px' }}>
      {slots.map((slot) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={slot.id}>
          <ProjectSlot slot={slot} playerID={playerID} />
        </Grid>
      ))}
    </Grid>
  );
};

export default ProjectBoard;
