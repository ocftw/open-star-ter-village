import { ProjectSlotState } from '@/game';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { styled } from '@mui/material/styles';
import { playerNameMap } from '../playerNameMap';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { getSelectedProjectSlots, toggleProjectSlotSelection } from '@/lib/reducers/projectSlotSlice';

type Props = {
  slot: ProjectSlotState;
};

const StyledPaper = styled(Paper)(({ theme }) => ({
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

const ProjectSlot: React.FC<Props> = ({ slot }) => {
  const dispath = useAppDispatch();
  const selectedSlots = useAppSelector(getSelectedProjectSlots);
  const selected = !!selectedSlots[slot.id];

  const handleSelect = () => {
    dispath(toggleProjectSlotSelection(slot.id));
  };

  const projectName = slot.card?.name;
  const projectType = slot.card?.type;
  const owner = playerNameMap[slot.owner];
  const requirements = slot.card?.requirements || {};
  const requiredJobs = Object.keys(slot.card?.requirements || []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <StyledPaper
          onClick={handleSelect}
          className={selected ? 'selected' : ''}
        >
          <Grid container direction="column" alignItems="center" justifyContent="center" style={{ minHeight: '200px' }}>
            {!!projectType && (
              <Chip label={projectType} color="primary" style={{ position: 'absolute', top: '16px', right: '16px' }} />
            )}
            <Typography variant="h6" style={{ position: 'absolute', top: '16px', left: '16px' }}>
              {projectName}
            </Typography>
            <Grid container justifyContent="center" style={{ marginTop: '40px' }}>
              {requiredJobs.map((jobName) => (
                <Grid item key={`${slot.id}-${jobName}`} style={{ textAlign: 'center', margin: '8px' }}>
                  <Typography>{requirements[jobName]} {jobName}</Typography>
                  {slot.contributions
                    .filter((contribution) => contribution.jobName === jobName)
                    .map((contribution) => (
                      <Typography key={`${jobName}-${contribution.worker}`}>
                        {contribution.value}: {playerNameMap[contribution.worker]}
                      </Typography>
                    ))}
                </Grid>
              ))}
            </Grid>
            <Typography variant="body2" style={{ position: 'absolute', bottom: '16px', right: '16px' }}>
              Owner: {owner}
            </Typography>
          </Grid>
        </StyledPaper>
      </Grid>
    </Grid>
  );
}

export default ProjectSlot;
