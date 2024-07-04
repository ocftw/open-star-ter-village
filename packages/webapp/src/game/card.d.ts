export type BaseCard = { name: string };

export type ProjectCard = BaseCard & {
  requirements: Record<JobName, number>;
};

export type JobCard = BaseCard;
export type JobName = string;

export type EventCard = BaseCard;
