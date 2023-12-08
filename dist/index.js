"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const errors_1 = require("./middlewares/errors");
const body_parser_1 = require("body-parser");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const users_1 = __importDefault(require("./routes/users"));
const documents_1 = __importDefault(require("./routes/documents"));
const documents_groups_1 = __importDefault(require("./routes/documents-groups"));
const templates_1 = __importDefault(require("./routes/templates"));
const tags_1 = __importDefault(require("./routes/tags"));
const reports_1 = __importDefault(require("./routes/reports"));
const ai_1 = __importDefault(require("./routes/ai"));
const history_1 = __importDefault(require("./routes/history"));
const testroutes_1 = __importDefault(require("./routes/testroutes"));
const websocket_1 = require("./websocket");
const http_1 = __importDefault(require("http"));
dotenv_1.default.config();
require("./setup").setup();
const app = (0, express_1.default)(); // @ts-ignore
const server = http_1.default.createServer(app);
const port = process.env.PORT || 8000;
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, body_parser_1.json)());
app.use((0, cookie_parser_1.default)());
app.use(errors_1.errorHandler);
app.use((0, compression_1.default)());
app.get("/", (req, res) => {
    return res.send("Adviser API");
});
app.use(users_1.default);
app.use(documents_1.default);
app.use(documents_groups_1.default);
app.use(templates_1.default);
app.use(tags_1.default);
app.use(ai_1.default);
app.use(history_1.default);
app.use(reports_1.default);
app.use(testroutes_1.default);
server.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});
(0, websocket_1.setupWebSocketServer)(server);
app.post("/trigger", (req, res) => {
    console.log(`Amount of connections: ${websocket_1.clients.size}`);
    let i = 1;
    websocket_1.clients.forEach((client) => {
        console.log(`user ${i} > uuid:  ${client?.uuid}`);
        if (client?.webSocket.readyState === websocket_1.WebSocket.OPEN) {
            client?.webSocket.send(JSON.stringify({
                type: "TRIGGERED_MESSAGE",
                payload: "Triggered from the REST API",
                uuid: client?.uuid,
            }));
        }
        i++;
    });
    res.status(200).send(`Amount of connections: ${websocket_1.clients.size}`);
});
process.on("SIGINT", () => {
    console.log("teardown, disconnecting ... SIGINT");
    (0, websocket_1.closeServer)(server);
    require("./setup").teardown(); // eslint-disable-line global-require
});
process.on("SIGTERM", () => {
    console.log("teardown, disconnecting ... SIGTERM");
    (0, websocket_1.closeServer)(server);
    require("./setup").teardown(); // eslint-disable-line global-require
});
