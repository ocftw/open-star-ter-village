import { ActiveProject, ActiveProjects } from "./activeProjects";
import { OpenStarTerVillageType } from "./types";

const mockCard: OpenStarTerVillageType.Card.Project = { name: 'test 1', jobs: ['a', 'a', 'a', 'b', 'c', 'c'], thresholds: { a: 5, b: 4, c: 8 } };
const mockPlayer = 'test owner';

describe('ActiveProjects', () => {
  describe('Add', () => {
    it('should append a new project', () => {
      const activeProjects: OpenStarTerVillageType.State.Project[] = [];

      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer);

      expect(activeProjectId).toEqual(0);
    });
  });

  describe('GetById', () => {
    it('should return active project', () => {
      const activeProjects: OpenStarTerVillageType.State.Project[] = [];
      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer);

      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);

      expect(activeProject.card).toEqual(mockCard);
    });
  });
});

describe('ActiveProject', () => {
  describe('AssignWorker', () => {
    it('should recored player name in worker slot', () => {
      const activeProjects: OpenStarTerVillageType.State.Project[] = [];
      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer);
      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);

      ActiveProject.AssignWorker(activeProject, 3, mockPlayer);

      expect(activeProject.workers[3]).toEqual(mockPlayer);
    });
  });

  describe('Contribute', () => {
    it('should increase value by slot and by job', () => {
      const activeProjects: OpenStarTerVillageType.State.Project[] = [];
      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer);
      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);

      ActiveProject.Contribute(activeProject, 0, 3);

      expect(activeProject.contribution.bySlot[0]).toEqual(3);
      expect(activeProject.contribution.byJob['a']).toEqual(3);
    });
  });

  describe('FilterFulfilled', () => {
    it('should return fulfilled active projects', () => {
      const activeProjects: OpenStarTerVillageType.State.Project[] = [];
      const activeProjectId = ActiveProjects.Add(activeProjects, mockCard, mockPlayer);
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
});
