import { db } from "../../config/database";

// Génère un slug à partir d'une chaîne
function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Catégories de compétences fréquentes sur les plateformes de freelancing
const categories = [
  {
    name: "Développement Web",
    description:
      "Compétences liées au développement d'applications web et sites internet.",
  },
  {
    name: "Développement Mobile",
    description: "Compétences en développement d'applications mobiles.",
  },
  {
    name: "Design & Création",
    description: "Compétences en design graphique, UI/UX et création visuelle.",
  },
  {
    name: "Marketing Digital",
    description: "Compétences en marketing en ligne et stratégies digitales.",
  },
  {
    name: "Rédaction & Traduction",
    description:
      "Compétences en création de contenu et services linguistiques.",
  },
  {
    name: "Data & Analyse",
    description: "Compétences en analyse de données et science des données.",
  },
];

// Skills populaires associés à chaque catégorie
const skills = [
  // Développement Web
  {
    name: "JavaScript",
    description: "Langage de programmation web côté client.",
    category: "Développement Web",
  },
  {
    name: "React",
    description: "Bibliothèque JavaScript pour interfaces utilisateur.",
    category: "Développement Web",
  },
  {
    name: "Node.js",
    description: "Environnement d'exécution JavaScript côté serveur.",
    category: "Développement Web",
  },
  {
    name: "PHP",
    description: "Langage de programmation côté serveur pour le web.",
    category: "Développement Web",
  },
  {
    name: "WordPress",
    description: "CMS pour la création et gestion de sites web.",
    category: "Développement Web",
  },
  {
    name: "Angular",
    description: "Framework web développé par Google.",
    category: "Développement Web",
  },
  {
    name: "Vue.js",
    description: "Framework JavaScript progressif pour construire des UI.",
    category: "Développement Web",
  },

  // Développement Mobile
  {
    name: "React Native",
    description: "Framework pour applications mobiles cross-platform.",
    category: "Développement Mobile",
  },
  {
    name: "Swift",
    description: "Langage de programmation pour iOS et macOS.",
    category: "Développement Mobile",
  },
  {
    name: "Kotlin",
    description: "Langage de programmation pour Android.",
    category: "Développement Mobile",
  },
  {
    name: "Flutter",
    description: "SDK Google pour applications multiplateformes.",
    category: "Développement Mobile",
  },

  // Design & Création
  {
    name: "UI/UX Design",
    description: "Conception d'interfaces et d'expériences utilisateur.",
    category: "Design & Création",
  },
  {
    name: "Photoshop",
    description: "Logiciel de retouche d'image et graphisme.",
    category: "Design & Création",
  },
  {
    name: "Figma",
    description: "Outil collaboratif de design d'interface.",
    category: "Design & Création",
  },
  {
    name: "Illustrator",
    description: "Logiciel de création graphique vectorielle.",
    category: "Design & Création",
  },

  // Marketing Digital
  {
    name: "SEO",
    description: "Optimisation pour les moteurs de recherche.",
    category: "Marketing Digital",
  },
  {
    name: "Google Ads",
    description: "Plateforme publicitaire en ligne de Google.",
    category: "Marketing Digital",
  },
  {
    name: "Content Marketing",
    description: "Stratégie de création et diffusion de contenu.",
    category: "Marketing Digital",
  },
  {
    name: "Social Media Marketing",
    description: "Marketing sur les réseaux sociaux.",
    category: "Marketing Digital",
  },

  // Rédaction & Traduction
  {
    name: "Copywriting",
    description: "Rédaction persuasive pour le marketing.",
    category: "Rédaction & Traduction",
  },
  {
    name: "Traduction",
    description: "Conversion de textes entre différentes langues.",
    category: "Rédaction & Traduction",
  },
  {
    name: "Rédaction Web",
    description: "Création de contenu optimisé pour le web.",
    category: "Rédaction & Traduction",
  },

  // Data & Analyse
  {
    name: "Python",
    description: "Langage de programmation pour data science.",
    category: "Data & Analyse",
  },
  {
    name: "SQL",
    description: "Langage de requête structurée pour bases de données.",
    category: "Data & Analyse",
  },
  {
    name: "Tableau",
    description: "Logiciel de visualisation de données.",
    category: "Data & Analyse",
  },
  {
    name: "Machine Learning",
    description: "Développement d'algorithmes d'apprentissage.",
    category: "Data & Analyse",
  },
];

async function insertCategoriesAndSkills() {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Insérer les catégories et récupérer leur id
    const categoryIdMap: Record<string, string> = {};
    for (const cat of categories) {
      const slug = slugify(cat.name);
      const res = await client.query(
        `INSERT INTO category_skills (name, slug, description) VALUES ($1, $2, $3) RETURNING id`,
        [cat.name, slug, cat.description],
      );
      categoryIdMap[cat.name] = res.rows[0].id;
    }

    // Insérer les skills avec la bonne catégorie
    for (const skill of skills) {
      const categoryId = categoryIdMap[skill.category];
      if (!categoryId) {
        throw new Error(`Catégorie non trouvée pour le skill: ${skill.name}`);
      }
      await client.query(
        `INSERT INTO skills (name, description, category_id) VALUES ($1, $2, $3)`,
        [skill.name, skill.description, categoryId],
      );
    }

    await client.query("COMMIT");
    console.log("✅ Catégories et skills insérés avec succès !");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Erreur lors de l'insertion:", error);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  insertCategoriesAndSkills().then(() => process.exit(0));
}
