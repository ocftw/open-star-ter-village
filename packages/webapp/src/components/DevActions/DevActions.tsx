import { useCallback, useState } from 'react';
import { BoardProps } from 'boardgame.io/react';
import {
  Stack,
  Button,
  Box,
  RadioGroup,
  Radio,
  FormControlLabel,
  TextField,
  Tab,
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';

const DevActions: React.FC<BoardProps<OpenStarTerVillageType.State.Root>> = (props) => {
  const { G, playerID, moves: nonTypeMoves, events, ctx } = props;
  const moves = nonTypeMoves as unknown as OpenStarTerVillageType.Move.AllMoves;

  const [tabValue, setTabValue] = useState('create-project');
  const onTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const [projectCardIndex, setProjectCardIndex] = useState(0);
  const [activeJobCardIndex, setActiveJobCardIndex] = useState(0);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [jobName, setJobName] = useState('');
  const [value, setValue] = useState(0);
  const [contributions, setContributions] = useState<{ activeProjectIndex: number; jobName: string; value: number }[]>([]);
  const onAddContribution = useCallback(() => {
    if (activeProjectIndex >= 0 && jobName !== '' && value > 0) {
      setContributions(cons => {
        return [...cons, { activeProjectIndex, jobName, value }];
      });
    }
  }, [activeProjectIndex, jobName, value]);

  if (playerID === null) {
    return null;
  }

  const onCreateProject = () => moves.createProject(projectCardIndex, activeJobCardIndex);
  const onRecruit = () => moves.recruit(activeJobCardIndex, activeProjectIndex);
  const onContributeJoinedProjects = () => {
    moves.contributeJoinedProjects(contributions);
    setContributions([]);
  };
  const onContributeOwnedProjects = () => {
    moves.contributeOwnedProjects(contributions);
    setContributions([]);
  };
  const onEndAction = () => events.endStage!();
  const onEndSettle = () => events.endStage!();
  const onRefillAndEnd = () => moves.refillAndEnd();
  const myCurrentStage = ctx.activePlayers ? ctx.activePlayers[playerID] : ''

  const renderHandProjectCards = () => (
    <Stack direction="row" spacing={2}>
      <Box component='label'>Hand project cards</Box>
      <RadioGroup onChange={event => setProjectCardIndex(parseInt(event.target.value))} value={projectCardIndex}>
        {
          G.players[playerID].hand.projects.map((project, index) =>
            <FormControlLabel key={`${project.name}-${index}`} value={index} control={<Radio />} label={`${project.name} ${JSON.stringify(project.requirements)}`} />)
        }
      </RadioGroup>
    </Stack>
  );

  const renderActiveJobCards = () => (
    <Stack direction="row" spacing={2}>
      <Box component='label'>Active job cards</Box>
      <RadioGroup onChange={event => setActiveJobCardIndex(parseInt(event.target.value))} value={activeJobCardIndex}>
        {
          G.table.activeJobs.map((job, index) =>
            <FormControlLabel key={`${job.name}-${index}`} value={index} control={<Radio />} label={job.name} />)
        }
      </RadioGroup>
    </Stack>
  );

  const renderActiveProjectCards = () => (
    <Stack direction="row" spacing={2}>
      <Box component='label'>Active project cards</Box>
      <RadioGroup onChange={event => setActiveProjectIndex(parseInt(event.target.value))} value={activeProjectIndex}>
        {
          G.table.activeProjects.map(activeProject => activeProject.card).map((project, index) =>
            <FormControlLabel key={`${project.name}-${index}`} value={index} control={<Radio />} label={`${project.name} ${JSON.stringify(project.requirements)}`} />)
        }
      </RadioGroup>
    </Stack>
  );

  const renderActiveProjectJobName = () => (
    <Stack direction="row" spacing={2}>
      <Box component='label'>Job name</Box>
      <RadioGroup onChange={event => setJobName(event.target.value)} value={jobName}>
        {
          Object.keys(G.table.activeProjects[activeProjectIndex]?.card.requirements ?? []).map((jobName) =>
            <FormControlLabel key={`${activeProjectIndex}-${jobName}`} value={jobName} control={<Radio />} label={jobName} />)
        }
      </RadioGroup>
    </Stack>
  );

  const renderValueInputBox = () => (
    <Stack direction="row" spacing={2}>
      <Box component='label'>Value</Box>
      <TextField
        type="number"
        InputProps={{ inputProps: { min: 0, max: 5 } }}
        value={value}
        onChange={event => setValue(parseInt(event.target.value))}
      />
    </Stack>
  );

  return (
    <div className='CurrentPlayer'>
      {myCurrentStage ? <div>my current stage: {myCurrentStage}</div> : null}
      {
        myCurrentStage === 'action' &&
          <TabContext value={tabValue}>
            <TabList onChange={onTabChange}>
              <Tab label="Create Project" value="create-project" />
              <Tab label="Recruit" value="recruit" />
              <Tab label="Contribute Owned Projects" value="contribute-owned-projects" />
              <Tab label="Contribute Joined Projects" value="contribute-joined-projects" />
              <Tab label="Remove and Refill Jobs" value="remove-and-refill-jobs" />
              <Tab label="Mirror" value="mirror" />
              <Button color='primary' onClick={onEndAction}>End Action</Button>
            </TabList>
            <TabPanel value="create-project">
              <Stack direction={['column', 'row']} mt={2}>
                {renderHandProjectCards()}
                {renderActiveJobCards()}
              </Stack>
              <Button onClick={onCreateProject}>Create Project</Button>
            </TabPanel>
            <TabPanel value="recruit">
              <Stack direction={['column', 'row']} mt={2}>
                {renderActiveProjectCards()}
                {renderActiveJobCards()}
              </Stack>
              <Button onClick={onRecruit}>Recruit</Button>
            </TabPanel>
            <TabPanel value="contribute-owned-projects">
              <Stack direction={['column', 'row']} mt={2}>
                {renderActiveProjectCards()}
                {renderActiveProjectJobName()}
                {renderValueInputBox()}
                <Button size='small' onClick={onAddContribution}>add contribution entity</Button>
                <Box>current contribution entities: {JSON.stringify(contributions)}</Box>
              </Stack>
              <Button onClick={onContributeOwnedProjects}>ContributeOwnedProjects</Button>
            </TabPanel>
            <TabPanel value="contribute-joined-projects">
              <Stack direction={['column', 'row']} mt={2}>
                {renderActiveProjectCards()}
                {renderActiveProjectJobName()}
                {renderValueInputBox()}
                <Button size='small' onClick={onAddContribution}>add contribution entity</Button>
                <Box>current contribution entities: {JSON.stringify(contributions)}</Box>
              </Stack>
              <Button onClick={onContributeJoinedProjects}>ContributeJoinedProjects</Button>
            </TabPanel>
            <TabPanel value="remove-and-refill-jobs">
              <Stack direction={['column', 'row']} mt={2}>
                {renderActiveJobCards()}
              </Stack>
              <Button >Remove and Refill Jobs</Button>
            </TabPanel>
            <TabPanel value="mirror">
              <Button >Mirror</Button>
            </TabPanel>
          </TabContext>
      }
      {
        myCurrentStage === 'settle' &&
          <Stack direction={['column', 'row']} mt={1}>
            <div className='group settles'>
              <Button color='primary' onClick={onEndSettle}>End Settle</Button>
            </div>
          </Stack>
      }
      {
        myCurrentStage === 'discard' &&
          <Stack direction={['column', 'row']} mt={1}>
            <div className='group discards'>
              <Button color='primary' onClick={() => events.endStage!()}>End Discard</Button>
            </div>
          </Stack>
      }
      {
        myCurrentStage === 'refill' &&
          <Stack direction={['column', 'row']} mt={1}>
            <Button color='primary' onClick={onRefillAndEnd}>Refill and End turn</Button>
          </Stack>
      }
    </div>
  );
}

export default DevActions;
