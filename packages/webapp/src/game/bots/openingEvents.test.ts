import rawEvents from '../data/card/events.json';
import { STANDARD_EVENTS } from '../standard/events';
import { initialState, runGame } from './runner';
import { createProfileBot } from './profileBot';
import { NOVICE } from './profiles';

const events = [...rawEvents.filter(event => event.type !== 'last_round'), ...STANDARD_EVENTS,
  { function_name: 'digital_minister' }];
const cases = [2, 3, 4].flatMap(numPlayers => events.map(event => ({ numPlayers, forcedFirstEvent: event.function_name })));
const reportedExperiments = { government5: 'any' as const, completionRewards: 'difficulty' as const };

// 4-player games also use the reported difficulty-reward configuration.
test.each(cases)('forced opener permits a complete authoritative game: %j', ({ numPlayers, forcedFirstEvent }) => {
  const seed = `opener-${numPlayers}-${forcedFirstEvent}`;
  const experiments = numPlayers === 4 ? reportedExperiments : undefined;
  const first = initialState(numPlayers, seed, experiments, undefined, forcedFirstEvent);
  expect(first.G.table.eventSlot?.function_name).toBe(forcedFirstEvent);
  const run = runGame({ numPlayers, seed, forcedFirstEvent, experiments, bots: createProfileBot(NOVICE) });
  expect(run.state.ctx.gameover).toBeDefined();
  if (experiments) expect(run.state.G.standard!.experiments).toEqual(experiments);
  expect(run.state.G.standard!.choices).toEqual([]);
  expect(run.state.G.standard!.round).toBe(9 - numPlayers);
  expect(Array.from(new Set(run.moves.filter(move => move.round === 1 && move.move !== 'resolveStandardChoice').map(move => move.playerID))))
    .toEqual(Array.from({ length: numPlayers }, (_, i) => String(i)));
});
