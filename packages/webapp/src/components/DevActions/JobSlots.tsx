import { JobSlotsState } from '@/game';
import {
  Stack,
  Box,
  RadioGroup,
  Radio,
  FormControlLabel,
} from '@mui/material';

interface Props {
  jobSlots: JobSlotsState;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value: number;
}

const JobSlots: React.FC<Props> = ({ jobSlots, onChange, value }) => (
  <Stack direction="row" spacing={2}>
    <Box component='label'>Active job cards</Box>
    <RadioGroup onChange={onChange} value={value}>
      {
        jobSlots.map((job, index) =>
          <FormControlLabel key={`${job.name}-${index}`} value={index} control={<Radio />} label={job.name} />)
      }
    </RadioGroup>
  </Stack>
);

export default JobSlots;
