import DailyQuiz from "../models/DailyQuiz.js";
import User from "../models/User.js";
import webpush from "web-push";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        "mailto:admin@neurosentinel.app",
        vapidPublicKey,
        vapidPrivateKey
    );
} else {
    console.warn("[QuizReminder] VAPID keys are missing. Push notifications are disabled.");
}

const getUsersForReminders = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const users = await User.find({
        _id: {$nin: await DailyQuiz.find({
            quizType: "daily",
            date: {$gte: todayStart, $lte: todayEnd}
        }).distinct("userId")}
    });
    return users;
}

const sendDailyQuizReminders = async () => {
    const usersToNotify = await getUsersForReminders();
    for (const user of usersToNotify) {
        if (user.pushSubscription?.endpoint) {
            try {
                await webpush.sendNotification(
                    user.pushSubscription,
                    JSON.stringify({
                    title: "Daily Quiz Reminder",
                    body: "Hey! You haven’t taken your daily mental health quiz today 😊"
                    })
                );
            } catch (error) {
                console.error("Error sending push notification to user", user._id, error);
            }
        }
    }
}

const subscribeToReminders = async (req, res) => {
    try {
        const userId = req.userId;
        const subscription = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return res.status(400).json({ success: false, message: "Invalid push subscription payload" });
        }

        await User.findByIdAndUpdate(userId, { pushSubscription: subscription });

        return res.status(201).json({ success: true, message: "Subscribed to daily reminders" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

export {sendDailyQuizReminders, getUsersForReminders, subscribeToReminders};
