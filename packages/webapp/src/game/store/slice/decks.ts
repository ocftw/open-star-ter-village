import { EventCard, JobCard, ProjectCard } from "../../card";
import DeckSlice, { Deck } from "./deck";

export type Decks = {
  projects: Deck<ProjectCard>;
  jobs: Deck<JobCard>;
  events: Deck<EventCard>;
};

const initialState = (): Decks => ({
  projects: DeckSlice.initialState<ProjectCard>(),
  jobs: DeckSlice.initialState<JobCard>(),
  events: DeckSlice.initialState<EventCard>(),
});

const DecksSlice = {
  initialState,
};

export default DecksSlice;
