import { Router } from "express";
import { ProjectsController } from "./projects.controller";
import { AuthCompanyMiddleware } from "../../middlewares/auth-company.middleware";

const router = Router();
const controller = new ProjectsController();

// Liste paginée des projets avec recherche et filtres (GET)
router.get("/", (req, res) => controller.getProjects(req, res));

// Récupérer les projets de l'entreprise connectée (GET)
router.get("/my-projects", AuthCompanyMiddleware, (req, res) =>
  controller.getMyProjects(req, res),
);

// Récupérer un projet par ID
router.get("/:id", (req, res) => controller.getProjectById(req, res));

// Créer un projet
router.post("/", AuthCompanyMiddleware, (req, res) =>
  controller.createProject(req, res),
);

// Mettre à jour un projet
router.patch("/:id", AuthCompanyMiddleware, (req, res) =>
  controller.updateProject(req, res),
);

// Publier un projet
router.patch("/:id/publish", AuthCompanyMiddleware, (req, res) =>
  controller.publishProject(req, res),
);

// Supprimer un projet
router.delete("/:id", AuthCompanyMiddleware, (req, res) =>
  controller.deleteProject(req, res),
);

export default router;
