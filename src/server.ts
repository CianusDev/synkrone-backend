import { app } from "./app";

const PORT_SERVER = process.env.PORT_SERVER || 5000;

app.listen(PORT_SERVER, () => {
  console.log(
    `Serveur démarré sur a l'adresse http://localhost:${PORT_SERVER}. Prêt à recevoir des requêtes !`,
  );
});
