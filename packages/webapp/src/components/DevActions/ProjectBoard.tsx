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
  onProjectSlotChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  projectValue: number;
  onJobNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  jobNameValue: string;
  isJobNameSelectable?: boolean;
}

const ProjectBoard: React.FC<Props> = ({ projectBoard, onProjectSlotChange, projectValue, onJobNameChange, jobNameValue, isJobNameSelectable = false }) => (
  <Stack direction="row" spacing={2}>
    <Box component='label'>Active project cards</Box>
    <RadioGroup onChange={onProjectSlotChange} value={projectValue}>
      {
        projectBoard.map(project => project.card).map((projectCard, index) =>
          <>
            <FormControlLabel
              key={`${projectCard.name}-${index}`}
              value={index}
              control={<Radio />}
              label={projectCard.name}
            />
            Job requirements:
            {
              isJobNameSelectable && (projectValue === index) && (
                <RadioGroup onChange={onJobNameChange} value={jobNameValue}>
                {
                  Object.keys(projectCard.requirements).map((jobName) =>
                    <FormControlLabel
                      key={`${index}-${jobName}`}
                      value={jobName}
                      control={<Radio />}
                      label={`${jobName}: ${projectCard.requirements[jobName]}`}
                    />
                  )
                }
                </RadioGroup>
              )
              ||
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

export default ProjectBoard;
