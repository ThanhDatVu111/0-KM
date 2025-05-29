import * as calendarController from '../controllers/calendarController';
import { Router } from 'express';

const router = Router();
router.post('/', calendarController.createCalendar);
router.get('/', calendarController.checkCalendar);
router.get('/filled', calendarController.checkCalendarFilled);

export default router;