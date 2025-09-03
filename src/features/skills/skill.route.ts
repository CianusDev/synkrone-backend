import { Router } from "express";
import { SkillController } from "./skill.controller";

const router = Router();
const controller = new SkillController();

// Créer une compétence
router.post("/", (req, res) => controller.createSkill(req, res));

// Récupérer toutes les compétences
router.get("/", (req, res) => controller.getAllSkills(req, res));

// Récupérer une compétence par ID
router.get("/:id", (req, res) => controller.getSkillById(req, res));

// Mettre à jour une compétence
router.put("/:id", (req, res) => controller.updateSkill(req, res));

// Supprimer une compétence
router.delete("/:id", (req, res) => controller.deleteSkill(req, res));

export default router;
