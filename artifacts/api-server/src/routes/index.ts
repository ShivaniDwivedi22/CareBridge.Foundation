import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import caregiversRouter from "./caregivers";
import careRequestsRouter from "./care-requests";
import bookingsRouter from "./bookings";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(caregiversRouter);
router.use(careRequestsRouter);
router.use(bookingsRouter);
router.use(statsRouter);

export default router;
