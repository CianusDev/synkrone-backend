import { Router } from "express";
import { ProjectSkillsController } from "./project-skills.controller";
import { AuthCompanyMiddleware } from "../../middlewares/auth-company.middleware";

const router = Router();
const controller = new ProjectSkillsController();

// Appliquer le middleware d'authentification pour toutes les routes
router.use(AuthCompanyMiddleware);

// Routes pour les compétences d'un projet
router.post("/projects/:projectId/skills", (req, res) =>
  controller.addSkillToProject(req, res)
);

router.get("/projects/:projectId/skills", (req, res) =>
  controller.getSkillsByProjectId(req, res)
);

router.put("/projects/:projectId/skills", (req, res) =>
  controller.updateProjectSkills(req, res)
);

router.delete("/projects/:projectId/skills", (req, res) =>
  controller.removeAllSkillsFromProject(req, res)
);

router.delete("/projects/:projectId/skills/:skillId", (req, res) =>
  controller.removeSkillFromProject(req, res)
);

// Routes pour les projets utilisant une compétence
router.get("/skills/:skillId/projects", (req, res) =>
  controller.getProjectsBySkillId(req, res)
);

export default router;
