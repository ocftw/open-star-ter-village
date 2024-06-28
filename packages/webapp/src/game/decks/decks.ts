import { EventCard, ForceCard, JobCard, ProjectCard } from "../cards/card";
import { Deck, newCardDeck } from "./deck";

export type Decks = {
  projects: Deck<ProjectCard>;
  jobs: Deck<JobCard>;
  forces: Deck<ForceCard>;
  events: Deck<EventCard>;
};

export const setupDecks = (projectCards: ProjectCard[], jobCards: JobCard[], forceCards: ForceCard[], eventCards: EventCard[]): Decks => {
  return {
    projects: newCardDeck<ProjectCard>(projectCards),
    jobs: newCardDeck<JobCard>(jobCards),
    forces: newCardDeck<ForceCard>(forceCards),
    events: newCardDeck<EventCard>(eventCards),
  };
}
