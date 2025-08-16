import express from 'express';
import { getAll, createHardware } from '../controllers/hardware.controller.js';

const router = express.Router();

// GET route to fetch all hardware data
router.get('/', getAll);

// POST route to save hardware data
// router.post('/', createHardware);

router.post('/',createHardware);

export default router;
