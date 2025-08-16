import express from 'express';
import { getAll, createHardware } from '../controllers/hardware.controller.js';

const router = express.Router();


router.get('/', getAll);



router.post('/',createHardware);

export default router;
