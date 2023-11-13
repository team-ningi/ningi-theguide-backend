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
const users_1 = __importDefault(require("./routes/users"));
const documents_1 = __importDefault(require("./routes/documents"));
const templates_1 = __importDefault(require("./routes/templates"));
const reports_1 = __importDefault(require("./routes/reports"));
const ai_1 = __importDefault(require("./routes/ai"));
const history_1 = __importDefault(require("./routes/history"));
dotenv_1.default.config();
require("./setup").setup();
const app = (0, express_1.default)();
const port = process.env.PORT || 8000;
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, body_parser_1.json)());
app.use((0, cookie_parser_1.default)());
app.use(errors_1.errorHandler);
app.get("/", (req, res) => {
    return res.send("Adviser API");
});
app.use(users_1.default);
app.use(documents_1.default);
app.use(templates_1.default);
app.use(ai_1.default);
app.use(history_1.default);
app.use(reports_1.default);
app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});
process.on("SIGINT", () => {
    require("./setup").teardown(); // eslint-disable-line global-require
});
