import { Request, Response } from "express";
import { ContractsService } from "./contracts.service";
import {
  createContractSchema,
  updateContractSchema,
  updateContractStatusSchema,
  contractIdSchema,
  filterContractsSchema,
  freelanceIdParamSchema,
  companyIdParamSchema,
  projectIdParamSchema,
} from "./contracts.schema";
import { ZodError } from "zod";
import { ContractStatus, CreateContractData } from "./contracts.model";

export class ContractsController {
  private readonly service: ContractsService;

  constructor() {
    this.service = new ContractsService();
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
    return res.status(400).json({
      success: false,
      message: "Une erreur est survenue",
    });
  }

  // POST /contracts : créer un contrat
  async createContract(req: Request, res: Response) {
    try {
      const result = createContractSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Erreur de validation",
          erreurs: result.error.issues,
        });
      }
      const data = result.data;
      const contractData: CreateContractData = {
        application_id: data.application_id,
        project_id: data.project_id,
        freelance_id: data.freelance_id,
        company_id: data.company_id,
        payment_mode: data.payment_mode,
        total_amount: data.total_amount,
        tjm: data.tjm,
        estimated_days: data.estimated_days,
        terms: data.terms ?? undefined,
        start_date: data.start_date ?? undefined,
        end_date: data.end_date ?? undefined,
        status: data.status,
      };
      const contract = await this.service.createContract(contractData);
      res.status(201).json({
        success: true,
        data: contract,
        message: "Contrat créé avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /contracts/:id : récupérer un contrat par ID
  async getContractById(req: Request, res: Response) {
    try {
      const { id } = contractIdSchema.parse(req.params);
      const contract = await this.service.getContractById(id);
      if (!contract) {
        return res.status(404).json({
          success: false,
          message: "Contrat non trouvé",
        });
      }
      res.status(200).json({
        success: true,
        data: contract,
        message: "Contrat récupéré avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /contracts/freelance/:freelanceId : contrats d'un freelance (pagination, filtres)
  async getContractsByFreelanceId(req: Request, res: Response) {
    try {
      const { freelanceId } = freelanceIdParamSchema.parse(req.params);
      const filters = filterContractsSchema.parse({
        ...req.query,
        freelanceId,
      });
      if (
        filters.status === ContractStatus.DRAFT ||
        filters.status === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "Le statut 'draft' n'est pas autorisé pour les freelances",
        });
      }
      const result = await this.service.getContractsByFreelanceId(
        filters.freelanceId!,
        filters.page,
        filters.limit,
        {
          status: filters.status,
          paymentMode: filters.paymentMode,
        },
      );
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message: "Liste des contrats du freelance récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /contracts/company/:companyId : contrats d'une entreprise (pagination, filtres)
  async getContractsByCompanyId(req: Request, res: Response) {
    try {
      const { companyId } = companyIdParamSchema.parse(req.params);
      const filters = filterContractsSchema.parse({
        ...req.query,
        companyId,
      });
      const result = await this.service.getContractsByCompanyId(
        filters.companyId!,
        filters.page,
        filters.limit,
        {
          status: filters.status,
          paymentMode: filters.paymentMode,
        },
      );
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message: "Liste des contrats de l'entreprise récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /contracts/project/:projectId : contrats d'un projet (pagination, filtres)
  async getContractsByProjectId(req: Request, res: Response) {
    try {
      const { projectId } = projectIdParamSchema.parse(req.params);
      const filters = filterContractsSchema.parse({
        ...req.query,
        projectId,
      });
      const result = await this.service.getContractsByProjectId(
        filters.projectId!,
        filters.page,
        filters.limit,
        {
          status: filters.status,
          paymentMode: filters.paymentMode,
        },
      );
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message: "Liste des contrats du projet récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /contracts/:id/status : mettre à jour le statut d'un contrat
  async updateContractStatus(req: Request, res: Response) {
    try {
      const { id } = contractIdSchema.parse(req.params);
      const { status } = updateContractStatusSchema.parse(req.body);
      const updated = await this.service.updateContractStatus(
        id,
        status as ContractStatus,
      );
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Contrat non trouvé ou statut non mis à jour",
        });
      }
      res.status(200).json({
        success: true,
        data: updated,
        message: "Statut du contrat mis à jour avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // DELETE /contracts/:id : supprimer un contrat
  async deleteContract(req: Request, res: Response) {
    try {
      const { id } = contractIdSchema.parse(req.params);
      const deleted = await this.service.deleteContract(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Contrat non trouvé ou déjà supprimé",
        });
      }
      res.status(200).json({
        success: true,
        message: "Contrat supprimé avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // POST /contracts/filter : filtrer les contrats (pagination, filtres dans le body)
  async filterContracts(req: Request, res: Response) {
    try {
      const params = filterContractsSchema.parse(req.body);
      const result = await this.service.getContractsWithFilters(params);
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message: "Liste des contrats filtrée récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /contracts/:id : modifier un contrat (entreprise uniquement, statut draft)
  async updateContract(req: Request, res: Response) {
    try {
      const { id } = contractIdSchema.parse(req.params);
      const validatedData = updateContractSchema.parse(req.body);
      const updated = await this.service.updateContract(id, {
        application_id: validatedData.application_id,
        project_id: validatedData.project_id,
        freelance_id: validatedData.freelance_id,
        company_id: validatedData.company_id,
        payment_mode: validatedData.payment_mode,
        total_amount: validatedData.total_amount,
        tjm: validatedData.tjm,
        estimated_days: validatedData.estimated_days,
        terms: validatedData.terms ?? undefined,
        start_date: validatedData.start_date ?? undefined,
        end_date: validatedData.end_date ?? undefined,
      });
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Contrat non trouvé ou non modifiable",
        });
      }
      res.status(200).json({
        success: true,
        data: updated,
        message: "Contrat mis à jour avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /contracts/:id/accept : accepter un contrat (freelance uniquement)
  async acceptContract(req: Request, res: Response) {
    try {
      const { id } = contractIdSchema.parse(req.params);
      const updated = await this.service.acceptContract(id);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Contrat non trouvé ou non acceptable",
        });
      }
      res.status(200).json({
        success: true,
        data: updated,
        message: "Contrat accepté avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /contracts/:id/refuse : refuser un contrat (freelance uniquement)
  async refuseContract(req: Request, res: Response) {
    try {
      const { id } = contractIdSchema.parse(req.params);
      const updated = await this.service.refuseContract(id);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Contrat non trouvé ou non refusable",
        });
      }
      res.status(200).json({
        success: true,
        data: updated,
        message: "Contrat refusé avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
