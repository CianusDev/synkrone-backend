import { app } from "./app";
import http from "http";
import { Server } from "socket.io";

const PORT_SERVER = process.env.PORT_SERVER || 5000;

// Création du serveur HTTP pour supporter Socket.IO
const server = http.createServer(app);

// Initialisation de Socket.IO
export const io = new Server(server, {
  cors: {
    origin: "*", // adapte selon tes besoins
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

server.listen(PORT_SERVER, () => {
  console.log(
    `Serveur démarré sur a l'adresse http://localhost:${PORT_SERVER}. Prêt à recevoir des requêtes !`,
  );
});
