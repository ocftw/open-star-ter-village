'use client';
import { useCallback, useState } from 'react';
import { BoardProps } from 'boardgame.io/react';
import {
  Stack,
  Button,
  Box,
  Tab,
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { GameState } from '@/game';
import { AllMoves } from '@/game/core/type';
import HandProjectCards from './HandProjectCards';
import JobSlots from './JobSlots';
import ProjectBoard from './ProjectBoard';
import ContributionValueInputBox from './ContributionValueInputBox';

const DevActions: React.FC<BoardProps<GameState>> = (props) => {
  const { G, playerID, moves: nonTypeMoves, events, ctx } = props;
  const moves = nonTypeMoves as unknown as AllMoves;

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
                <HandProjectCards
                  projects={G.players[playerID].hand.projects}
                  onChange={event => setProjectCardIndex(parseInt(event.target.value))}
                  value={projectCardIndex}
                />
                <JobSlots
                  jobSlots={G.table.jobSlots}
                  onChange={event => setActiveJobCardIndex(parseInt(event.target.value))}
                  value={activeJobCardIndex}
                />
              </Stack>
              <Button onClick={onCreateProject}>Create Project</Button>
            </TabPanel>
            <TabPanel value="recruit">
              <Stack direction={['column', 'row']} mt={2}>
                <ProjectBoard
                  projectBoard={G.table.projectBoard}
                  onProjectSlotChange={event => setActiveProjectIndex(parseInt(event.target.value))}
                  projectValue={activeProjectIndex}
                  onJobNameChange={event => setJobName(event.target.value)}
                  jobNameValue={jobName}
                />
                <JobSlots
                  jobSlots={G.table.jobSlots}
                  onChange={event => setActiveJobCardIndex(parseInt(event.target.value))}
                  value={activeJobCardIndex}
                />
              </Stack>
              <Button onClick={onRecruit}>Recruit</Button>
            </TabPanel>
            <TabPanel value="contribute-owned-projects">
              <Stack direction={['column', 'row']} mt={2}>
                <ProjectBoard
                  projectBoard={G.table.projectBoard}
                  onProjectSlotChange={event => setActiveProjectIndex(parseInt(event.target.value))}
                  projectValue={activeProjectIndex}
                  onJobNameChange={event => setJobName(event.target.value)}
                  jobNameValue={jobName}
                />
                <ContributionValueInputBox
                  value={value}
                  onChange={event => setValue(parseInt(event.target.value))}
                />
                <Button size='small' onClick={onAddContribution}>add contribution entity</Button>
                <Box>current contribution entities: {JSON.stringify(contributions)}</Box>
              </Stack>
              <Button onClick={onContributeOwnedProjects}>ContributeOwnedProjects</Button>
            </TabPanel>
            <TabPanel value="contribute-joined-projects">
              <Stack direction={['column', 'row']} mt={2}>
                <ProjectBoard
                  projectBoard={G.table.projectBoard}
                  onProjectSlotChange={event => setActiveProjectIndex(parseInt(event.target.value))}
                  projectValue={activeProjectIndex}
                  onJobNameChange={event => setJobName(event.target.value)}
                  jobNameValue={jobName}
                />
                <ContributionValueInputBox
                  value={value}
                  onChange={event => setValue(parseInt(event.target.value))}
                />
                <Button size='small' onClick={onAddContribution}>add contribution entity</Button>
                <Box>current contribution entities: {JSON.stringify(contributions)}</Box>
              </Stack>
              <Button onClick={onContributeJoinedProjects}>ContributeJoinedProjects</Button>
            </TabPanel>
            <TabPanel value="remove-and-refill-jobs">
              <Stack direction={['column', 'row']} mt={2}>
                <JobSlots
                  jobSlots={G.table.jobSlots}
                  onChange={event => setActiveJobCardIndex(parseInt(event.target.value))}
                  value={activeJobCardIndex}
                />
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
