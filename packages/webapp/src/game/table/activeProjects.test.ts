import { ActiveProject, ActiveProjects } from './activeProjects';
import { ProjectCard } from '../cards/card';
import { Project } from './table'

const mockJob1 = 'a';
const mockJob2 = 'b';
const mockJob3 = 'c';
const mockCard: ProjectCard = {
  name: 'test 1',
  requirements: { [mockJob1]: 5, [mockJob2]: 4, [mockJob3]: 8 },
};
const mockPlayer1 = 'test player 1';
const mockPlayer2 = 'test player 2';

describe('ActiveProjects', () => {
  describe('Add', () => {
    it('should append a new project', () => {
      const activeProjects: Project[] = [];

      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);

      expect(activeProjectId).toEqual(0);
    });
  });

  describe('GetById', () => {
    it('should return active project', () => {
      const activeProjects: Project[] = [];
      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);

      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);

      expect(activeProject.card).toEqual(mockCard);
    });
  });

  describe('FilterFulfilled', () => {
    it('should return fulfilled active projects', () => {
      const activeProjects: Project[] = [];
      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);
      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);
      const initPoints = 1;
      // job 1: 1 / 5
      ActiveProject.AssignWorker(activeProject, mockJob1, mockPlayer1, initPoints);
      // job 2: 1 / 4
      ActiveProject.AssignWorker(activeProject, mockJob2, mockPlayer2, initPoints);
      // job 3: 1 / 8
      ActiveProject.AssignWorker(activeProject, mockJob3, mockPlayer1, initPoints);
      // job 3: 2 / 8
      ActiveProject.AssignWorker(activeProject, mockJob3, mockPlayer2, initPoints);
      // job 1: 5 / 5
      ActiveProject.PushWorker(activeProject, mockJob1, mockPlayer1, 4);
      // job 2: 4 / 4
      ActiveProject.PushWorker(activeProject, mockJob2, mockPlayer2, 3);
      // job 3: 6 / 8
      ActiveProject.PushWorker(activeProject, mockJob3, mockPlayer2, 4);
      // job 3: 8 / 8
      ActiveProject.PushWorker(activeProject, mockJob3, mockPlayer1, 2);

      const fulfilledProjects = ActiveProjects.FilterFulfilled(activeProjects);

      expect(fulfilledProjects).toHaveLength(1);
      expect(fulfilledProjects[0].card).toEqual(mockCard);
    });
  });

  describe('Remove', () => {
    const activeProjects: Project[] = [];
    const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);
    const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);
    // job 1: 5
    ActiveProject.AssignWorker(activeProject, mockJob1, mockPlayer1, 5);
    // job 2: 4
    ActiveProject.AssignWorker(activeProject, mockJob2, mockPlayer2, 4);
    // job 3: 8
    ActiveProject.AssignWorker(activeProject, mockJob3, mockPlayer1, 8);
    const fulfilledProjects = ActiveProjects.FilterFulfilled(activeProjects);

    ActiveProjects.Remove(activeProjects, fulfilledProjects);

    expect(activeProjects).toHaveLength(0);
  });
});

describe('ActiveProject', () => {
  describe('New Active Project', () => {
    test.each([
      [mockJob1, mockPlayer1],
      [mockJob1, mockPlayer2],
      [mockJob2, mockPlayer1],
      [mockJob2, mockPlayer2],
      [mockJob3, mockPlayer1],
      [mockJob3, mockPlayer2],
    ])('job %s x player %s should has no worker', (mockJob, mockPlayer) => {
      const activeProjects: Project[] = [];

      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);

      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);
      expect(ActiveProject.HasWorker(activeProject, mockJob, mockPlayer)).toBeFalsy();
      expect(ActiveProject.GetWorkerContribution(activeProject, mockJob, mockPlayer)).toBe(0);
    });

    test.each([
      [mockJob1],
      [mockJob2],
      [mockJob3],
    ])('job %s should has no contribution', (mockJob) => {
      const activeProjects: Project[] = [];

      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);

      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);
      expect(ActiveProject.GetJobContribution(activeProject, mockJob)).toBe(0);
    });

    test.each([
      [mockPlayer1],
      [mockPlayer2],
    ])('player %s should have no contribution', (mockPlayer) => {
      const activeProjects: Project[] = [];

      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);

      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);
      expect(ActiveProject.GetPlayerContribution(activeProject, mockPlayer)).toBe(0);
    });

    test('owner should have one worker token', () => {
      const activeProjects: Project[] = [];

      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);

      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);
      expect(ActiveProject.GetPlayerWorkerTokens(activeProject, mockPlayer1)).toBe(1);
    });

    test('the other players should have NO worker token', () => {
      const activeProjects: Project[] = [];

      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);

      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);
      expect(ActiveProject.GetPlayerWorkerTokens(activeProject, mockPlayer2)).toBe(0);
    });
  });

  describe('AssignWorker', () => {
    it('should store inital points', () => {
      const activeProjects: Project[] = [];
      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);
      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);

      const initPoints = 1;
      ActiveProject.AssignWorker(activeProject, mockJob1, mockPlayer1, initPoints);

      expect(ActiveProject.HasWorker(activeProject, mockJob1, mockPlayer1)).toBeTruthy();
      expect(ActiveProject.GetWorkerContribution(activeProject, mockJob1, mockPlayer1)).toBe(initPoints);
      expect(ActiveProject.GetJobContribution(activeProject, mockJob1)).toBe(initPoints);
      expect(ActiveProject.GetPlayerContribution(activeProject, mockPlayer1)).toBe(initPoints);
    });

    it('should store each initial points on same job from different players', () => {
      const activeProjects: Project[] = [];
      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);
      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);

      const initPoints = 1;
      ActiveProject.AssignWorker(activeProject, mockJob1, mockPlayer1, initPoints);
      ActiveProject.AssignWorker(activeProject, mockJob1, mockPlayer2, initPoints);

      expect(ActiveProject.HasWorker(activeProject, mockJob1, mockPlayer1)).toBeTruthy();
      expect(ActiveProject.HasWorker(activeProject, mockJob1, mockPlayer2)).toBeTruthy();
      expect(ActiveProject.GetWorkerContribution(activeProject, mockJob1, mockPlayer1)).toBe(initPoints);
      expect(ActiveProject.GetWorkerContribution(activeProject, mockJob1, mockPlayer2)).toBe(initPoints);
      expect(ActiveProject.GetJobContribution(activeProject, mockJob1)).toBe(initPoints + initPoints);
      expect(ActiveProject.GetPlayerContribution(activeProject, mockPlayer1)).toBe(initPoints);
      expect(ActiveProject.GetPlayerContribution(activeProject, mockPlayer2)).toBe(initPoints);
    });

    it('should store each initial points on different job from the same player', () => {
      const activeProjects: Project[] = [];
      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);
      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);

      const initPoints = 1;
      ActiveProject.AssignWorker(activeProject, mockJob1, mockPlayer1, initPoints);
      ActiveProject.AssignWorker(activeProject, mockJob2, mockPlayer1, initPoints);

      expect(ActiveProject.HasWorker(activeProject, mockJob1, mockPlayer1)).toBeTruthy();
      expect(ActiveProject.HasWorker(activeProject, mockJob2, mockPlayer1)).toBeTruthy();
      expect(ActiveProject.GetWorkerContribution(activeProject, mockJob1, mockPlayer1)).toBe(initPoints);
      expect(ActiveProject.GetWorkerContribution(activeProject, mockJob2, mockPlayer1)).toBe(initPoints);
      expect(ActiveProject.GetJobContribution(activeProject, mockJob1)).toBe(initPoints);
      expect(ActiveProject.GetJobContribution(activeProject, mockJob2)).toBe(initPoints);
      expect(ActiveProject.GetPlayerContribution(activeProject, mockPlayer1)).toBe(initPoints + initPoints);
    });

    it('should use one job token', () => {
      const activeProjects: Project[] = [];

      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);
      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);
      const initPoints = 1;
      ActiveProject.AssignWorker(activeProject, mockJob1, mockPlayer1, initPoints);
      ActiveProject.AssignWorker(activeProject, mockJob1, mockPlayer2, initPoints);

      const ownerToken = 1;
      const jobToken = 1;
      expect(ActiveProject.GetPlayerWorkerTokens(activeProject, mockPlayer1)).toBe(ownerToken + jobToken);
      expect(ActiveProject.GetPlayerWorkerTokens(activeProject, mockPlayer2)).toBe(jobToken);
    });
  });

  describe('PushWorker', () => {
    it('Worker should has correct points after pushed', () => {
      const activeProjects: Project[] = [];
      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);
      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);
      const initPoints = 1;
      ActiveProject.AssignWorker(activeProject, mockJob1, mockPlayer1, initPoints);

      const pushedPoints = 3;
      ActiveProject.PushWorker(activeProject, mockJob1, mockPlayer1, pushedPoints);

      expect(ActiveProject.HasWorker(activeProject, mockJob1, mockPlayer1)).toBeTruthy();
      expect(ActiveProject.GetWorkerContribution(activeProject, mockJob1, mockPlayer1)).toBe(initPoints + pushedPoints);
      expect(ActiveProject.GetJobContribution(activeProject, mockJob1)).toBe(initPoints + pushedPoints);
      expect(ActiveProject.GetPlayerContribution(activeProject, mockPlayer1)).toBe(initPoints + pushedPoints);
    });

    it('should NOT increase job token usage', () => {
      const activeProjects: Project[] = [];
      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);
      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);
      const initPoints = 1;
      ActiveProject.AssignWorker(activeProject, mockJob1, mockPlayer1, initPoints);
      const workerTokensBeforeAct = ActiveProject.GetPlayerWorkerTokens(activeProject, mockPlayer1);

      const pushedPoints = 3;
      ActiveProject.PushWorker(activeProject, mockJob1, mockPlayer1, pushedPoints);

      const workerTokensAfterAct = ActiveProject.GetPlayerWorkerTokens(activeProject, mockPlayer1);
      expect(workerTokensAfterAct).toBe(workerTokensBeforeAct);
    });

    it('should throw error when push a non assigned worker', () => {
      try {
        const activeProjects: Project[] = [];
        const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);
        const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);
        const initPoints = 1;
        ActiveProject.AssignWorker(activeProject, mockJob1, mockPlayer1, initPoints);

        const pushedPoints = 3;
        ActiveProject.PushWorker(activeProject, mockJob1, mockPlayer2, pushedPoints);
        // expect raise an error
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeTruthy();
      }
    });
  });
});
