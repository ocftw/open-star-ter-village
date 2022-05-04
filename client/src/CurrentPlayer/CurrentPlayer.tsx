import { useCallback, useState } from 'react';
import { BoardProps } from 'boardgame.io/react';
import { OpenStarTerVillageType as Type } from 'packages/game/src/types';
import { FormLabel, Input, Flex, Button, Box, UnorderedList, ListItem } from '@chakra-ui/react'

const CurrentPlayer: React.FC<BoardProps<Type.State.Root>> = (props) => {
  const { G, playerID, moves: nonTypeMoves, events, ctx } = props;
  const moves = nonTypeMoves as unknown as Type.Move.Moves;

  // TODO: replace indices with selected states
  const [projectCardIndex, setProjectCardIndex] = useState(-1);
  const onProjectCardIndexChange: React.ChangeEventHandler<HTMLInputElement> = (event) =>
    setProjectCardIndex(parseInt(event.target.value, 10));
  const [resourceCardIndex, setResourceCardIndex] = useState(-1);
  const onResourceCardIndexChange: React.ChangeEventHandler<HTMLInputElement> = (event) =>
    setResourceCardIndex(parseInt(event.target.value, 10));
  const [activeProjectIndex, setActiveProjectIndex] = useState(-1);
  const onActiveProjectIndexChange: React.ChangeEventHandler<HTMLInputElement> = (event) =>
    setActiveProjectIndex(parseInt(event.target.value, 10));
  const [slotIndex, setSlotIndex] = useState(-1);
  const onSlotIndexChange: React.ChangeEventHandler<HTMLInputElement> = (event) =>
    setSlotIndex(parseInt(event.target.value, 10));
  const [value, setValue] = useState(-1);
  const onValueChange: React.ChangeEventHandler<HTMLInputElement> = (event) =>
    setValue(parseInt(event.target.value, 10));
  const [contributions, setContributions] = useState<{ activeProjectIndex: number; slotIndex: number; value: number }[]>([]);
  const onAddContribution = useCallback(() => {
    if (activeProjectIndex >= 0 && slotIndex >= 0 && value > 0) {
      setContributions(cons => {
        return [...cons, { activeProjectIndex, slotIndex, value }];
      });
    }
  }, [activeProjectIndex, slotIndex, value]);

  if (playerID === null) {
    return null;
  }

  const onCreateProject = () => moves.createProject(projectCardIndex, resourceCardIndex);
  const onRecruit = () => moves.recruit(resourceCardIndex, activeProjectIndex);
  const onContribute = () => {
    moves.contribute(contributions);
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
      <Flex mt={2}>
        <Flex flex='1'>
          <Box>
            <FormLabel>project card index:</FormLabel>
          </Box>
          <Box>
            <Input
              size="xs"
              type="number"
              min={-1}
              max={G.players[playerID].hand.projects.length - 1}
              value={projectCardIndex}
              onChange={onProjectCardIndexChange}
            />
          </Box>
        </Flex>
        <Flex flex='1'>
          <Box>
            <FormLabel>resource card index:</FormLabel>
          </Box>
          <Box>
            <Input
              size="xs"
              type="number"
              min={-1}
              max={G.players[playerID].hand.resources.length - 1}
              value={resourceCardIndex}
              onChange={onResourceCardIndexChange}
            />
          </Box>
        </Flex>
        <Flex flex='1'>
          <Box>
            <FormLabel>active project index:</FormLabel>
          </Box>
          <Box>
            <Input
              size="xs"
              type="number"
              min={-1}
              max={G.table.activeProjects.length - 1}
              value={activeProjectIndex}
              onChange={onActiveProjectIndexChange}
            />
          </Box>
        </Flex>
        <Flex flex='1'>
          <Box>
            <FormLabel>slot index:</FormLabel>
          </Box>
          <Box>
            <Input
              size="xs"
              type="number"
              min={-1}
              max={5}
              value={slotIndex}
              onChange={onSlotIndexChange}
            />
          </Box>
        </Flex>
        <Flex flex='1'>
          <Box>
            <FormLabel>value:</FormLabel>
          </Box>
          <Box>
            <Input
              size="xs"
              type="number"
              min={-1}
              max={3}
              value={value}
              onChange={onValueChange}
            />
          </Box>
        </Flex>
      </Flex>
      <Flex mt={1}>
        <Button size='xs' onClick={onCreateProject}>Create Project</Button>
        <Button size='xs' onClick={onRecruit}>Recruit</Button>
        <Button size='xs' onClick={onAddContribution}>add contribution entity</Button>
      </Flex>
      <Flex mt={1}>
        <div>current contribution entities: {JSON.stringify(contributions)}</div>
      </Flex>
      <Flex mt={1}>
        <Button size='xs' onClick={onContribute}>Contribute</Button>
        <Button size='xs' onClick={onEndAction}>End Action</Button>
      </Flex>
      <Flex mt={1}>
        <div className='group settles'>
          <Button size='xs' onClick={onSettle}>Settle</Button>
          <Button size='xs' onClick={onEndSettle}>End Settle</Button>
        </div>
      </Flex>
      <Flex mt={1}>
        <div className='group discards'>
          <Button size='xs' onClick={() => events.endStage!()}>End Discard</Button>
        </div>
      </Flex>
      <Flex mt={1}>
        <Button size='xs' onClick={onRefillAndEnd}>Refill and End turn</Button>
      </Flex>
      <Flex mt={1}>
        <Box>
          Project Cards:
        </Box>
        <UnorderedList>
          {
            G.players[playerID].hand.projects.map(p => (
              <ListItem>
                <span>title: {p.name}</span>
                <span>jobs: {JSON.stringify(p.jobs)}</span>
              </ListItem>))
          }
        </UnorderedList>
      </Flex>
      <Flex mt={1}>
        Resource Cards:
        <UnorderedList>
          {
            G.players[playerID].hand.resources.map(r => (
              <ListItem>
                <span>{r.name}</span>
              </ListItem>))
          }
        </UnorderedList>
      </Flex>
    </div>
  );
}

export default CurrentPlayer;
