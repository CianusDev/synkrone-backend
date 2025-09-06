import { z } from "zod";

// Schéma pour l'ID de user_notification (UUID)
export const userNotificationIdSchema = z.object({
  id: z.uuid({
    message: "ID de notification utilisateur invalide (UUID attendu).",
  }),
});

// Schéma pour la création d'une liaison user_notification
export const createUserNotificationSchema = z.object({
  user_id: z.uuid({ message: "user_id doit être un UUID valide." }),
  notification_id: z.uuid({
    message: "notification_id doit être un UUID valide.",
  }),
  is_read: z.boolean().optional(),
});

// Schéma pour la mise à jour d'une notification utilisateur (marquer comme lue)
export const updateUserNotificationSchema = z.object({
  is_read: z.boolean({ message: "is_read est requis." }),
});

// Schéma pour la récupération des notifications utilisateur (filtrage, pagination)
export const getUserNotificationsQuerySchema = z.object({
  user_id: z.uuid({ message: "user_id doit être un UUID valide." }),
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

// Schéma pour la requête de marquage de toutes les notifications comme lues
export const markAllAsReadQuerySchema = z.object({
  user_id: z.uuid({ message: "user_id doit être un UUID valide." }),
});
