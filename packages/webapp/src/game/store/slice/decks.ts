import { EventCard, ForceCard, JobCard, ProjectCard } from "./card";
import DeckSlice, { Deck } from "./deck";

export type Decks = {
  projects: Deck<ProjectCard>;
  jobs: Deck<JobCard>;
  forces: Deck<ForceCard>;
  events: Deck<EventCard>;
};

const initialState = (): Decks => ({
  projects: DeckSlice.initialState<ProjectCard>(),
  jobs: DeckSlice.initialState<JobCard>(),
  forces: DeckSlice.initialState<ForceCard>(),
  events: DeckSlice.initialState<EventCard>(),
});

const DecksSlice = {
  initialState,
};

export default DecksSlice;
