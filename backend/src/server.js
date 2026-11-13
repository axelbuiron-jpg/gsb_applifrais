require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

function startServer() {
    const preferredPort = Number(process.env.PORT) || 3000;

    if (process.env.MONGODB_URI) {
        connectDB().catch((error) => {
            console.error("MongoDB indisponible, l'API continue sans base de données :", error.message);
        });
    } else {
        console.warn("MONGODB_URI non défini : démarrage sans base de données");
    }

    function listenOn(port) {
        const server = app.listen(port, () => console.log(`API prête sur le port ${server.address().port}`));

        server.on("error", (error) => {
            if (error.code === "EADDRINUSE" && port !== 0) {
                console.warn(`Port ${port} occupé, tentative sur un port libre...`);
                listenOn(0);
                return;
            }

            console.error("Erreur de démarrage du serveur :", error.message);
            process.exitCode = 1;
        });
    }

    listenOn(preferredPort);
}

startServer();