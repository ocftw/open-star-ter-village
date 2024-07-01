import { ProjectCard } from '@/game';
import {
  Stack,
  Box,
  RadioGroup,
  Radio,
  FormControlLabel,
} from '@mui/material';

interface Props {
  projects: ProjectCard[];
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value: number;
}

const HandProjectCards: React.FC<Props> = ({ projects, onChange, value }) => (
  <Stack direction="row" spacing={2}>
    <Box component='label'>Hand project cards</Box>
    <RadioGroup onChange={onChange} value={value}>
      {
        projects.map((project, index) =>
          <FormControlLabel key={`${project.name}-${index}`} value={index} control={<Radio />} label={`${project.name} ${JSON.stringify(project.requirements)}`} />)
      }
    </RadioGroup>
  </Stack>
);

export default HandProjectCards;
