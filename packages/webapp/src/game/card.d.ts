export type ProjectName = string;
export type ProjectCard = {
  id: string;
  name: ProjectName;
  type: string;
  difficulty: number;
  description: string;
  requirements: Record<JobName, number>;
};

export type JobCard = {
  id: string;
  name: JobName;
};
export type JobName = string;

export type EventName = string;
export type EventFunctionName = string;
export type EventCard = {
  id: string;
  name: EventName;
  description: string;
  function_name: EventFunctionName;
  type: string;
};
