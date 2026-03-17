import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import compareRouter from "./compare.js";
import historyRouter from "./history.js";
import settingsRouter from "./settings.js";
import billingRouter from "./billing.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(compareRouter);
router.use(historyRouter);
router.use(settingsRouter);
router.use(billingRouter);

export default router;
