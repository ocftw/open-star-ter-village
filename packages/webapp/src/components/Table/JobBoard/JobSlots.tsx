import React from 'react';
import Grid from '@mui/material/Grid';
import JobCard from './JobCard';
import { JobSlotsState } from '@/game';

type JobCardListProps = {
  jobs: JobSlotsState;
};

const JobSlots: React.FC<JobCardListProps> = ({ jobs }) => {
  return (
    <Grid container spacing={3} style={{ padding: '0 16px' }}>
      {jobs.map((job) => (
        <Grid item key={job.id} xs={12} sm={6} md={4} lg={3}>
          <JobCard id={job.id} title={job.name} />
        </Grid>
      ))}
    </Grid>
  );
};

export default JobSlots;
