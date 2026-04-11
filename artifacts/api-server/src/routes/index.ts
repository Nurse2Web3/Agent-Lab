import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import compareRouter from "./compare.js";
import compareStreamRouter from "./compare-stream.js";
import historyRouter from "./history.js";
import settingsRouter from "./settings.js";
import billingRouter from "./billing.js";
import trialRouter from "./trial.js";
import templatesRouter from "./templates.js";
import usageRouter from "./usage.js";
import webhooksRouter from "./webhooks.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(trialRouter);
router.use(compareRouter);
router.use(compareStreamRouter);
router.use(historyRouter);
router.use(settingsRouter);
router.use(billingRouter);
router.use(templatesRouter);
router.use(usageRouter);
router.use(webhooksRouter);

export default router;
