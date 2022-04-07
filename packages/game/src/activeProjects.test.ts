import { ActiveProjects } from "./activeProjects";
import { OpenStarTerVillageType } from "./types";

describe('ActiveProjects', () => {
  describe('Add', () => {
    it('should append a new project', () => {
      const activeProjects: OpenStarTerVillageType.State.Project[] = [];
      const card: OpenStarTerVillageType.Card.Project = { name: 'test 1', jobs: ['a', 'a', 'a', 'b', 'c', 'c'] };
      const activeProjectId = ActiveProjects.Add(activeProjects, card, 'test onwer');
      expect(activeProjectId).toEqual(0);
    });
  });
});
