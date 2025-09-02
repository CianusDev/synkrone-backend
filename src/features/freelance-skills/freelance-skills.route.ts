import { RequestHandler, Router } from "express";
import { FreelanceSkillsController } from "./freelance-skills.controller";
import { AuthFreelanceMiddleware } from "../../middlewares/auth-freelance.middleware";
const router = Router();
const controller = new FreelanceSkillsController();

const handleCreateFreelanceSkills: RequestHandler = async (req, res) => {
  await controller.createFreelanceSkills(req, res);
};

// Associer une compétence à un freelance (POST)
router.post("/", AuthFreelanceMiddleware, handleCreateFreelanceSkills);

// Récupérer les compétences d'un freelance (GET)
router.get("/", AuthFreelanceMiddleware, (req, res) =>
  controller.getFreelanceSkillsByFreelanceId(req, res),
);

// Supprimer une compétence d'un freelance (DELETE)
router.delete("/:id", AuthFreelanceMiddleware, (req, res) =>
  controller.deleteFreelanceSkills(req, res),
);

export default router;
