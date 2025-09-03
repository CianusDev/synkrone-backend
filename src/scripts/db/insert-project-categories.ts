import { db } from "../../config/database";

// Catégories de projets courantes sur les plateformes de freelancing
const projectCategories = [
  {
    name: "Développement Web",
    description:
      "Projets de création de sites web, applications web, e-commerce, etc.",
    icon: "🌐",
    is_active: true,
  },
  {
    name: "Développement Mobile",
    description: "Applications mobiles iOS, Android, cross-platform, etc.",
    icon: "📱",
    is_active: true,
  },
  {
    name: "Design & Création",
    description: "Design graphique, UI/UX, branding, illustration, etc.",
    icon: "🎨",
    is_active: true,
  },
  {
    name: "Marketing Digital",
    description:
      "SEO, SEA, réseaux sociaux, publicité en ligne, stratégie digitale.",
    icon: "📈",
    is_active: true,
  },
  {
    name: "Rédaction & Traduction",
    description: "Rédaction web, copywriting, traduction, correction, etc.",
    icon: "✍️",
    is_active: true,
  },
  {
    name: "Data & Analyse",
    description: "Analyse de données, data science, BI, machine learning.",
    icon: "📊",
    is_active: true,
  },
  {
    name: "Support & Assistance",
    description:
      "Support client, assistance virtuelle, gestion administrative.",
    icon: "💬",
    is_active: true,
  },
  {
    name: "Audio, Vidéo & Animation",
    description: "Montage vidéo, animation, production audio, podcasts.",
    icon: "🎬",
    is_active: true,
  },
  {
    name: "Informatique & Réseaux",
    description: "Administration systèmes, cybersécurité, cloud, réseaux.",
    icon: "🖥️",
    is_active: true,
  },
  {
    name: "Conseil & Gestion de projet",
    description: "Consulting, gestion de projet, stratégie, organisation.",
    icon: "🗂️",
    is_active: true,
  },
];

async function insertProjectCategories() {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    for (const cat of projectCategories) {
      // Vérifie si la catégorie existe déjà (par nom)
      const exists = await client.query(
        `SELECT 1 FROM project_categories WHERE name = $1`,
        [cat.name],
      );
      if ((exists.rowCount ?? 0) > 0) {
        console.log(`ℹ️  Catégorie déjà présente : ${cat.name}`);
        continue;
      }

      await client.query(
        `INSERT INTO project_categories (name, description, icon, is_active) VALUES ($1, $2, $3, $4)`,
        [cat.name, cat.description, cat.icon, cat.is_active],
      );
      console.log(`✅ Catégorie insérée : ${cat.name}`);
    }

    await client.query("COMMIT");
    console.log("🎉 Toutes les catégories de projets ont été insérées !");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(
      "❌ Erreur lors de l'insertion des catégories de projets :",
      error,
    );
  } finally {
    client.release();
  }
}

if (require.main === module) {
  insertProjectCategories().then(() => process.exit(0));
}
