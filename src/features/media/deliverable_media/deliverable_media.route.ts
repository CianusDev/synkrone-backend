import { Router } from "express";
import { DeliverableMediaController } from "./deliverable_media.controller";

const controller = new DeliverableMediaController();

const router = Router();

/**
 * POST /media/deliverable
 * Ajoute un média à un livrable
 */
router.post("/", (req, res) => controller.addMediaToDeliverable(req, res));

/**
 * GET /media/deliverable/:deliverableId
 * Récupère tous les médias associés à un livrable
 */
router.get("/:deliverableId", (req, res) =>
  controller.getMediaForDeliverable(req, res),
);

/**
 * DELETE /media/deliverable
 * Supprime (soft delete) la liaison entre un livrable et un média
 */
router.delete("/", (req, res) =>
  controller.removeMediaFromDeliverable(req, res),
);

/**
 * GET /media/deliverable/:deliverableId/:mediaId
 * Récupère une liaison livrable-média précise
 */
router.get("/:deliverableId/:mediaId", (req, res) =>
  controller.getDeliverableMedia(req, res),
);

export default router;
