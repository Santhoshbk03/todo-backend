import { getDashboardService, getStreakService } from "../service/dashboard.service.js";

export const getDashboard = async (req, res) => {
  try {
    const data = await getDashboardService(req.user.id);
    res.status(200).json(data);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      message: "Failed to load dashboard",
    });
  }
};

export const getStreak = async (req, res) => {
  try {
    const streakData = await getStreakService(req.user.id);
    res.status(200).json(streakData);
  } catch (error) {
    console.error('Streak error:', error);
    res.status(500).json({
      message: "Failed to load streak data",
    });
  }
};