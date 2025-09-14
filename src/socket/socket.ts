import { io } from "../server";
import { verifyUserToken } from "../utils/utils";

io.on("connection", (socket) => {
  console.log("Nouvelle connexion socket !", socket.id);

  const token = socket.handshake.auth?.token;
  if (!token) {
    socket.disconnect();
    return;
  }

  // Vérifie le token pour n'importe quel type d'utilisateur
  const { user, role } = verifyUserToken(token);
  // console.log("Vérification du token pour le socket :", user);
  const type = role;

  if (!user || !user.id) {
    socket.disconnect();
    return;
  }

  // Place l'utilisateur dans une room dédiée à son user_id
  socket.join(user.id);
  // console.log(
  //   `Utilisateur (${type}) ${user.id} connecté au socket de notifications`,
  // );
  setTimeout(() => {
    console.log("Rooms du socket après join :", Array.from(socket.rooms));
  }, 500);
});
