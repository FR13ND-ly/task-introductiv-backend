import { Request, Response } from 'express';
import path from 'path';
import { FileModel } from '../models/FileModel';
import fs from 'fs';

export const createFile = async (req: Request, res: Response) => {
    try {
        const { name, parent } = req.body;
        // Determine if it's a folder by checking if a file was uploaded
        const isFolder = !req.file;

        // 1. Determine the relative path based on the parent
        let relativePath = '/';
        if (parent) {
            const parentDoc = await FileModel.findById(parent);
            if (!parentDoc || !parentDoc.isFolder) {
                // If a file was uploaded, delete it before sending the error response
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({ message: 'Invalid parent folder' });
            }
            // The new item's path is the parent's path joined with the parent's name
            relativePath = path.join(parentDoc.path, parentDoc.name);
        }

        const uploadsRoot = path.join(__dirname, '../../', 'uploads');
        let finalName = name;

        // 2. Handle the physical file/folder on the server's file system
        if (isFolder) {
            // It's a folder, so just create the directory
            const newFolderPath = path.join(uploadsRoot, relativePath, name);
            if (!fs.existsSync(newFolderPath)) {
                fs.mkdirSync(newFolderPath, { recursive: true });
            }
        } else if (req.file) {
            // It's a file, so move it from multer's temp location to the final destination
            const tempPath = req.file.path;
            const originalExtension = path.extname(req.file.originalname);
            finalName = name + originalExtension; // Append the original extension to the new name

            const finalDir = path.join(uploadsRoot, relativePath);
            const finalPath = path.join(finalDir, finalName);

            // Ensure the destination directory exists
            fs.mkdirSync(finalDir, { recursive: true });

            // Move the file
            fs.renameSync(tempPath, finalPath);
        }

        // 3. Save the metadata to the database
        const newFile = new FileModel({
            name: finalName, // Use the final name (with extension for files)
            parent,
            isFolder,
            path: relativePath, // This is the relative path of the containing directory
        });

        await newFile.save();
        res.status(201).json(newFile);

    } catch (error) {
        console.log(error);
        // If an error occurs after a file was uploaded, clean it up
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteFile = async (req: Request, res: Response) => {
    try {
        // 1. Find the document for the file or folder by its ID from the URL parameters
        const docToDelete = await FileModel.findById(req.params.id);

        // If no document is found, return a 404 error
        if (!docToDelete) {
            return res.status(404).json({ message: 'File or folder not found' });
        }

        const uploadsRoot = path.join(__dirname, '../../', 'uploads');
        const physicalPath = path.join(uploadsRoot, docToDelete.path, docToDelete.name);

        // 2. Handle deletion based on whether it's a folder or a file
        if (docToDelete.isFolder) {
            // It's a folder, so we need to delete it and all its contents recursively

            // First, find all descendant documents in the database
            // The path of any child item will start with the parent folder's path
            const folderPathForRegex = path.posix.join(docToDelete.path, docToDelete.name);
            const descendants = await FileModel.find({ path: { $regex: `^${folderPathForRegex}` } });

            // Create a list of all database IDs to delete (the folder itself + all descendants)
            const idsToDelete = [docToDelete._id, ...descendants.map(d => d._id)];

            // Delete all corresponding documents from the database in one operation
            await FileModel.deleteMany({ _id: { $in: idsToDelete } });

            // Now, delete the physical folder and its contents from the server's file system
            // We use { recursive: true, force: true } to remove all contents and ignore errors if the folder doesn't exist
            if (fs.existsSync(physicalPath)) {
                fs.rmSync(physicalPath, { recursive: true, force: true });
            }

        } else {
            // It's a single file, so the process is simpler

            // Delete the physical file from the file system
            if (fs.existsSync(physicalPath)) {
                fs.unlinkSync(physicalPath);
            }

            // Delete the file's document from the database
            await FileModel.findByIdAndDelete(req.params.id);
        }

        // 3. Send a success response
        res.status(200).json({ message: 'Item deleted successfully' });

    } catch (error) {
        console.error('Error during deletion:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
export const getFiles = async (req: Request, res: Response) => {
    try {
        const { currentPath } = req.query;

        let searchPath = currentPath as string;

        if (!searchPath || searchPath === '') {
            searchPath = '/';
        }

        if (searchPath !== '/' && !searchPath.endsWith('/')) {
            searchPath = `${searchPath}/`;
        }
        
        const query = { 
            path: searchPath 
        };
        
        const files = await FileModel
            .find(query)
            .sort({ 'metadata.createdAt': -1 });

        res.status(200).json(files);
        
    } catch (error) {
        console.error('Error fetching files by path:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};