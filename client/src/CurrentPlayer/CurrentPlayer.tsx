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
  Divider,
  Center,
} from '@chakra-ui/react'

const CurrentPlayer: React.FC<BoardProps<Type.State.Root>> = (props) => {
  const { G, playerID, moves: nonTypeMoves, events, ctx } = props;
  const moves = nonTypeMoves as unknown as Type.Move.Moves;

  // TODO: replace indices with selected states
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
  const onSettle = () => moves.settle();
  const onEndSettle = () => events.endStage!();
  const onRefillAndEnd = () => moves.refillAndEnd();
  const myCurrentStage = ctx.activePlayers ? ctx.activePlayers[playerID] : ''
  return (
    <div className='CurrentPlayer'>
      <div>I am Player {playerID}</div>
      {myCurrentStage ? <div>my current stage: {myCurrentStage}</div> : null}
      <Stack direction={['column', 'row']} mt={2}>
        <HStack w={['100%', '100%', '20%']}>
          <Box as='label'>Hand project cards</Box>
          <RadioGroup onChange={val => setProjectCardIndex(parseInt(val))} value={projectCardIndex}>
            {
              G.players[playerID].hand.projects.map((project, index) =>
                <Radio key={`${project.name}-${index}`} value={index}>{project.name} <br /> {JSON.stringify(project.requirements)}</Radio>)
            }
          </RadioGroup>
        </HStack>
      </Stack>
      <Stack direction={['column', 'row']} mt={2}>
        <HStack w={['100%', '100%', '20%']}>
          <Box as='label'>Active job cards</Box>
          <RadioGroup onChange={val => setActiveJobCardIndex(parseInt(val))} value={activeJobCardIndex}>
            {
              G.table.activeJobs.map((job, index) =>
                <Radio key={`${job.name}-${index}`} value={index}>{job.name}</Radio>)
            }
          </RadioGroup>
        </HStack>
      </Stack>
      <Stack direction={['column', 'row']} mt={2}>
        <HStack w={['100%', '100%', '20%']}>
          <Box as='label'>Active project cards</Box>
          <RadioGroup onChange={val => setActiveProjectIndex(parseInt(val))} value={activeProjectIndex}>
            {
              G.table.activeProjects.map((project, index) =>
                <Radio key={`${project.card.name}-${index}`} value={index}>{project.card.name}</Radio>)
            }
          </RadioGroup>
        </HStack>
        <Center height='50px'>
          <Divider orientation='vertical' />
        </Center>
        <HStack w={['100%', '100%', '20%']}>
          <Box as='label'>Job name</Box>
          <RadioGroup onChange={setJobName} value={jobName}>
            {
              Object.keys(G.table.activeProjects[activeProjectIndex]?.card.requirements ?? []).map((jobName) =>
                <Radio key={`${activeProjectIndex}-${jobName}`} value={jobName}>{jobName}</Radio>)
            }
          </RadioGroup>
        </HStack>
        <Center height='50px'>
          <Divider orientation='vertical' />
        </Center>
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
      </Stack>
      {
        myCurrentStage === 'action' &&
        <>
          <Stack direction={['column', 'row']} mt={1}>
            <Button size='xs' onClick={onCreateProject}>Create Project</Button>
            <Button size='xs' onClick={onRecruit}>Recruit</Button>
            <Button size='xs' onClick={onAddContribution}>add contribution entity</Button>
          </Stack>
          <Stack direction={['column', 'row']} mt={1}>
            <div>current contribution entities: {JSON.stringify(contributions)}</div>
          </Stack>
          <Stack direction={['column', 'row']} mt={1}>
            <Button size='xs' onClick={onContributeOwnedProjects}>ContributeOwnedProjects</Button>
            <Button size='xs' onClick={onContributeJoinedProjects}>ContributeJoinedProjects</Button>
            <Button size='xs' onClick={onEndAction}>End Action</Button>
          </Stack>
        </>
      }
      {
        myCurrentStage === 'settle' &&
        <>
          <Stack direction={['column', 'row']} mt={1}>
            <div className='group settles'>
              <Button size='xs' onClick={onSettle}>Settle</Button>
              <Button size='xs' onClick={onEndSettle}>End Settle</Button>
            </div>
          </Stack>
        </>
      }
      {
        myCurrentStage === 'discard' &&
        <>
          <Stack direction={['column', 'row']} mt={1}>
            <div className='group discards'>
              <Button size='xs' onClick={() => events.endStage!()}>End Discard</Button>
            </div>
          </Stack>
        </>
      }
      {
        myCurrentStage === 'refill' &&
        <>
          <Stack direction={['column', 'row']} mt={1}>
            <Button size='xs' onClick={onRefillAndEnd}>Refill and End turn</Button>
          </Stack>
        </>
      }
    </div>
  );
}

export default CurrentPlayer;
