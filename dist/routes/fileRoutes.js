"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const FileController_1 = require("../controllers/FileController");
const FileController_2 = require("../controllers/FileController");
const multer_1 = require("../middleware/multer");
// import { uploadFile, getFiles, deleteFile, createFolder } from '../controllers/filleController';
const router = (0, express_1.Router)();
// Routes
router.post('/', multer_1.upload.single("file"), FileController_1.createFile);
router.delete('/:id', FileController_2.deleteFile);
router.get('/', FileController_1.getFiles);
// router.post('/folder', createFolder);
// router.get('/', getFiles);
// router.delete('/:id', deleteFile);
exports.default = router;
