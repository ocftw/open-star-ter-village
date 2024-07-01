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

const HandProjectCards: React.FC<Props> = ({ projects: projectCardss, onChange, value }) => (
  <Stack direction="row" spacing={2}>
    <Box component='label'>Hand project cards</Box>
    <RadioGroup onChange={onChange} value={value}>
      {
        projectCardss.map((projectCard, index) =>
          <>
            <FormControlLabel
              key={`${projectCard.name}-${index}`}
              value={index}
              control={<Radio />}
              label={projectCard.name}
            />
            Job requirements:
            {
              Object.keys(projectCard.requirements).map(jobName => (
                <Box
                  key={`${projectCard.name}-${jobName}`}
                  component='label'
                >
                  {jobName}: {projectCard.requirements[jobName]}
                </Box>
              ))
            }
          </>
        )
      }
    </RadioGroup>
  </Stack>
);

export default HandProjectCards;
