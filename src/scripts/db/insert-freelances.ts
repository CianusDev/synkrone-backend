import { db } from "../../config/database";
import { v4 as uuidv4 } from "uuid";
import { hashPassword } from "../../utils/utils";
import { SkillRepository } from "../../features/skills/skill.repository";

// Données de seed pour 10 freelances africains (avec description et photo de profil)
// Données de seed pour 10 freelances africains (bios enrichies)
const freelancesSeed = [
  {
    firstname: "Aïssatou",
    lastname: "Diallo",
    email: "aissatou.diallo@example.com",
    password: "Password123!",
    country: "Sénégal",
    job_title: "Développeuse Fullstack",
    experience: "expert",
    tjm: 350,
    is_verified: true,
    location: "Dakar",
    description:
      "Développeuse passionnée basée à Dakar, j’ai plus de 7 ans d’expérience dans le développement web et mobile. J’ai travaillé sur des projets fintech et e-commerce en Afrique de l’Ouest. J’aime partager mes connaissances lors de meetups et ateliers pour les jeunes femmes dans la tech.",
    photo_url:
      "https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // African woman
  },
  {
    firstname: "Mohamed",
    lastname: "Kouyaté",
    email: "mohamed.kouyate@example.com",
    password: "Password123!",
    country: "Guinée",
    job_title: "UX/UI Designer",
    experience: "intermediate",
    tjm: 300,
    is_verified: true,
    location: "Conakry",
    description:
      "Designer spécialisé dans l’expérience utilisateur, j’aide les startups africaines à créer des interfaces intuitives et accessibles. J’ai collaboré avec des incubateurs et adore intégrer la culture locale dans mes créations.",
    photo_url:
      "https://images.unsplash.com/photo-1633379336519-828c306c7694?q=80&w=2013&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // African man
  },
  {
    firstname: "Fatou",
    lastname: "Mbaye",
    email: "fatou.mbaye@example.com",
    password: "Password123!",
    country: "Sénégal",
    job_title: "Développeuse Frontend",
    experience: "beginner",
    tjm: 200,
    is_verified: false,
    location: "Saint-Louis",
    description:
      "Jeune diplômée en informatique, je me spécialise dans le développement d’interfaces web modernes. J’aime apprendre de nouvelles technologies et contribuer à des projets open source pour la communauté africaine.",
    photo_url:
      "https://images.unsplash.com/photo-1551247074-b14d3491bec6?q=80&w=1939&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // African woman
  },
  {
    firstname: "Jean",
    lastname: "Mugisha",
    email: "jean.mugisha@example.com",
    password: "Password123!",
    country: "Rwanda",
    job_title: "Data Scientist",
    experience: "expert",
    tjm: 400,
    is_verified: true,
    location: "Kigali",
    description:
      "Docteur en mathématiques appliquées, je transforme la donnée en solutions pour l’agriculture et la santé en Afrique. J’anime des ateliers de vulgarisation de la data science pour les étudiants.",
    photo_url:
      "https://plus.unsplash.com/premium_photo-1705508643357-f412934aa7ce?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // African man
  },
  {
    firstname: "Nadia",
    lastname: "Benmoussa",
    email: "nadia.benmoussa@example.com",
    password: "Password123!",
    country: "Maroc",
    job_title: "Développeuse Mobile",
    experience: "intermediate",
    tjm: 320,
    is_verified: true,
    location: "Casablanca",
    description:
      "Spécialisée en développement mobile Android et Flutter, j’ai lancé plusieurs applications pour des ONG et des startups marocaines. J’aime concevoir des expériences utilisateurs adaptées au marché africain.",
    photo_url:
      "https://images.unsplash.com/photo-1611432579402-7037e3e2c1e4?q=80&w=765&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // African woman
  },
  {
    firstname: "Samuel",
    lastname: "Okeke",
    email: "samuel.okeke@example.com",
    password: "Password123!",
    country: "Nigeria",
    job_title: "DevOps Engineer",
    experience: "expert",
    tjm: 380,
    is_verified: false,
    location: "Lagos",
    description:
      "Ingénieur DevOps depuis 6 ans, j’automatise les déploiements et optimise les infrastructures cloud pour des fintechs et e-commerce nigérians. J’ai accompagné des scale-ups dans leur migration vers Kubernetes.",
    photo_url:
      "https://images.unsplash.com/photo-1659093728055-45f8275166d9?q=80&w=647&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // African man
  },
  {
    firstname: "Mariam",
    lastname: "Traoré",
    email: "mariam.traore@example.com",
    password: "Password123!",
    country: "Mali",
    job_title: "Rédactrice Web",
    experience: "beginner",
    tjm: 150,
    is_verified: true,
    location: "Bamako",
    description:
      "Rédactrice web SEO, je crée des contenus engageants pour blogs et sites e-commerce africains. J’aime valoriser les initiatives locales et aider les entreprises à améliorer leur visibilité en ligne.",
    photo_url:
      "https://images.unsplash.com/photo-1512361436605-a484bdb34b5f?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // African woman
  },
  {
    firstname: "Abdoulaye",
    lastname: "Diop",
    email: "abdoulaye.diop@example.com",
    password: "Password123!",
    country: "Sénégal",
    job_title: "Chef de Projet",
    experience: "intermediate",
    tjm: 350,
    is_verified: true,
    location: "Thiès",
    description:
      "Chef de projet digital, j’accompagne les équipes dans la réussite de leurs projets web et mobile en Afrique francophone. Mon credo : organisation, communication et agilité. J’ai piloté des refontes de sites pour des ONG et startups locales.",
    photo_url:
      "https://images.unsplash.com/photo-1552493450-2b5ce80ed13f?q=80&w=1114&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // African man
  },
  {
    firstname: "Zineb",
    lastname: "El Idrissi",
    email: "zineb.elidrissi@example.com",
    password: "Password123!",
    country: "Maroc",
    job_title: "Traductrice",
    experience: "expert",
    tjm: 220,
    is_verified: false,
    location: "Rabat",
    description:
      "Traductrice trilingue (arabe, français, anglais), je travaille pour des cabinets juridiques et des agences de communication marocaines. J’aime transmettre les nuances culturelles à travers mes traductions.",
    photo_url:
      "https://images.unsplash.com/photo-1618085222100-93f0eecad0aa?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // African woman
  },
  {
    firstname: "Koffi",
    lastname: "Mensah",
    email: "koffi.mensah@example.com",
    password: "Password123!",
    country: "Côte d'Ivoire",
    job_title: "Développeur Backend",
    experience: "intermediate",
    tjm: 300,
    is_verified: true,
    location: "Abidjan",
    description:
      "Développeur backend passionné par la performance et la sécurité, je conçois des APIs robustes pour des plateformes e-commerce et fintech ivoiriennes. J’aime optimiser les architectures et partager mes bonnes pratiques.",
    photo_url:
      "https://images.unsplash.com/photo-1723221907042-44f8265747b7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // African man
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
