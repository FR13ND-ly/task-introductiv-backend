"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFiles = exports.deleteFile = exports.createFile = void 0;
const path_1 = __importDefault(require("path"));
const FileModel_1 = require("../models/FileModel");
const fs_1 = __importDefault(require("fs"));
const createFile = async (req, res) => {
    try {
        const { name, parent } = req.body;
        // Determine if it's a folder by checking if a file was uploaded
        const isFolder = !req.file;
        // 1. Determine the relative path based on the parent
        let relativePath = '/';
        if (parent) {
            const parentDoc = await FileModel_1.FileModel.findById(parent);
            if (!parentDoc || !parentDoc.isFolder) {
                // If a file was uploaded, delete it before sending the error response
                if (req.file)
                    fs_1.default.unlinkSync(req.file.path);
                return res.status(400).json({ message: 'Invalid parent folder' });
            }
            // The new item's path is the parent's path joined with the parent's name
            relativePath = path_1.default.join(parentDoc.path, parentDoc.name);
        }
        const uploadsRoot = path_1.default.join(__dirname, '../../', 'uploads');
        let finalName = name;
        // 2. Handle the physical file/folder on the server's file system
        if (isFolder) {
            // It's a folder, so just create the directory
            const newFolderPath = path_1.default.join(uploadsRoot, relativePath, name);
            if (!fs_1.default.existsSync(newFolderPath)) {
                fs_1.default.mkdirSync(newFolderPath, { recursive: true });
            }
        }
        else if (req.file) {
            // It's a file, so move it from multer's temp location to the final destination
            const tempPath = req.file.path;
            const originalExtension = path_1.default.extname(req.file.originalname);
            finalName = name + originalExtension; // Append the original extension to the new name
            const finalDir = path_1.default.join(uploadsRoot, relativePath);
            const finalPath = path_1.default.join(finalDir, finalName);
            // Ensure the destination directory exists
            fs_1.default.mkdirSync(finalDir, { recursive: true });
            // Move the file
            fs_1.default.renameSync(tempPath, finalPath);
        }
        // 3. Save the metadata to the database
        const newFile = new FileModel_1.FileModel({
            name: finalName, // Use the final name (with extension for files)
            parent,
            isFolder,
            path: relativePath, // This is the relative path of the containing directory
        });
        await newFile.save();
        res.status(201).json(newFile);
    }
    catch (error) {
        console.log(error);
        // If an error occurs after a file was uploaded, clean it up
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.createFile = createFile;
const deleteFile = async (req, res) => {
    try {
        // 1. Find the document for the file or folder by its ID from the URL parameters
        const docToDelete = await FileModel_1.FileModel.findById(req.params.id);
        // If no document is found, return a 404 error
        if (!docToDelete) {
            return res.status(404).json({ message: 'File or folder not found' });
        }
        const uploadsRoot = path_1.default.join(__dirname, '../../', 'uploads');
        const physicalPath = path_1.default.join(uploadsRoot, docToDelete.path, docToDelete.name);
        // 2. Handle deletion based on whether it's a folder or a file
        if (docToDelete.isFolder) {
            // It's a folder, so we need to delete it and all its contents recursively
            // First, find all descendant documents in the database
            // The path of any child item will start with the parent folder's path
            const folderPathForRegex = path_1.default.posix.join(docToDelete.path, docToDelete.name);
            const descendants = await FileModel_1.FileModel.find({ path: { $regex: `^${folderPathForRegex}` } });
            // Create a list of all database IDs to delete (the folder itself + all descendants)
            const idsToDelete = [docToDelete._id, ...descendants.map(d => d._id)];
            // Delete all corresponding documents from the database in one operation
            await FileModel_1.FileModel.deleteMany({ _id: { $in: idsToDelete } });
            // Now, delete the physical folder and its contents from the server's file system
            // We use { recursive: true, force: true } to remove all contents and ignore errors if the folder doesn't exist
            if (fs_1.default.existsSync(physicalPath)) {
                fs_1.default.rmSync(physicalPath, { recursive: true, force: true });
            }
        }
        else {
            // It's a single file, so the process is simpler
            // Delete the physical file from the file system
            if (fs_1.default.existsSync(physicalPath)) {
                fs_1.default.unlinkSync(physicalPath);
            }
            // Delete the file's document from the database
            await FileModel_1.FileModel.findByIdAndDelete(req.params.id);
        }
        // 3. Send a success response
        res.status(200).json({ message: 'Item deleted successfully' });
    }
    catch (error) {
        console.error('Error during deletion:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.deleteFile = deleteFile;
const getFiles = async (req, res) => {
    try {
        const { currentPath } = req.query;
        let searchPath = currentPath;
        if (!searchPath || searchPath === '') {
            searchPath = '/';
        }
        if (searchPath !== '/' && !searchPath.endsWith('/')) {
            searchPath = `${searchPath}/`;
        }
        const query = {
            path: searchPath
        };
        const files = await FileModel_1.FileModel
            .find(query)
            .sort({ 'metadata.createdAt': -1 });
        res.status(200).json(files);
    }
    catch (error) {
        console.error('Error fetching files by path:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.getFiles = getFiles;
