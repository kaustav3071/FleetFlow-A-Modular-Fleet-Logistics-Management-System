import { Queue, Worker } from "bullmq";
import nodemailer from "nodemailer";
import redis, { isRedisAvailable } from "./redis.js";
import dotenv from "dotenv";

dotenv.config();

// ─── Nodemailer Transporter ────────────────────────────────
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Verify transporter on startup
transporter.verify().then(() => {
    console.log("✅ SMTP transporter is ready");
}).catch((err) => {
    console.warn("⚠️  SMTP transporter verification failed:", err.message);
});

// ─── BullMQ Email Queue (only if Redis is available) ───────
let emailQueue = null;
let emailWorker = null;

const initializeQueue = () => {
    if (!isRedisAvailable()) return;

    try {
        emailQueue = new Queue("email-queue", {
            connection: redis,
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: false,
                attempts: 3,
                backoff: { type: "exponential", delay: 2000 },
            },
        });

        emailWorker = new Worker(
            "email-queue",
            async (job) => {
                const { to, subject, html } = job.data;
                const info = await transporter.sendMail({
                    from: process.env.EMAIL_FROM || '"FleetFlow" <noreply@fleetflow.com>',
                    to, subject, html,
                });
                console.log(`📧 Email sent to ${to}: ${info.messageId}`);
                return info;
            },
            { connection: redis, concurrency: 5 }
        );

        emailWorker.on("completed", (job) => console.log(`✅ Email job ${job.id} completed`));
        emailWorker.on("failed", (job, err) => console.error(`❌ Email job ${job?.id} failed:`, err.message));

        console.log("✅ Email queue initialized with Redis");
    } catch (err) {
        console.warn("⚠️  Email queue initialization failed:", err.message);
    }
};

// Try to initialize after a short delay (gives Redis time to connect)
setTimeout(initializeQueue, 3000);

// ─── Helper: Send Email (queue or direct) ──────────────────
export const sendEmail = async ({ to, subject, html }) => {
    // If BullMQ queue is available, use it
    if (emailQueue && isRedisAvailable()) {
        await emailQueue.add("send-email", { to, subject, html });
        return;
    }

    // Fallback: send directly via transporter
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"FleetFlow" <noreply@fleetflow.com>',
            to, subject, html,
        });
        console.log(`📧 Email sent directly to ${to}: ${info.messageId}`);
    } catch (err) {
        console.error(`❌ Failed to send email to ${to}:`, err.message);
    }
};

export { emailQueue, emailWorker };
export default sendEmail;
