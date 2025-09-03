import { Router } from "express";
import { CategorySkillController } from "./category-skill.controller";

const router = Router();
const controller = new CategorySkillController();

// Créer une catégorie de compétence
router.post("/", (req, res) => controller.createCategorySkill(req, res));

// Récupérer toutes les catégories de compétence
router.get("/", (req, res) => controller.getAllCategorySkills(req, res));

// Récupérer une catégorie de compétence par ID
router.get("/:id", (req, res) => controller.getCategorySkillById(req, res));

// Récupérer une catégorie de compétence par slug
router.get("/slug/:slug", (req, res) =>
  controller.getCategorySkillBySlug(req, res),
);

// Mettre à jour une catégorie de compétence
router.patch("/:id", (req, res) => controller.updateCategorySkill(req, res));

// Supprimer une catégorie de compétence
router.delete("/:id", (req, res) => controller.deleteCategorySkill(req, res));

export default router;
