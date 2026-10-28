import rawEvents from '../data/card/events.json';
import { STANDARD_EVENTS } from '../standard/events';
import { initialState, runGame } from './runner';
import { createProfileBot } from './profileBot';
import { BALANCED } from './profiles';

const events = [...rawEvents.filter(event => event.type !== 'last_round'), ...STANDARD_EVENTS,
  { function_name: 'digital_minister' }];
const cases = [2, 3, 4].flatMap(numPlayers => events.map(event => ({ numPlayers, forcedFirstEvent: event.function_name })));

test.each(cases)('forced opener permits a complete authoritative game: %j', ({ numPlayers, forcedFirstEvent }) => {
  const seed = `opener-${numPlayers}-${forcedFirstEvent}`;
  const first = initialState(numPlayers, seed, undefined, undefined, forcedFirstEvent);
  expect(first.G.table.eventSlot?.function_name).toBe(forcedFirstEvent);
  const run = runGame({ numPlayers, seed, forcedFirstEvent, bots: createProfileBot(BALANCED) });
  expect(run.state.ctx.gameover).toBeDefined();
  expect(run.state.G.standard!.round).toBe(9 - numPlayers);
  expect(Array.from(new Set(run.moves.filter(move => move.round === 1 && move.move !== 'resolveStandardChoice').map(move => move.playerID))))
    .toEqual(Array.from({ length: numPlayers }, (_, i) => String(i)));
});
