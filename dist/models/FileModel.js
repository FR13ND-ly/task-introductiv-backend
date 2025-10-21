"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileModel = void 0;
const mongoose_1 = require("mongoose");
const FileSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true
    },
    parent: {
        type: mongoose_1.Types.ObjectId,
        ref: 'File'
    },
    isFolder: {
        type: Boolean,
        default: false
    },
    path: {
        type: String,
        required: true
    },
    metadata: {
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }
});
exports.FileModel = (0, mongoose_1.model)("File", FileSchema);
