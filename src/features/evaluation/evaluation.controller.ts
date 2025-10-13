import { Request, Response } from "express";
import z, { ZodError } from "zod";
import { CreateEvaluationData, UserType } from "./evaluation.model";
import {
  contractIdSchema,
  createEvaluationSchema,
  evaluationFiltersSchema,
  evaluationIdSchema,
  updateEvaluationSchema,
  userIdSchema,
} from "./evaluation.schema";
import { EvaluationService } from "./evaluation.service";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

export class EvaluationController {
  private readonly service: EvaluationService;

  constructor() {
    this.service = new EvaluationService();
  }

  private handleError(error: unknown, res: Response) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        erreurs: error.issues,
      });
    }
    if (typeof error === "object" && error !== null && "message" in error) {
      return res.status(400).json({
        success: false,
        message:
          (error as { message?: string }).message || "Une erreur est survenue",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Une erreur interne est survenue",
    });
  }

  // POST /evaluations : créer une évaluation
  async createEvaluation(req: Request, res: Response) {
    try {
      const result = createEvaluationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Erreur de validation",
          erreurs: result.error.issues,
        });
      }

      const data = result.data;
      const evaluationData: CreateEvaluationData = {
        contract_id: data.contract_id,
        evaluator_id: data.evaluator_id,
        evaluated_id: data.evaluated_id,
        evaluator_type: data.evaluator_type,
        evaluated_type: data.evaluated_type,
        rating: data.rating,
        comment: data.comment,
      };

      // Modération du commentaire avec l'IA
      if (data.comment && data.comment.trim().length > 0) {
        try {
          const { object } = await generateObject({
            model: google("gemini-2.5-flash"),
            output: "object",
            schema: z.object({
              isAppropriate: z.boolean(),
              reason: z.string().optional(),
            }),
            prompt: `
            Tu es un modérateur de contenu. Ta tâche est de vérifier si ce commentaire d'évaluation est approprié et ne contient pas de contenu offensant, inapproprié ou interdit.
            Réponds uniquement par les champs demandés : "isAppropriate" (boolean) et "reason" (string optionnel pour expliquer pourquoi c'est inapproprié).
            Sois flexible mais rejette les contenus vraiment offensants, discriminatoires ou inappropriés.

            Voici le commentaire à modérer : "${data.comment}"
            `,
          });

          if (!object.isAppropriate) {
            return res.status(400).json({
              success: false,
              message: "Le commentaire contient du contenu inapproprié",
              reason:
                object.reason ||
                "Contenu non conforme aux règles de modération",
            });
          }
        } catch (moderationError) {
          console.error("Erreur lors de la modération:", moderationError);
          // En cas d'erreur de modération, on continue sans bloquer
        }
      }

      const evaluation = await this.service.createEvaluation(evaluationData);

      res.status(201).json({
        success: true,
        data: evaluation,
        message: "Évaluation créée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /evaluations/:id : récupérer une évaluation par ID
  async getEvaluationById(req: Request, res: Response) {
    try {
      const { id } = evaluationIdSchema.parse(req.params);
      const evaluation = await this.service.getEvaluationById(id);

      if (!evaluation) {
        return res.status(404).json({
          success: false,
          message: "Évaluation non trouvée",
        });
      }

      res.status(200).json({
        success: true,
        data: evaluation,
        message: "Évaluation récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /evaluations/:id : mettre à jour une évaluation
  async updateEvaluation(req: Request, res: Response) {
    try {
      const { id } = evaluationIdSchema.parse(req.params);
      const validatedData = updateEvaluationSchema.parse(req.body);

      // Récupérer l'ID et le type de l'utilisateur depuis le middleware d'auth
      const evaluatorId = (req as any).user?.id;
      const evaluatorType = (req as any).user?.type;

      if (!evaluatorId || !evaluatorType) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const updatedEvaluation = await this.service.updateEvaluation(
        id,
        validatedData,
        evaluatorId,
        evaluatorType as UserType,
      );

      if (!updatedEvaluation) {
        return res.status(404).json({
          success: false,
          message: "Évaluation non trouvée ou non modifiable",
        });
      }

      res.status(200).json({
        success: true,
        data: updatedEvaluation,
        message: "Évaluation mise à jour avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // DELETE /evaluations/:id : supprimer une évaluation
  async deleteEvaluation(req: Request, res: Response) {
    try {
      const { id } = evaluationIdSchema.parse(req.params);

      // Récupérer l'ID et le type de l'utilisateur depuis le middleware d'auth
      const evaluatorId = (req as any).user?.id;
      const evaluatorType = (req as any).user?.type;

      if (!evaluatorId || !evaluatorType) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const deleted = await this.service.deleteEvaluation(
        id,
        evaluatorId,
        evaluatorType as UserType,
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Évaluation non trouvée ou déjà supprimée",
        });
      }

      res.status(200).json({
        success: true,
        message: "Évaluation supprimée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // POST /evaluations/filter : filtrer les évaluations
  async filterEvaluations(req: Request, res: Response) {
    try {
      const filters = evaluationFiltersSchema.parse(req.body);
      const result = await this.service.getEvaluationsWithFilters(filters);

      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message: "Liste des évaluations filtrée récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /evaluations/user/:userId/stats : récupérer les statistiques d'un utilisateur
  async getUserEvaluationStats(req: Request, res: Response) {
    try {
      const { userId } = userIdSchema.parse(req.params);
      const userType = req.query.userType as string;

      // Valider le userType s'il est fourni
      let finalUserType: UserType;
      if (userType) {
        if (userType !== UserType.FREELANCE && userType !== UserType.COMPANY) {
          return res.status(400).json({
            success: false,
            message: "Type d'utilisateur invalide",
          });
        }
        finalUserType = userType as UserType;
      } else {
        // Par défaut, essayer de déduire ou utiliser freelance
        finalUserType = UserType.FREELANCE;
      }

      const stats = await this.service.getUserEvaluationStats(
        userId,
        finalUserType,
      );

      if (!stats) {
        return res.status(404).json({
          success: false,
          message: "Aucune statistique trouvée pour cet utilisateur",
        });
      }

      res.status(200).json({
        success: true,
        data: stats,
        message: "Statistiques d'évaluation récupérées avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /evaluations/user/:userId/given : récupérer les évaluations données par un utilisateur
  async getEvaluationsByEvaluator(req: Request, res: Response) {
    try {
      const { userId } = userIdSchema.parse(req.params);
      const filters = evaluationFiltersSchema.parse(req.query);

      const userType = (req as any).user?.type as UserType;
      if (!userType) {
        return res.status(401).json({
          success: false,
          message: "Type d'utilisateur non défini",
        });
      }

      const result = await this.service.getEvaluationsByEvaluator(
        userId,
        userType,
        filters.page || 1,
        filters.limit || 10,
      );

      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message: "Évaluations données récupérées avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /evaluations/user/:userId/received : récupérer les évaluations reçues par un utilisateur
  async getEvaluationsByEvaluated(req: Request, res: Response) {
    try {
      const { userId } = userIdSchema.parse(req.params);
      const filters = evaluationFiltersSchema.parse(req.query);

      const userType = (req as any).user?.type as UserType;
      if (!userType) {
        return res.status(401).json({
          success: false,
          message: "Type d'utilisateur non défini",
        });
      }

      const result = await this.service.getEvaluationsByEvaluated(
        userId,
        userType,
        filters.page || 1,
        filters.limit || 10,
      );

      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message: "Évaluations reçues récupérées avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /evaluations/contract/:contractId : récupérer les évaluations d'un contrat
  async getEvaluationsByContract(req: Request, res: Response) {
    try {
      const { contractId } = contractIdSchema.parse(req.params);
      const evaluations =
        await this.service.getEvaluationsByContract(contractId);

      res.status(200).json({
        success: true,
        data: evaluations,
        total: evaluations.length,
        message: "Évaluations du contrat récupérées avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /evaluations/contract/:contractId/can-evaluate : vérifier si l'utilisateur peut évaluer
  async canUserEvaluate(req: Request, res: Response) {
    try {
      const { contractId } = contractIdSchema.parse(req.params);

      const evaluatorId = (req as any).user?.id;
      const evaluatorType = (req as any).user?.userType;

      console.log({ user: (req as any).user, evaluatorId, evaluatorType });
      if (!evaluatorId || !evaluatorType) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const result = await this.service.canUserEvaluate(
        contractId,
        evaluatorId,
        evaluatorType as UserType,
      );

      res.status(200).json({
        success: true,
        data: result,
        message: result.canEvaluate
          ? "L'utilisateur peut évaluer"
          : "L'utilisateur ne peut pas évaluer",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /evaluations/user/:userId/summary : récupérer un résumé complet des évaluations
  async getUserEvaluationSummary(req: Request, res: Response) {
    try {
      const { userId } = userIdSchema.parse(req.params);
      const userType = (req as any).user?.type as UserType;

      if (!userType) {
        return res.status(401).json({
          success: false,
          message: "Type d'utilisateur non défini",
        });
      }

      const summary = await this.service.getUserEvaluationSummary(
        userId,
        userType,
      );

      res.status(200).json({
        success: true,
        data: summary,
        message: "Résumé des évaluations récupéré avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
