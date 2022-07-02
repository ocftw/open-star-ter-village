import { ActiveProject, ActiveProjects } from './activeProjects';
import { OpenStarTerVillageType } from './types';

const mockJob1 = 'a';
const mockJob2 = 'b';
const mockJob3 = 'c';
const mockCard: OpenStarTerVillageType.Card.Project = {
  name: 'test 1',
  jobs: [],
  thresholds: {},
  requirements: { [mockJob1]: 5, [mockJob2]: 4, [mockJob3]: 8 },
};
const mockPlayer1 = 'test player 1';
const mockPlayer2 = 'test player 2';

describe('ActiveProjects', () => {
  describe('Add', () => {
    it('should append a new project', () => {
      const activeProjects: OpenStarTerVillageType.State.Project[] = [];

      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);

      expect(activeProjectId).toEqual(0);
    });
  });

  describe('GetById', () => {
    it('should return active project', () => {
      const activeProjects: OpenStarTerVillageType.State.Project[] = [];
      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);

      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);

      expect(activeProject.card).toEqual(mockCard);
    });
  });
});

describe('ActiveProject', () => {
  describe('New Active Project', () => {
    const testCases = [
      [mockJob1, mockPlayer1],
      [mockJob1, mockPlayer2],
      [mockJob2, mockPlayer1],
      [mockJob2, mockPlayer2],
      [mockJob3, mockPlayer1],
      [mockJob3, mockPlayer2],
    ];

    test.each(testCases)('job %s x player %s should has no worker', (mockJob, mockPlayer) => {
      const activeProjects: OpenStarTerVillageType.State.Project[] = [];

      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);

      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);
      expect(ActiveProject.HasWorker(activeProject, mockJob, mockPlayer)).toBeFalsy();
      expect(ActiveProject.GetWorkerContribution(activeProject, mockJob, mockPlayer)).toBe(0);
    });
  });

  describe('AssignWorker', () => {
    it('should store inital points', () => {
      const activeProjects: OpenStarTerVillageType.State.Project[] = [];
      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);
      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);

      const initPoints = 1;
      ActiveProject.AssignWorker(activeProject, mockJob1, mockPlayer1, initPoints);

      expect(ActiveProject.HasWorker(activeProject, mockJob1, mockPlayer1)).toBeTruthy();
      expect(ActiveProject.GetWorkerContribution(activeProject, mockJob1, mockPlayer1)).toBe(initPoints);
    });
  });

  describe('PushWorker', () => {
    it('Worker should has correct points after pushed', () => {
      const activeProjects: OpenStarTerVillageType.State.Project[] = [];
      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);
      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);
      const initPoints = 1;
      ActiveProject.AssignWorker(activeProject, mockJob1, mockPlayer1, initPoints);

      const pushedPoints = 3;
      ActiveProject.PushWorker(activeProject, mockJob1, mockPlayer1, pushedPoints);

      expect(ActiveProject.HasWorker(activeProject, mockJob1, mockPlayer1)).toBeTruthy();
      expect(ActiveProject.GetWorkerContribution(activeProject, mockJob1, mockPlayer1)).toBe(initPoints + pushedPoints);
    });

    it('should throw error when push a non assigned worker', () => {
      try {
        const activeProjects: OpenStarTerVillageType.State.Project[] = [];
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

  describe.skip('Contribute', () => {
    it('should increase value by slot and by job', () => {
      const activeProjects: OpenStarTerVillageType.State.Project[] = [];
      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);
      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);

      ActiveProject.Contribute(activeProject, 0, 3);

      expect(activeProject.contribution.bySlot[0]).toEqual(3);
      expect(activeProject.contribution.byJob['a']).toEqual(3);
    });
  });

  describe('FilterFulfilled', () => {
    it('should return fulfilled active projects', () => {
      const activeProjects: OpenStarTerVillageType.State.Project[] = [];
      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);
      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);
      ActiveProject.Contribute(activeProject, 0, 5);
      ActiveProject.Contribute(activeProject, 3, 4);
      ActiveProject.Contribute(activeProject, 4, 5);
      ActiveProject.Contribute(activeProject, 4, 3);

      const fulfilledProjects = ActiveProjects.FilterFulfilled(activeProjects);
      expect(fulfilledProjects).toHaveLength(1);
      expect(fulfilledProjects[0].card).toEqual(mockCard);
    });
  });

  describe('Remove', () => {
    const activeProjects: OpenStarTerVillageType.State.Project[] = [];
    const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer1);
    const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);
    ActiveProject.Contribute(activeProject, 0, 5);
    ActiveProject.Contribute(activeProject, 3, 4);
    ActiveProject.Contribute(activeProject, 4, 5);
    ActiveProject.Contribute(activeProject, 4, 3);
    const fulfilledProjects = ActiveProjects.FilterFulfilled(activeProjects);

    ActiveProjects.Remove(activeProjects, fulfilledProjects);

    expect(activeProjects).toHaveLength(0);
  });
});
