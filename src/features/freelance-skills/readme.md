# 🛠️ Freelance Skills - Synkrone Backend

Ce module gère l'association des compétences (skills) aux freelances sur la plateforme Synkrone. Il permet à chaque freelance d'ajouter, consulter, mettre à jour et supprimer ses compétences, avec gestion du niveau et validation sécurisée.

---

## Fonctionnement général

- Les compétences sont définies dans la table `skills` (voir module skills).
- La table `freelance_skills` fait le lien entre chaque freelance et ses compétences, avec un niveau optionnel (`level`).
- Chaque freelance peut gérer ses compétences via des endpoints sécurisés.

---

## Structure des données

### Modèle FreelanceSkills

```ts
export interface FreelanceSkills {
  id: string;
  freelance_id: string;
  skill_id: string;
  level?: string;
  created_at: Date;
}
```

- `freelance_id` : identifiant du freelance
- `skill_id` : identifiant de la compétence
- `level` : niveau de maîtrise (optionnel)
- `created_at` : date d'association

---

## API REST

Toutes les routes sont protégées par le middleware `AuthFreelanceMiddleware` (seul le freelance connecté peut gérer ses compétences).

### Endpoints principaux

#### 1. Associer une compétence à un freelance

```
POST /api/freelance-skills
Authorization: Bearer FREELANCE_TOKEN
Content-Type: application/json

{
  "skill_id": "SKILL_UUID"
}
```
- Ajoute une compétence au freelance connecté.

#### 2. Récupérer les compétences d'un freelance

```
GET /api/freelance-skills
Authorization: Bearer FREELANCE_TOKEN
```
- Retourne la liste des compétences du freelance connecté, avec le niveau et les infos de chaque skill.

#### 3. Mettre à jour une compétence d'un freelance

```
PATCH /api/freelance-skills/:id
Authorization: Bearer FREELANCE_TOKEN
Content-Type: application/json

{
  "skill_id": "SKILL_UUID",
  "level": "expert"
}
```
- Modifie la compétence ou le niveau associé à une compétence du freelance.

#### 4. Supprimer une compétence d'un freelance

```
DELETE /api/freelance-skills/:id
Authorization: Bearer FREELANCE_TOKEN
```
- Supprime l'association entre le freelance et la compétence.

---

## Sécurité

- Seul le freelance connecté peut gérer ses propres compétences.
- Validation des IDs et des compétences via les repositories et services.
- Gestion centralisée des erreurs et des statuts HTTP.

---

## Extensibilité

- Possibilité d'ajouter des niveaux personnalisés, des tags, ou des validations avancées.
- Facile à intégrer avec le module skills pour la recherche ou la suggestion de compétences.
- Prêt pour la gestion de gros volumes et la croissance de la plateforme.

---

## Pour aller plus loin

- Ajouter des filtres (par niveau, par catégorie) dans la récupération des compétences.
- Intégrer la suggestion automatique de compétences selon le profil ou les projets.
- Ajouter des tests automatisés pour garantir la fiabilité du module.

---

**Contact :**  
Pour toute question ou évolution, contactez l’équipe backend Synkrone.