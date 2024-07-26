import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import JobNameAvatarWithContributionBadges from '@/components/common/JobNameAvatarWithContributionBadges';
import { ProjectContribution } from '@/game/store/slice/projectSlot/projectSlot';
import { PlayerID } from 'boardgame.io';
import Contribution from './Contribution';

interface Props {
  jobName: string;
  requirements: number;
  contributions: ProjectContribution[];
  interactivePlayers: Record<PlayerID, boolean>;
  onContributionChange: (jobName: string, diffAmount: number) => void;
}

export const JobAndContributions: React.FC<Props> = ({ jobName, requirements, contributions, interactivePlayers, onContributionChange }) => {
  const totalJobContributions = contributions.filter((contribution) => contribution.jobName === jobName).reduce((acc, contribution) => acc + contribution.value, 0);

  return (
    <Grid item xs={3} container direction="row" margin="8px" alignItems="center"
    >
      <Box marginX="8px">
        <JobNameAvatarWithContributionBadges size='large' jobTitle={jobName} requirements={requirements} totalContributions={totalJobContributions} />
      </Box>
      {contributions.map((contribution) => (
        <Contribution
          key={`${jobName}-${contribution.worker}`}
          worker={contribution.worker}
          initialValue={contribution.value}
          min={contribution.value}
          max={requirements - totalJobContributions + contribution.value}
          isInteractive={interactivePlayers[contribution.worker]}
          onChange={(value) => {
            const diffAmount = value - contribution.value;
            onContributionChange(jobName, diffAmount);
          }} />
        ))}
    </Grid>
  );
};

export default JobAndContributions;
