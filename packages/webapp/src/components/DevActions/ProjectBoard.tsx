import {
  Stack,
  Box,
  RadioGroup,
  Radio,
  FormControlLabel,
} from '@mui/material';
import { ProjectBoardState } from "@/game";

interface Props {
  projectBoard: ProjectBoardState;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value: number;
}

const ProjectBoard: React.FC<Props> = ({ projectBoard, onChange, value }) => (
  <Stack direction="row" spacing={2}>
    <Box component='label'>Active project cards</Box>
    <RadioGroup onChange={onChange} value={value}>
      {
        projectBoard.map(activeProject => activeProject.card).map((project, index) =>
          <FormControlLabel key={`${project.name}-${index}`} value={index} control={<Radio />} label={`${project.name} ${JSON.stringify(project.requirements)}`} />)
      }
    </RadioGroup>
  </Stack>
);

export default ProjectBoard;
