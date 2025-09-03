import { Router } from "express";
import { ProjectCategoriesController } from "./project-categories.controller";
import { AuthAdminMiddleware } from "../../middlewares/auth-admin.middleware";

const router = Router();
const controller = new ProjectCategoriesController();

// Créer une catégorie de projet
router.post("/", (req, res) => controller.createCategory(req, res));

// Récupérer toutes les catégories de projet
router.get("/", (req, res) => controller.getAllCategories(req, res));

// Récupérer une catégorie de projet par ID
router.get("/:id", (req, res) => controller.getCategoryById(req, res));

// Mettre à jour une catégorie de projet
router.patch("/:id", AuthAdminMiddleware, (req, res) =>
  controller.updateCategory(req, res),
);

// Supprimer une catégorie de projet
router.delete("/:id", AuthAdminMiddleware, (req, res) =>
  controller.deleteCategory(req, res),
);

export default router;
