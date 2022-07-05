import { useCallback, useState } from 'react';
import { BoardProps } from 'boardgame.io/react';
import { OpenStarTerVillageType as Type } from 'packages/game/src/types';
import {
  Stack,
  HStack,
  Button,
  Box,
  RadioGroup,
  Radio,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
} from '@chakra-ui/react'

const CurrentPlayer: React.FC<BoardProps<Type.State.Root>> = (props) => {
  const { G, playerID, moves: nonTypeMoves, events, ctx } = props;
  const moves = nonTypeMoves as unknown as Type.Move.AllMoves;

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
    <HStack w={['100%', '100%', '20%']}>
      <Box as='label'>Hand project cards</Box>
      <RadioGroup onChange={val => setProjectCardIndex(parseInt(val))} value={projectCardIndex}>
        {
          G.players[playerID].hand.projects.map((project, index) =>
            <Radio key={`${project.name}-${index}`} value={index}>{project.name} <br /> {JSON.stringify(project.requirements)}</Radio>)
        }
      </RadioGroup>
    </HStack>
  );

  const renderActiveJobCards = () => (
    <HStack w={['100%', '100%', '20%']}>
      <Box as='label'>Active job cards</Box>
      <RadioGroup onChange={val => setActiveJobCardIndex(parseInt(val))} value={activeJobCardIndex}>
        {
          G.table.activeJobs.map((job, index) =>
            <Radio key={`${job.name}-${index}`} value={index}>{job.name}</Radio>)
        }
      </RadioGroup>
    </HStack>
  );

  const renderActiveProjectCards = () => (
    <HStack w={['100%', '100%', '20%']}>
      <Box as='label'>Active project cards</Box>
      <RadioGroup onChange={val => setActiveProjectIndex(parseInt(val))} value={activeProjectIndex}>
        {
          G.table.activeProjects.map(activeProject => activeProject.card).map((project, index) =>
            <Radio key={`${project.name}-${index}`} value={index}>{project.name} <br /> {JSON.stringify(project.requirements)}</Radio>)
        }
      </RadioGroup>
    </HStack>
  );

  const renderActiveProjectJobName = () => (
    <HStack w={['100%', '100%', '20%']}>
      <Box as='label'>Job name</Box>
      <RadioGroup onChange={setJobName} value={jobName}>
        {
          Object.keys(G.table.activeProjects[activeProjectIndex]?.card.requirements ?? []).map((jobName) =>
            <Radio key={`${activeProjectIndex}-${jobName}`} value={jobName}>{jobName}</Radio>)
        }
      </RadioGroup>
    </HStack>
  );

  const renderValueInputBox = () => (
    <HStack w={['100%', '100%', '20%']}>
      <Box as='label'>Value</Box>
      <NumberInput min={0} max={5} value={value} onChange={(_, val) => setValue(val)}>
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
    </HStack>
  );

  return (
    <div className='CurrentPlayer'>
      {myCurrentStage ? <div>my current stage: {myCurrentStage}</div> : null}
      {
        myCurrentStage === 'action' &&
        <>
          <Tabs>
            <TabList>
              <Tab>Create Project</Tab>
              <Tab>Recruit</Tab>
              <Tab>Contribute Owned Projects</Tab>
              <Tab>Contribute Joined Projects</Tab>
              <Tab>Remove and Refill Jobs</Tab>
              <Tab>Mirror</Tab>
              <Button color='red' onClick={onEndAction}>End Action</Button>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Stack direction={['column', 'row']} mt={2}>
                  {renderHandProjectCards()}
                  {renderActiveJobCards()}
                </Stack>
                <Button onClick={onCreateProject}>Create Project</Button>
              </TabPanel>
              <TabPanel>
                <Stack direction={['column', 'row']} mt={2}>
                  {renderActiveProjectCards()}
                  {renderActiveJobCards()}
                </Stack>
                <Button onClick={onRecruit}>Recruit</Button>
              </TabPanel>
              <TabPanel>
                <Stack direction={['column', 'row']} mt={2}>
                  {renderActiveProjectCards()}
                  {renderActiveProjectJobName()}
                  {renderValueInputBox()}
                  <Button size='xs' onClick={onAddContribution}>add contribution entity</Button>
                  <Box>current contribution entities: {JSON.stringify(contributions)}</Box>
                </Stack>
                <Button onClick={onContributeOwnedProjects}>ContributeOwnedProjects</Button>
              </TabPanel>
              <TabPanel>
                <Stack direction={['column', 'row']} mt={2}>
                  {renderActiveProjectCards()}
                  {renderActiveProjectJobName()}
                  {renderValueInputBox()}
                  <Button size='xs' onClick={onAddContribution}>add contribution entity</Button>
                  <Box>current contribution entities: {JSON.stringify(contributions)}</Box>
                </Stack>
                <Button onClick={onContributeJoinedProjects}>ContributeJoinedProjects</Button>
              </TabPanel>
              <TabPanel>
                <Stack direction={['column', 'row']} mt={2}>
                  {renderActiveJobCards()}
                </Stack>
                <Button >Remove and Refill Jobs</Button>
              </TabPanel>
              <TabPanel>
                <Button >Mirror</Button>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </>
      }
      {
        myCurrentStage === 'settle' &&
        <>
          <Stack direction={['column', 'row']} mt={1}>
            <div className='group settles'>
              <Button color='red' onClick={onEndSettle}>End Settle</Button>
            </div>
          </Stack>
        </>
      }
      {
        myCurrentStage === 'discard' &&
        <>
          <Stack direction={['column', 'row']} mt={1}>
            <div className='group discards'>
              <Button color='red' onClick={() => events.endStage!()}>End Discard</Button>
            </div>
          </Stack>
        </>
      }
      {
        myCurrentStage === 'refill' &&
        <>
          <Stack direction={['column', 'row']} mt={1}>
            <Button color='red' onClick={onRefillAndEnd}>Refill and End turn</Button>
          </Stack>
        </>
      }
    </div>
  );
}

export default CurrentPlayer;
