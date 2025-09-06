import { z } from "zod";
import { NotificationTypeEnum } from "./notification.model";

// Enum for notification types (should match your DB enum)
export const notificationTypeEnum = z.enum(NotificationTypeEnum);

// Schéma pour la création d'une notification (admin)
// user_id supprimé, ajout de is_global
export const createNotificationSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis.")
    .max(200, "200 caractères max."),
  message: z.string().min(1, "Le message est requis."),
  type: notificationTypeEnum,
  is_global: z.boolean().default(false),
});

// Schéma pour la mise à jour d'une notification (admin)
export const updateNotificationSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis.")
    .max(200, "200 caractères max.")
    .optional(),
  message: z.string().min(1, "Le message est requis.").optional(),
  type: notificationTypeEnum.optional(),
  is_global: z.boolean().optional(),
});

// Schéma pour l'ID de notification (UUID)
export const notificationIdSchema = z.object({
  id: z.uuid({ message: "ID de notification invalide (UUID attendu)." }),
});

// Schéma pour la récupération des notifications (filtrage, pagination, admin)
export const getNotificationsSchema = z.object({
  type: notificationTypeEnum.optional(),
  is_global: z.boolean().optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, { message: "Page invalide." })
    .optional()
    .or(z.number().int().positive().optional()),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, { message: "Limite invalide." })
    .optional()
    .or(z.number().int().positive().optional()),
});
