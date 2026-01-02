import {
  createGroupService,
  getGroupsService,
  updateGroupService,
  deleteGroupService,
} from "../service/group.service.js";

export const createGroup = async (req, res) => {
  try {
    const group = await createGroupService(req.user.id, req.body);
    res.status(201).json({ message: "Group created", group });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const getGroups = async (req, res) => {
  try {
    const groups = await getGroupsService(req.user.id);
    res.status(200).json(groups);
  } catch {
    res.status(500).json({ message: "Failed to fetch groups" });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const group = await updateGroupService(
      req.user.id,
      req.params.id,
      req.body
    );
    res.status(200).json({ message: "Group updated", group });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    await deleteGroupService(req.user.id, req.params.id);
    res.status(200).json({ message: "Group deleted" });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
};
