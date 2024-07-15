import {
  Stack,
  Box,
  RadioGroup,
  Radio,
  FormControlLabel,
} from '@mui/material';
import { ProjectBoardState } from "@/game";
import { ProjectSlot } from '@/game/store/slice/projectSlot/projectSlot';

interface Props {
  projectBoard: ProjectBoardState;
  onProjectSlotChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  projectValue: number;
  onJobNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  jobNameValue: string;
  isProjectSlotSelectable?: (projectSlot: ProjectSlot) => boolean;
  isJobNameSelectable?: boolean;
}

const ProjectBoard: React.FC<Props> = ({
  projectBoard,
  onProjectSlotChange,
  projectValue,
  onJobNameChange,
  jobNameValue,
  isProjectSlotSelectable = () => true,
  isJobNameSelectable = false,
}) => (
  <Stack direction="row" spacing={2}>
    <Box component='label'>Project slots</Box>
    <RadioGroup onChange={onProjectSlotChange} value={projectValue}>
      {
        projectBoard.map((project, index) =>
          (project.card !== undefined) && <>
            <FormControlLabel
              key={`${project.card.name}-${index}`}
              value={index}
              control={<Radio />}
              label={project.card.name}
              disabled={!isProjectSlotSelectable(project)}
            />
            Job requirements:
            {
              isProjectSlotSelectable(project) && isJobNameSelectable && (projectValue === index) && (
                <RadioGroup onChange={onJobNameChange} value={jobNameValue}>
                {
                  Object.keys(project.card.requirements).map((jobName) =>
                    <FormControlLabel
                      key={`${index}-${jobName}`}
                      value={jobName}
                      control={<Radio />}
                      label={`${jobName}: ${project.card!.requirements[jobName]}`}
                    />
                  )
                }
                </RadioGroup>
              )
              ||
              Object.keys(project.card.requirements).map(jobName => (
                <Box
                  key={`${project.card!.name}-${jobName}`}
                  component='label'
                >
                  {jobName}: {project.card!.requirements[jobName]}
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
