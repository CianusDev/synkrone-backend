import { db } from "../../config/database";
import { v4 as uuidv4 } from "uuid";
import { hashPassword } from "../../utils/utils";
import { SkillRepository } from "../../features/skills/skill.repository";

// Données de seed pour 10 freelances (avec description et photo de profil)
// Données de seed pour 10 freelances (bios enrichies)
const freelancesSeed = [
  {
    firstname: "Alice",
    lastname: "Martin",
    email: "alice.martin@example.com",
    password: "Password123!",
    country: "France",
    job_title: "Développeuse Fullstack",
    experience: "expert",
    tjm: 500,
    is_verified: true,
    location: "Paris",
    description:
      "Passionnée par la tech depuis l’enfance, j’ai plus de 8 ans d’expérience en développement web. J’ai travaillé sur des plateformes à fort trafic et j’adore relever des défis techniques. J’aime partager mes connaissances et contribuer à des projets open source. Mon stack favori : React, Node.js, PostgreSQL.",
    photo_url: "https://randomuser.me/api/portraits/women/1.jpg",
  },
  {
    firstname: "Benoît",
    lastname: "Durand",
    email: "benoit.durand@example.com",
    password: "Password123!",
    country: "France",
    job_title: "UX/UI Designer",
    experience: "intermediate",
    tjm: 400,
    is_verified: true,
    location: "Lyon",
    description:
      "Designer passionné par l’expérience utilisateur, je mets la créativité au service de l’efficacité. J’ai accompagné des startups et PME dans la refonte de leur identité digitale, du wireframe au prototype interactif. J’aime travailler en équipe agile et défendre l’accessibilité numérique.",
    photo_url: "https://randomuser.me/api/portraits/men/2.jpg",
  },
  {
    firstname: "Claire",
    lastname: "Dubois",
    email: "claire.dubois@example.com",
    password: "Password123!",
    country: "Belgique",
    job_title: "Développeuse Frontend",
    experience: "beginner",
    tjm: 300,
    is_verified: false,
    location: "Bruxelles",
    description:
      "Jeune diplômée en informatique, je me spécialise dans le développement d’interfaces web modernes et accessibles. J’aime apprendre de nouvelles technologies et relever des challenges en équipe. Mon objectif : rendre le web plus beau et plus inclusif.",
    photo_url: "https://randomuser.me/api/portraits/women/3.jpg",
  },
  {
    firstname: "David",
    lastname: "Nguyen",
    email: "david.nguyen@example.com",
    password: "Password123!",
    country: "France",
    job_title: "Data Scientist",
    experience: "expert",
    tjm: 600,
    is_verified: true,
    location: "Toulouse",
    description:
      "Docteur en mathématiques appliquées, je transforme la donnée brute en valeur business. J’ai conçu des modèles prédictifs pour la santé et la finance. J’aime vulgariser la data science et animer des ateliers pour les équipes métier.",
    photo_url: "https://randomuser.me/api/portraits/men/4.jpg",
  },
  {
    firstname: "Emma",
    lastname: "Lefevre",
    email: "emma.lefevre@example.com",
    password: "Password123!",
    country: "Suisse",
    job_title: "Développeuse Mobile",
    experience: "intermediate",
    tjm: 450,
    is_verified: true,
    location: "Genève",
    description:
      "Spécialisée en développement mobile Flutter et Swift, j’ai lancé plusieurs apps sur les stores. J’aime concevoir des expériences utilisateurs fluides et innovantes. Je suis aussi formatrice pour des bootcamps tech.",
    photo_url: "https://randomuser.me/api/portraits/women/5.jpg",
  },
  {
    firstname: "Farid",
    lastname: "Benali",
    email: "farid.benali@example.com",
    password: "Password123!",
    country: "Maroc",
    job_title: "DevOps Engineer",
    experience: "expert",
    tjm: 550,
    is_verified: false,
    location: "Casablanca",
    description:
      "Ingénieur DevOps depuis 7 ans, j’automatise les déploiements et optimise les infrastructures cloud. J’ai accompagné des scale-ups dans leur migration vers Kubernetes et la mise en place de CI/CD robustes.",
    photo_url: "https://randomuser.me/api/portraits/men/6.jpg",
  },
  {
    firstname: "Gaëlle",
    lastname: "Petit",
    email: "gaelle.petit@example.com",
    password: "Password123!",
    country: "France",
    job_title: "Rédactrice Web",
    experience: "beginner",
    tjm: 250,
    is_verified: true,
    location: "Nantes",
    description:
      "Rédactrice web SEO, je crée des contenus engageants pour blogs et sites e-commerce. J’adore jouer avec les mots et aider les entreprises à booster leur visibilité sur Google.",
    photo_url: "https://randomuser.me/api/portraits/women/7.jpg",
  },
  {
    firstname: "Hugo",
    lastname: "Moreau",
    email: "hugo.moreau@example.com",
    password: "Password123!",
    country: "France",
    job_title: "Chef de Projet",
    experience: "intermediate",
    tjm: 480,
    is_verified: true,
    location: "Bordeaux",
    description:
      "Chef de projet digital, j’accompagne les équipes dans la réussite de leurs projets web et mobile. Mon credo : organisation, communication et agilité. J’ai piloté des refontes de sites pour des grands comptes et des startups.",
    photo_url: "https://randomuser.me/api/portraits/men/8.jpg",
  },
  {
    firstname: "Inès",
    lastname: "Rossi",
    email: "ines.rossi@example.com",
    password: "Password123!",
    country: "Italie",
    job_title: "Traductrice",
    experience: "expert",
    tjm: 350,
    is_verified: false,
    location: "Rome",
    description:
      "Traductrice trilingue (français, italien, anglais), je travaille pour des cabinets juridiques et des agences de communication. J’aime transmettre les nuances culturelles à travers mes traductions.",
    photo_url: "https://randomuser.me/api/portraits/women/9.jpg",
  },
  {
    firstname: "Julien",
    lastname: "Schmitt",
    email: "julien.schmitt@example.com",
    password: "Password123!",
    country: "France",
    job_title: "Développeur Backend",
    experience: "intermediate",
    tjm: 420,
    is_verified: true,
    location: "Strasbourg",
    description:
      "Développeur backend passionné par la performance et la sécurité, je conçois des APIs robustes en Node.js et PostgreSQL. J’aime optimiser les architectures et partager mes bonnes pratiques.",
    photo_url: "https://randomuser.me/api/portraits/men/10.jpg",
  },
];

async function insertFreelances() {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Récupérer les skills existants (on prend les 20 premiers pour la diversité)
    const skillRepo = new SkillRepository();
    const { data: allSkills } = await skillRepo.getAllSkills(
      {},
      { limit: 20, page: 1 },
    );
    if (!allSkills || allSkills.length < 2) {
      throw new Error(
        "Il faut au moins 2 skills en base pour associer aux freelances.",
      );
    }

    for (let i = 0; i < freelancesSeed.length; i++) {
      const freelance = freelancesSeed[i];
      // Vérifie si le freelance existe déjà (par email)
      const exists = await client.query(
        `SELECT 1 FROM freelances WHERE email = $1`,
        [freelance.email],
      );
      if ((exists.rowCount ?? 0) > 0) {
        console.log(`ℹ️  Freelance déjà présent : ${freelance.email}`);
        continue;
      }

      const password_hashed = await hashPassword(freelance.password);
      const freelanceId = uuidv4();

      await client.query(
        `INSERT INTO freelances (
          id,
          firstname,
          lastname,
          email,
          password_hashed,
          country,
          job_title,
          experience,
          tjm,
          is_verified,
          location,
          description,
          photo_url,
          created_at,
          block_duration,
          deleted_at,
          blocked_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), 0, NULL, NULL, NULL
        )`,
        [
          freelanceId,
          freelance.firstname,
          freelance.lastname,
          freelance.email,
          password_hashed,
          freelance.country,
          freelance.job_title,
          freelance.experience,
          freelance.tjm,
          freelance.is_verified,
          freelance.location,
          freelance.description,
          freelance.photo_url,
        ],
      );

      // Associer au moins 2 skills à chaque freelance (on prend 2 skills différents pour chaque)
      const skill1 = allSkills[i % allSkills.length];
      const skill2 = allSkills[(i + 1) % allSkills.length];
      await client.query(
        `INSERT INTO freelance_skills (freelance_id, skill_id) VALUES ($1, $2), ($1, $3)`,
        [freelanceId, skill1.id, skill2.id],
      );

      console.log(
        `✅ Freelance inséré : ${freelance.firstname} ${freelance.lastname} (skills: ${skill1.name}, ${skill2.name})`,
      );
    }

    await client.query("COMMIT");
    console.log(
      "🎉 10 freelances de test ont été insérés avec au moins 2 skills chacun !",
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Erreur lors de l'insertion des freelances :", error);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  insertFreelances().then(() => process.exit(0));
}
