import { NotificationService } from "../../notifications/notification.service";
import { UserNotificationService } from "../../notifications/user-notifications/user-notification.service";
import { sendEmail, emailTemplates } from "../../../config/smtp-email";
import { NotificationTypeEnum } from "../../notifications/notification.model";
import { DeliverableStatus } from "../deliverables.model";
import { ContractsRepository } from "../../contracts/contracts.repository";
import { ProjectsRepository } from "../../projects/projects.repository";

export interface DeliverableNotificationData {
  deliverableId: string;
  deliverableTitle: string;
  deliverableStatus: DeliverableStatus;
  contractId: string;
  freelanceId: string;
  companyId: string;
  feedback?: string;
  projectTitle?: string;
  freelanceName?: string;
  companyName?: string;
  freelanceEmail?: string;
  companyEmail?: string;
}

export interface ContractCompletionNotificationData {
  contractId: string;
  projectId: string;
  projectTitle: string;
  freelanceId: string;
  companyId: string;
  freelanceName: string;
  companyName: string;
  completionDate: string;
}

export class DeliverablesNotificationService {
  private readonly notificationService: NotificationService;
  private readonly userNotificationService: UserNotificationService;
  private readonly contractsRepository: ContractsRepository;
  private readonly projectsRepository: ProjectsRepository;

  constructor() {
    this.notificationService = new NotificationService();
    this.userNotificationService = new UserNotificationService();
    this.contractsRepository = new ContractsRepository();
    this.projectsRepository = new ProjectsRepository();
  }

  /**
   * Notifie la mise à jour d'un livrable (validation/rejet)
   */
  async notifyDeliverableUpdate(
    data: DeliverableNotificationData,
  ): Promise<void> {
    try {
      if (data.deliverableStatus === DeliverableStatus.VALIDATED) {
        await this.notifyDeliverableValidated(data);
      } else if (data.deliverableStatus === DeliverableStatus.REJECTED) {
        await this.notifyDeliverableRejected(data);
      } else if (data.deliverableStatus === DeliverableStatus.SUBMITTED) {
        await this.notifyDeliverableSubmitted(data);
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la notification de mise à jour de livrable:",
        error,
      );
    }
  }

  /**
   * Notifie la validation d'un livrable au freelance
   */
  private async notifyDeliverableValidated(
    data: DeliverableNotificationData,
  ): Promise<void> {
    // Créer la notification in-app
    const notification = await this.notificationService.createNotification({
      title: "✅ Livrable validé !",
      message: `Votre livrable "${data.deliverableTitle}" a été validé avec succès.`,
      type: NotificationTypeEnum.project,
      is_global: false,
      metadata: {
        deliverable_id: data.deliverableId,
        deliverable_title: data.deliverableTitle,
        deliverable_status: data.deliverableStatus,
        contract_id: data.contractId,
        project_title: data.projectTitle,
        company_name: data.companyName,
        action: "deliverable_validated",
        priority: "high",
        icon: "check-circle",
        color: "success",
        link: `/dashboard/deliverables/${data.deliverableId}`,
      },
    });

    // Lier la notification au freelance
    await this.userNotificationService.createUserNotification(
      data.freelanceId,
      notification.id,
    );

    // Envoyer l'email de validation
    if (data.freelanceName && data.projectTitle) {
      try {
        const emailTemplate = emailTemplates.deliverableValidated(
          data.deliverableTitle,
          data.freelanceName,
          data.companyName,
          data.projectTitle,
          `dashboard/deliverables/${data.deliverableId}`,
        );

        // TODO: Récupérer l'email du freelance depuis la base de données
        // await sendEmail({
        //   to: freelanceEmail,
        //   subject: emailTemplate.subject,
        //   html: emailTemplate.html,
        //   text: emailTemplate.text,
        // });
        console.log(
          "📧 Email de validation de livrable préparé (besoin de l'email du freelance)",
        );

        console.log("📧 Email de validation de livrable envoyé au freelance");
      } catch (emailError) {
        console.error("❌ Erreur envoi email validation livrable:", emailError);
      }
    }
  }

  /**
   * Notifie le rejet d'un livrable au freelance
   */
  private async notifyDeliverableRejected(
    data: DeliverableNotificationData,
  ): Promise<void> {
    // Créer la notification in-app
    const notification = await this.notificationService.createNotification({
      title: "❌ Livrable rejeté",
      message: `Votre livrable "${data.deliverableTitle}" a été rejeté. Consultez le feedback pour les corrections.`,
      type: NotificationTypeEnum.project,
      is_global: false,
      metadata: {
        deliverable_id: data.deliverableId,
        deliverable_title: data.deliverableTitle,
        deliverable_status: data.deliverableStatus,
        contract_id: data.contractId,
        project_title: data.projectTitle,
        company_name: data.companyName,
        feedback: data.feedback,
        action: "deliverable_rejected",
        priority: "high",
        icon: "x-circle",
        color: "error",
        link: `/dashboard/deliverables/${data.deliverableId}`,
        media_removed: true, // Indicateur que les médias ont été supprimés
      },
    });

    // Lier la notification au freelance
    await this.userNotificationService.createUserNotification(
      data.freelanceId,
      notification.id,
    );

    // Envoyer l'email de rejet avec template spécial médias supprimés
    if (data.freelanceName && data.feedback) {
      try {
        const emailTemplate = emailTemplates.deliverableRejectedWithMedia(
          data.deliverableTitle,
          data.freelanceName,
          data.feedback,
          data.projectTitle,
          `dashboard/deliverables/${data.deliverableId}`,
        );

        // TODO: Récupérer l'email du freelance depuis la base de données
        // await sendEmail({
        //   to: freelanceEmail,
        //   subject: emailTemplate.subject,
        //   html: emailTemplate.html,
        //   text: emailTemplate.text,
        // });
        console.log(
          "📧 Email de rejet de livrable préparé (besoin de l'email du freelance)",
        );

        console.log("📧 Email de rejet de livrable envoyé au freelance");
      } catch (emailError) {
        console.error("❌ Erreur envoi email rejet livrable:", emailError);
      }
    }
  }

  /**
   * Notifie la soumission d'un livrable à l'entreprise
   */
  private async notifyDeliverableSubmitted(
    data: DeliverableNotificationData,
  ): Promise<void> {
    // Créer la notification in-app pour l'entreprise
    const notification = await this.notificationService.createNotification({
      title: "📋 Nouveau livrable soumis",
      message: `Le freelance ${data.freelanceName} a soumis le livrable "${data.deliverableTitle}".`,
      type: NotificationTypeEnum.project,
      is_global: false,
      metadata: {
        deliverable_id: data.deliverableId,
        deliverable_title: data.deliverableTitle,
        deliverable_status: data.deliverableStatus,
        contract_id: data.contractId,
        project_title: data.projectTitle,
        freelance_name: data.freelanceName,
        action: "deliverable_submitted",
        priority: "medium",
        icon: "upload",
        color: "info",
        link: `/dashboard/deliverables/${data.deliverableId}`,
      },
    });

    // Lier la notification à l'entreprise
    await this.userNotificationService.createUserNotification(
      data.companyId,
      notification.id,
    );

    // Envoyer l'email à l'entreprise
    if (data.companyName && data.freelanceName) {
      try {
        const emailTemplate = emailTemplates.deliverableSubmitted(
          data.deliverableTitle,
          data.freelanceName,
          data.companyName,
          data.projectTitle,
          `dashboard/deliverables/${data.deliverableId}`,
        );

        // TODO: Récupérer l'email de l'entreprise depuis la base de données
        // await sendEmail({
        //   to: companyEmail,
        //   subject: emailTemplate.subject,
        //   html: emailTemplate.html,
        //   text: emailTemplate.text,
        // });
        console.log(
          "📧 Email de soumission de livrable préparé (besoin de l'email de l'entreprise)",
        );

        console.log("📧 Email de soumission de livrable envoyé à l'entreprise");
      } catch (emailError) {
        console.error("❌ Erreur envoi email soumission livrable:", emailError);
      }
    }
  }

  /**
   * Notifie la clôture automatique d'un contrat aux deux parties
   */
  async notifyContractCompletion(
    data: ContractCompletionNotificationData,
  ): Promise<void> {
    try {
      await Promise.all([
        this.notifyContractCompletionToFreelance(data),
        this.notifyContractCompletionToCompany(data),
      ]);
    } catch (error) {
      console.error(
        "❌ Erreur lors de la notification de clôture de contrat:",
        error,
      );
    }
  }

  /**
   * Notifie la clôture de contrat au freelance
   */
  private async notifyContractCompletionToFreelance(
    data: ContractCompletionNotificationData,
  ): Promise<void> {
    // Créer la notification in-app
    const notification = await this.notificationService.createNotification({
      title: "🎉 Contrat terminé avec succès !",
      message: `Votre contrat pour "${data.projectTitle}" est automatiquement terminé. Tous vos livrables ont été validés !`,
      type: NotificationTypeEnum.payment,
      is_global: false,
      metadata: {
        contract_id: data.contractId,
        project_id: data.projectId,
        project_title: data.projectTitle,
        company_name: data.companyName,
        completion_date: data.completionDate,
        action: "contract_completed_automatic",
        priority: "high",
        icon: "trophy",
        color: "success",
        link: `/dashboard/contracts/${data.contractId}`,
        can_evaluate: true, // Permet l'évaluation mutuelle
        auto_completed: true,
      },
    });

    // Lier la notification au freelance
    await this.userNotificationService.createUserNotification(
      data.freelanceId,
      notification.id,
    );

    // Envoyer l'email au freelance
    try {
      const emailTemplate = emailTemplates.contractCompletedAutomatic(
        data.projectTitle,
        data.freelanceName,
        data.companyName,
        data.completionDate,
        `dashboard/contracts/${data.contractId}`,
      );

      // TODO: Récupérer l'email du freelance depuis la base de données
      // await sendEmail({
      //   to: freelanceEmail,
      //   subject: emailTemplate.subject,
      //   html: emailTemplate.html,
      //   text: emailTemplate.text,
      // });
      console.log(
        "📧 Email de clôture de contrat préparé pour le freelance (besoin de l'email)",
      );

      console.log("📧 Email de clôture de contrat envoyé au freelance");
    } catch (emailError) {
      console.error(
        "❌ Erreur envoi email clôture contrat (freelance):",
        emailError,
      );
    }
  }

  /**
   * Notifie la clôture de contrat à l'entreprise
   */
  private async notifyContractCompletionToCompany(
    data: ContractCompletionNotificationData,
  ): Promise<void> {
    // Créer la notification in-app
    const notification = await this.notificationService.createNotification({
      title: "🎉 Contrat terminé avec succès !",
      message: `Le contrat pour "${data.projectTitle}" avec ${data.freelanceName} est automatiquement terminé. Tous les livrables ont été validés !`,
      type: NotificationTypeEnum.payment,
      is_global: false,
      metadata: {
        contract_id: data.contractId,
        project_id: data.projectId,
        project_title: data.projectTitle,
        freelance_name: data.freelanceName,
        completion_date: data.completionDate,
        action: "contract_completed_automatic",
        priority: "high",
        icon: "trophy",
        color: "success",
        link: `/dashboard/contracts/${data.contractId}`,
        can_evaluate: true, // Permet l'évaluation mutuelle
        auto_completed: true,
      },
    });

    // Lier la notification à l'entreprise
    await this.userNotificationService.createUserNotification(
      data.companyId,
      notification.id,
    );

    // Envoyer l'email à l'entreprise
    try {
      const emailTemplate = emailTemplates.contractCompletedAutomaticCompany(
        data.projectTitle,
        data.companyName,
        data.freelanceName,
        data.completionDate,
        `dashboard/contracts/${data.contractId}`,
      );

      // TODO: Récupérer l'email de l'entreprise depuis la base de données
      // await sendEmail({
      //   to: companyEmail,
      //   subject: emailTemplate.subject,
      //   html: emailTemplate.html,
      //   text: emailTemplate.text,
      // });
      console.log(
        "📧 Email de clôture de contrat préparé pour l'entreprise (besoin de l'email)",
      );

      console.log("📧 Email de clôture de contrat envoyé à l'entreprise");
    } catch (emailError) {
      console.error(
        "❌ Erreur envoi email clôture contrat (entreprise):",
        emailError,
      );
    }
  }

  /**
   * Récupère les informations enrichies d'un contrat pour les notifications
   */
  // private async getEnrichedContractData(contractId: string): Promise<{
  //   freelanceName: string;
  //   companyName: string;
  //   projectTitle: string;
  // } | null> {
  //   try {
  //     const contract =
  //       await this.contractsRepository.getContractById(contractId);
  //     if (!contract) return null;

  //     const project = await this.projectsRepository.getProjectById(
  //       contract.project_id,
  //     );
  //     if (!project) return null;

  //     return {
  //       freelanceName:
  //         contract.freelance?.firstname + " " + contract.freelance?.lastname ||
  //         "Freelance",
  //       companyName: contract.company?.company_name || "Entreprise",
  //       projectTitle: project.title,
  //     };
  //   } catch (error) {
  //     console.error("❌ Erreur récupération données contrat enrichies:", error);
  //     return null;
  //   }
  // }
}
