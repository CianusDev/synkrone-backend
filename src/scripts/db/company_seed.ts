import { CompanyRepository } from "../../features/company/company.repository";
import { ProjectsRepository } from "../../features/projects/projects.repository";
import { ProjectCategoriesRepository } from "../../features/project-categories/project-categories.repository";
import { hashSync } from "bcryptjs"; // Utilise bcryptjs pour le hash du mot de passe
import {
  ProjectStatus,
  TypeWork,
} from "../../features/projects/projects.model";

async function seed() {
  // 1. Récupérer les catégories de projet depuis la base de données
  const categoryRepo = new ProjectCategoriesRepository();
  const [categories, _] = await categoryRepo.getAllCategories(); // destructure [ProjectCategory[], number]
  const devCat = categories.find((cat) => cat.name === "Développement");
  const designCat = categories.find((cat) => cat.name === "Design");

  if (!devCat || !designCat) {
    throw new Error(
      "Les catégories 'Développement' ou 'Design' n'existent pas dans la base de données.",
    );
  }

  // 2. Créer des entreprises
  const companyRepo = new CompanyRepository();
  const company1 = await companyRepo.createCompany({
    company_name: "TechCorp",
    company_email: "contact@techcorp.com",
    country: "France",
    password_hashed: hashSync("password123", 10),
  });
  const company2 = await companyRepo.createCompany({
    company_name: "DesignStudio",
    company_email: "hello@designstudio.com",
    country: "France",
    password_hashed: hashSync("password456", 10),
  });

  // 3. Créer des projets pour chaque entreprise
  const projectsRepo = new ProjectsRepository();
  await projectsRepo.createProject({
    title: "Application mobile React Native",
    description: "Développement d'une app mobile pour TechCorp",
    budget: 12000,
    deadline: "2024-09-30",
    status: ProjectStatus.PUBLISHED,
    typeWork: TypeWork.REMOTE,
    categoryId: devCat.id,
    companyId: company1.id,
  });
  await projectsRepo.createProject({
    title: "Refonte site vitrine",
    description: "Refonte graphique du site web de TechCorp",
    budget: 8000,
    deadline: "2024-08-15",
    status: ProjectStatus.PUBLISHED,
    typeWork: TypeWork.REMOTE,
    categoryId: designCat.id,
    companyId: company1.id,
  });
  await projectsRepo.createProject({
    title: "Identité visuelle",
    description: "Création d'une nouvelle identité visuelle pour DesignStudio",
    budget: 5000,
    deadline: "2024-07-20",
    status: ProjectStatus.PUBLISHED,
    typeWork: TypeWork.REMOTE,
    categoryId: designCat.id,
    companyId: company2.id,
  });

  console.log("✅ Seed terminé !");
}

seed().catch((err) => {
  console.error("Erreur lors du seed :", err);
  process.exit(1);
});
