import ActivityModel from "../schemas/mongo/activity.schema";
import { Request, Response } from "express";

export const getActivities = async (req: Request, res: Response) => {
  try {
    const activities = await ActivityModel.find()
    .sort({ createdAt: -1 })
    .populate('activityAssistantId');
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json(error);
  }
}

export const createActivity = async (req: Request, res: Response) => {

  try {
    const activityResult = await ActivityModel.create(req.body);
    res.status(201).json(activityResult);
  } catch (error) {
    res.status(409).json({ message: error });
  }
}

export const getActivityCount = async (req: Request, res: Response) => {
  try {
    const count = await ActivityModel.countDocuments();
    res.status(200).json(count);
  } catch (error) {
    res.status(500).json(error);
  }
}
