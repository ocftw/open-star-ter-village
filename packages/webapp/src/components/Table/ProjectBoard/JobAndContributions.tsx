import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import JobNameAvatarWithContributionBadges from '@/components/common/JobNameAvatarWithContributionBadges';
import ContributionAvatarWithPlayerBadge from '@/components/common/ContributionAvatarWithPlayerBadge';
import { ProjectContribution } from '@/game/store/slice/projectSlot/projectSlot';
import { playerNameMap } from '../../playerNameMap';

interface Props {
  jobName: string;
  requirements: number;
  contributions: ProjectContribution[];
}

export const JobAndContributions: React.FC<Props> = ({ jobName, requirements, contributions }) => {
  const totalJobContributions = contributions.filter((contribution) => contribution.jobName === jobName).reduce((acc, contribution) => acc + contribution.value, 0);

  return (
    <Grid item xs={3} container direction="row" margin="8px" alignItems="center"
    >
      <Box marginX="8px">
        <JobNameAvatarWithContributionBadges size='large' jobTitle={jobName} requirements={requirements} totalContributions={totalJobContributions} />
      </Box>
      {contributions
        .filter((contribution) => contribution.jobName === jobName)
        .map((contribution) => (
          <>
            <Box margin='8px' key={`${jobName}-${contribution.worker}`}>
              <ContributionAvatarWithPlayerBadge sizes='medium' contributions={contribution.value} playerID={playerNameMap[contribution.worker]} />
            </Box>
          </>
        ))}
    </Grid>
  );
};

export default JobAndContributions;
