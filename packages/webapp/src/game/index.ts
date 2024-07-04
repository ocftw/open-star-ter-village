export type { GameState } from "./store/store";
export type { BaseCard, EventCard, JobCard, JobName, ProjectCard } from "./card";
export type { Deck as DeckState } from './store/slice/deck';
export type { Decks as DecksState } from './store/slice/decks';
export type { ActionSlot as ActionSlotState } from './store/slice/actionSlot';
export type { ActionSlots as ActionSlotsState } from './store/slice/actionSlots';
export type { ProjectSlot as ProjectSlotState } from './store/slice/projectSlot/projectSlot';
export type { ProjectBoard as ProjectBoardState } from './store/slice/projectBoard';
export type { ScoreBoard as ScoreBoardState } from './store/slice/scoreBoard';
export type { JobSlots as JobSlotsState } from './store/slice/jobSlots';
export type { EventSlot as EventSlotState } from './store/slice/table';
export type { Table as TableState } from './store/slice/table';
export type { Player as PlayerState, Players as PlayersState } from './store/slice/players';

export { OpenStarTerVillage as default } from "./game";
