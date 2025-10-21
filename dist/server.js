"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
dotenv_1.default.config();
const PORT = process.env.BACKEND_PORT || 5000;
(0, db_1.default)();
app_1.default.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
