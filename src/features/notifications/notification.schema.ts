import { z } from "zod";
import { NotificationTypeEnum } from "./notification.model";

// Enum for notification types (should match your DB enum)
export const notificationTypeEnum = z.enum(NotificationTypeEnum);

// Schéma pour la création d'une notification
export const createNotificationSchema = z.object({
  user_id: z.string().uuid({ message: "user_id doit être un UUID valide." }),
  title: z
    .string()
    .min(1, "Le titre est requis.")
    .max(200, "200 caractères max."),
  message: z.string().min(1, "Le message est requis."),
  type: notificationTypeEnum,
});

// Schéma pour la mise à jour d'une notification
export const updateNotificationSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis.")
    .max(200, "200 caractères max.")
    .optional(),
  message: z.string().min(1, "Le message est requis.").optional(),
  type: notificationTypeEnum.optional(),
  is_read: z.boolean().optional(),
});

// Schéma pour l'ID de notification (UUID)
export const notificationIdSchema = z.object({
  id: z.uuid({ message: "ID de notification invalide (UUID attendu)." }),
});

// Schéma pour la récupération des notifications (filtrage, pagination)
export const getNotificationsSchema = z.object({
  user_id: z.uuid({ message: "user_id doit être un UUID valide." }).optional(),
  type: notificationTypeEnum.optional(),
  is_read: z.boolean().optional(),
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
