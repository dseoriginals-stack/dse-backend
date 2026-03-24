router.get("/admin/all", verifyToken, requireRole(["admin"]), getAllStoriesAdmin)
router.put("/:id", verifyToken, requireRole(["admin"]), updateStory)
router.delete("/:id", verifyToken, requireRole(["admin"]), deleteStory)