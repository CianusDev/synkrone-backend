import { sendEmail, emailTemplates } from "../../config/smtp-email";
import { Contract, ContractStatus } from "./contracts.model";
import { ContractsRepository } from "./contracts.repository";
import { FreelanceRepository } from "../freelance/freelance.repository";
import { CompanyRepository } from "../company/company.repository";
import { ProjectsRepository } from "../projects/projects.repository";

export class ContractsNotificationService {
  private readonly contractsRepository: ContractsRepository;
  private readonly freelanceRepository: FreelanceRepository;
  private readonly companyRepository: CompanyRepository;
  private readonly projectsRepository: ProjectsRepository;

  constructor() {
    this.contractsRepository = new ContractsRepository();
    this.freelanceRepository = new FreelanceRepository();
    this.companyRepository = new CompanyRepository();
    this.projectsRepository = new ProjectsRepository();
  }

  /**
   * Notifie qu'un nouveau contrat a été proposé au freelance
   */
  async notifyContractProposed(contractId: string): Promise<void> {
    try {
      const contract = await this.contractsRepository.getContractById(contractId);
      if (!contract) {
        console.error("Contrat non trouvé pour la notification:", contractId);
        return;
      }

      const freelance = await this.freelanceRepository.getFreelanceById(contract.freelance_id);
      const company = await this.companyRepository.getCompanyById(contract.company_id);
      const project = await this.projectsRepository.getProjectById(contract.project_id);

      if (!freelance || !company || !project) {
        console.error("Données manquantes pour la notification de proposition de contrat");
        return;
      }

      const emailTemplate = emailTemplates.contractProposed(
        project.title,
        `${freelance.firstname} ${freelance.lastname}`,
        company.company_name || undefined,
        contract.created_at.toLocaleDateString('fr-FR'),
        `dashboard/contracts/${contractId}`
      );

      await sendEmail({
        to: freelance.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      console.log(`📧 Notification de proposition de contrat envoyée à ${freelance.email}`);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification de proposition de contrat:", error);
    }
  }

  /**
   * Notifie l'entreprise qu'un contrat a été accepté
   */
  async notifyContractAccepted(contractId: string): Promise<void> {
    try {
      const contract = await this.contractsRepository.getContractById(contractId);
      if (!contract) {
        console.error("Contrat non trouvé pour la notification:", contractId);
        return;
      }

      const freelance = await this.freelanceRepository.getFreelanceById(contract.freelance_id);
      const company = await this.companyRepository.getCompanyById(contract.company_id);
      const project = await this.projectsRepository.getProjectById(contract.project_id);

      if (!freelance || !company || !project) {
        console.error("Données manquantes pour la notification d'acceptation de contrat");
        return;
      }

      const emailTemplate = emailTemplates.contractAccepted(
        project.title,
        company.company_name || "Votre entreprise",
        `${freelance.firstname} ${freelance.lastname}`,
        new Date().toLocaleDateString('fr-FR'),
        `dashboard/contracts/${contractId}`
      );

      await sendEmail({
        to: company.company_email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      console.log(`📧 Notification d'acceptation de contrat envoyée à ${company.company_email}`);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification d'acceptation de contrat:", error);
    }
  }

  /**
   * Notifie l'entreprise qu'un contrat a été refusé
   */
  async notifyContractRejected(contractId: string): Promise<void> {
    try {
      const contract = await this.contractsRepository.getContractById(contractId);
      if (!contract) {
        console.error("Contrat non trouvé pour la notification:", contractId);
        return;
      }

      const freelance = await this.freelanceRepository.getFreelanceById(contract.freelance_id);
      const company = await this.companyRepository.getCompanyById(contract.company_id);
      const project = await this.projectsRepository.getProjectById(contract.project_id);

      if (!freelance || !company || !project) {
        console.error("Données manquantes pour la notification de refus de contrat");
        return;
      }

      const emailTemplate = emailTemplates.contractRejected(
        project.title,
        company.company_name || "Votre entreprise",
        `${freelance.firstname} ${freelance.lastname}`,
        new Date().toLocaleDateString('fr-FR'),
        `dashboard/contracts/${contractId}`
      );

      await sendEmail({
        to: company.company_email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      console.log(`📧 Notification de refus de contrat envoyée à ${company.company_email}`);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification de refus de contrat:", error);
    }
  }

  /**
   * Notifie le freelance qu'un contrat a été mis à jour
   */
  async notifyContractUpdated(contractId: string): Promise<void> {
    try {
      const contract = await this.contractsRepository.getContractById(contractId);
      if (!contract) {
        console.error("Contrat non trouvé pour la notification:", contractId);
        return;
      }

      const freelance = await this.freelanceRepository.getFreelanceById(contract.freelance_id);
      const company = await this.companyRepository.getCompanyById(contract.company_id);
      const project = await this.projectsRepository.getProjectById(contract.project_id);

      if (!freelance || !company || !project) {
        console.error("Données manquantes pour la notification de mise à jour de contrat");
        return;
      }

      const emailTemplate = emailTemplates.contractUpdated(
        project.title,
        `${freelance.firstname} ${freelance.lastname}`,
        company.company_name || undefined,
        new Date().toLocaleDateString('fr-FR'),
        `dashboard/contracts/${contractId}`
      );

      await sendEmail({
        to: freelance.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      console.log(`📧 Notification de mise à jour de contrat envoyée à ${freelance.email}`);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification de mise à jour de contrat:", error);
    }
  }

  /**
   * Notifie la completion automatique d'un contrat aux deux parties
   */
  async notifyContractCompletedAutomatic(contractId: string): Promise<void> {
    try {
      const contract = await this.contractsRepository.getContractById(contractId);
      if (!contract) {
        console.error("Contrat non trouvé pour la notification:", contractId);
        return;
      }

      const freelance = await this.freelanceRepository.getFreelanceById(contract.freelance_id);
      const company = await this.companyRepository.getCompanyById(contract.company_id);
      const project = await this.projectsRepository.getProjectById(contract.project_id);

      if (!freelance || !company || !project) {
        console.error("Données manquantes pour la notification de completion automatique");
        return;
      }

      const completionDate = new Date().toLocaleDateString('fr-FR');

      // Notification au freelance
      const freelanceTemplate = emailTemplates.contractCompletedAutomatic(
        project.title,
        `${freelance.firstname} ${freelance.lastname}`,
        company.company_name || undefined,
        completionDate,
        `dashboard/contracts/${contractId}`
      );

      await sendEmail({
        to: freelance.email,
        subject: freelanceTemplate.subject,
        html: freelanceTemplate.html,
        text: freelanceTemplate.text,
      });

      // Notification à l'entreprise
      const companyTemplate = emailTemplates.contractCompletedAutomaticCompany(
        project.title,
        company.company_name || "Votre entreprise",
        `${freelance.firstname} ${freelance.lastname}`,
        completionDate,
        `dashboard/contracts/${contractId}`
      );

      await sendEmail({
        to: company.company_email,
        subject: companyTemplate.subject,
        html: companyTemplate.html,
        text: companyTemplate.text,
      });

      console.log(`📧 Notifications de completion automatique envoyées aux deux parties`);
    } catch (error) {
      console.error("Erreur lors de l'envoi des notifications de completion automatique:", error);
    }
  }

  /**
   * Notifie la completion manuelle d'un contrat aux deux parties
   */
  async notifyContractCompletedManual(contractId: string): Promise<void> {
    try {
      const contract = await this.contractsRepository.getContractById(contractId);
      if (!contract) {
        console.error("Contrat non trouvé pour la notification:", contractId);
        return;
      }

      const freelance = await this.freelanceRepository.getFreelanceById(contract.freelance_id);
      const company = await this.companyRepository.getCompanyById(contract.company_id);
      const project = await this.projectsRepository.getProjectById(contract.project_id);

      if (!freelance || !company || !project) {
        console.error("Données manquantes pour la notification de completion manuelle");
        return;
      }

      const completionDate = new Date().toLocaleDateString('fr-FR');

      // Notification au freelance
      const freelanceTemplate = emailTemplates.projectCompleted(
        project.title,
        `${freelance.firstname} ${freelance.lastname}`,
        company.company_name || undefined,
        completionDate,
        `dashboard/contracts/${contractId}`
      );

      await sendEmail({
        to: freelance.email,
        subject: freelanceTemplate.subject,
        html: freelanceTemplate.html,
        text: freelanceTemplate.text,
      });

      // Notification à l'entreprise
      const companyTemplate = emailTemplates.projectCompletedCompany(
        project.title,
        company.company_name || "Votre entreprise",
        `${freelance.firstname} ${freelance.lastname}`,
        completionDate,
        `dashboard/contracts/${contractId}`
      );

      await sendEmail({
        to: company.company_email,
        subject: companyTemplate.subject,
        html: companyTemplate.html,
        text: companyTemplate.text,
      });

      console.log(`📧 Notifications de completion manuelle envoyées aux deux parties`);
    } catch (error) {
      console.error("Erreur lors de l'envoi des notifications de completion manuelle:", error);
    }
  }

  /**
   * Notifie qu'un freelance demande une modification de contrat
   */
  async notifyContractModificationRequested(contractId: string, reason?: string): Promise<void> {
    try {
      const contract = await this.contractsRepository.getContractById(contractId);
      if (!contract) {
        console.error("Contrat non trouvé pour la notification:", contractId);
        return;
      }

      const freelance = await this.freelanceRepository.getFreelanceById(contract.freelance_id);
      const company = await this.companyRepository.getCompanyById(contract.company_id);
      const project = await this.projectsRepository.getProjectById(contract.project_id);

      if (!freelance || !company || !project) {
        console.error("Données manquantes pour la notification de demande de modification");
        return;
      }

      const emailTemplate = emailTemplates.contractModificationRequested(
        project.title,
        company.company_name || "Votre entreprise",
        `${freelance.firstname} ${freelance.lastname}`,
        new Date().toLocaleDateString('fr-FR'),
        `dashboard/contracts/${contractId}`
      );

      await sendEmail({
        to: company.company_email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      console.log(`📧 Notification de demande de modification envoyée à ${company.company_email}`);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification de demande de modification:", error);
    }
  }

  /**
   * Gère les notifications selon le changement de statut
   */
  async handleStatusChangeNotifications(contractId: string, oldStatus: ContractStatus, newStatus: ContractStatus): Promise<void> {
    try {
      // Transition vers ACCEPTED (freelance accepte le contrat)
      if (oldStatus === ContractStatus.PENDING && newStatus === ContractStatus.ACTIVE) {
        await this.notifyContractAccepted(contractId);
      }

      // Transition vers REJECTED (freelance refuse le contrat)
      if (oldStatus === ContractStatus.PENDING && newStatus === ContractStatus.CANCELLED) {
        await this.notifyContractRejected(contractId);
      }

      // Transition vers COMPLETED (contrat terminé)
      if (oldStatus === ContractStatus.ACTIVE && newStatus === ContractStatus.COMPLETED) {
        await this.notifyContractCompletedAutomatic(contractId);
      }

      // Transition vers PENDING depuis DRAFT (mise à jour du contrat)
      if (oldStatus === ContractStatus.DRAFT && newStatus === ContractStatus.PENDING) {
        await this.notifyContractUpdated(contractId);
      }

    } catch (error) {
      console.error("Erreur lors de la gestion des notifications de changement de statut:", error);
    }
  }

  /**
   * Méthode utilitaire pour gérer toutes les notifications de contrat
   */
  async handleContractNotification(
    action: 'created' | 'accepted' | 'rejected' | 'updated' | 'completed_auto' | 'completed_manual' | 'modification_requested',
    contractId: string,
    additionalData?: { reason?: string; oldStatus?: ContractStatus; newStatus?: ContractStatus }
  ): Promise<void> {
    try {
      switch (action) {
        case 'created':
          await this.notifyContractProposed(contractId);
          break;
        case 'accepted':
          await this.notifyContractAccepted(contractId);
          break;
        case 'rejected':
          await this.notifyContractRejected(contractId);
          break;
        case 'updated':
          await this.notifyContractUpdated(contractId);
          break;
        case 'completed_auto':
          await this.notifyContractCompletedAutomatic(contractId);
          break;
        case 'completed_manual':
          await this.notifyContractCompletedManual(contractId);
          break;
        case 'modification_requested':
          await this.notifyContractModificationRequested(contractId, additionalData?.reason);
          break;
        default:
          console.warn(`Action de notification non reconnue: ${action}`);
      }
    } catch (error) {
      console.error(`Erreur lors de la notification de contrat (${action}):`, error);
    }
  }
}
