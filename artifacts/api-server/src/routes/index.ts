import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import caregiversRouter from "./caregivers";
import careRequestsRouter from "./care-requests";
import bookingsRouter from "./bookings";
import statsRouter from "./stats";
import reviewsRouter from "./reviews";
import conversationsRouter from "./conversations";
import adminRouter from "./admin";
import paymentsRouter from "./payments";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(caregiversRouter);
router.use(careRequestsRouter);
router.use(bookingsRouter);
router.use(statsRouter);
router.use(reviewsRouter);
router.use(conversationsRouter);
router.use(adminRouter);
router.use(paymentsRouter);
router.use(contactRouter);

export default router;
