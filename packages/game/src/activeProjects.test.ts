import { ActiveProject, ActiveProjects } from "./activeProjects";
import { OpenStarTerVillageType } from "./types";

describe('ActiveProjects', () => {
  describe('Add', () => {
    it('should append a new project', () => {
      const activeProjects: OpenStarTerVillageType.State.Project[] = [];
      const card: OpenStarTerVillageType.Card.Project = { name: 'test 1', jobs: ['a', 'a', 'a', 'b', 'c', 'c'] };
      const activeProjectId = ActiveProjects.Add(activeProjects, card, 'test owner');
      expect(activeProjectId).toEqual(0);
    });
  });

  describe('GetById', () => {
    it('should return active project', () => {
      const activeProjects: OpenStarTerVillageType.State.Project[] = [];
      const card: OpenStarTerVillageType.Card.Project = { name: 'test 1', jobs: ['a', 'a', 'a', 'b', 'c', 'c'] };
      const activeProjectId = ActiveProjects.Add(activeProjects, card, 'test owner');
      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);
      expect(activeProject.card).toEqual(card);
    });
  });
});

describe('ActiveProject', () => {
  describe('AssignWorker', () => {
    it('should recored player name in worker slot', () => {
      const activeProjects: OpenStarTerVillageType.State.Project[] = [];
      const card: OpenStarTerVillageType.Card.Project = { name: 'test 1', jobs: ['a', 'a', 'a', 'b', 'c', 'c'] };
      const activeProjectId = ActiveProjects.Add(activeProjects, card, 'test owner');
      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);

      ActiveProject.AssignWorker(activeProject, 3, 'test owner');
      expect(activeProject.workers[3]).toEqual('test owner');
    });
  });

  describe('Contribute', () => {
    it('should increase value by slot and by job', () => {
      const activeProjects: OpenStarTerVillageType.State.Project[] = [];
      const card: OpenStarTerVillageType.Card.Project = { name: 'test 1', jobs: ['a', 'a', 'a', 'b', 'c', 'c'] };
      const activeProjectId = ActiveProjects.Add(activeProjects, card, 'test owner');
      const activeProject = ActiveProjects.GetById(activeProjects, activeProjectId);

      ActiveProject.Contribute(activeProject, 0, 3);

      expect(activeProject.contribution.bySlot[0]).toEqual(3);
      expect(activeProject.contribution.byJob['a']).toEqual(3);
    });
  });
});
