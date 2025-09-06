import { io } from "../server";
import { verifyFreelanceToken, verifyCompanyToken } from "../utils/utils";

io.on("connection", async (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    socket.disconnect();
    return;
  }

  // Vérifie le token pour freelance ou company
  let user = null;
  let type = null;
  const freelanceResult = verifyFreelanceToken(token);
  if (freelanceResult?.freelance) {
    user = freelanceResult.freelance;
    type = "freelance";
  } else {
    const companyResult = verifyCompanyToken(token);
    if (companyResult?.company) {
      user = companyResult.company;
      type = "company";
    }
  }

  if (!user || !user.id) {
    socket.disconnect();
    return;
  }

  // Place l'utilisateur dans une room dédiée à son user_id
  socket.join(user.id);
  console.log(
    `Utilisateur (${type}) ${user.id} connecté au socket de notifications`,
  );
});
