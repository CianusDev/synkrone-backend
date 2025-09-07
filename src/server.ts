import { app } from "./app";
import http from "http";
import { Server } from "socket.io";

// Port par défaut, mais permettre l'override
const DEFAULT_PORT = 5000;
let PORT_SERVER = process.env.PORT_SERVER
  ? parseInt(process.env.PORT_SERVER)
  : DEFAULT_PORT;

// Création du serveur HTTP pour supporter Socket.IO
const server = http.createServer(app);

// Initialisation de Socket.IO
export const io = new Server(server, {
  cors: {
    origin: "*", // adapte selon tes besoins
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

// Import du handler Socket.IO APRES l'initialisation de io
import "./socket/socket";

/**
 * Démarre le serveur sur le port spécifié ou utilise le port par défaut
 * @param port Port à utiliser (optionnel, utilise PORT_SERVER par défaut)
 * @returns Le serveur HTTP
 */
export function startServer(port?: number): http.Server {
  // Utiliser le port fourni ou le port par défaut
  const finalPort = port || PORT_SERVER;

  // Démarrer le serveur s'il n'est pas déjà en écoute
  if (!server.listening) {
    server.listen(finalPort, () => {
      console.log(
        `Serveur démarré sur l'adresse http://localhost:${finalPort}. Prêt à recevoir des requêtes !`,
      );
    });
  } else {
    console.log(
      `Serveur déjà en cours d'exécution sur le port ${server.address()?.toString}`,
    );
  }

  return server;
}

// Si ce fichier est exécuté directement (pas importé), démarrer le serveur
if (require.main === module) {
  startServer();
}
// Aucune accolade supplémentaire ici
