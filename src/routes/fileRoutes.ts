import { Router } from 'express';
import { createFile, getFiles } from '../controllers/FileController';
import { deleteFile } from '../controllers/FileController';
import { upload } from '../middleware/multer';
// import { uploadFile, getFiles, deleteFile, createFolder } from '../controllers/filleController';


const router = Router();

// Routes
router.post('/', upload.single("file"), createFile);
router.delete('/:id', deleteFile);
router.get('/', getFiles)
// router.post('/folder', createFolder);
// router.get('/', getFiles);
// router.delete('/:id', deleteFile);

export default router;
