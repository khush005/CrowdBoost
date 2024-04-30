const express = require('express')
const projectController = require('../controllers/project')
const auth = require('../middleware/auth')
const multer = require('multer')

const router = express.Router()

const upload = multer({
  // dest: "avatars",
  limits: {
    fileSize: 10000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(
        new Error("Plz upload a image of format either jpg, jpeg or png")
      );
    }
    cb(undefined, true);
  },
});


router.get(
  "/createProject",
  
  auth,
  projectController.getCreateProject
);

router.post(
  "/createProject",
  upload.single("avatar"),
  auth,
  projectController.postCreateProject
);

router.get('/getAllProjects', projectController.getAllProjects)
router.get("/getAllAuthProjects", auth, projectController.getAllAuthProjects);
router.get('/getProjectById/:id', projectController.getProjectById);
router.get("/getUserProjectById/:id", projectController.getUserProjectById);
router.get('/getUserProjects', auth, projectController.getUserProjects)
router.get("/getFundedProjects", auth, projectController.getFundedProjects);

router.get("/projects/:projectId", auth, projectController.getProjectDetails);
router.post("/projects/raiseFunds/:projectId", auth, projectController.raiseFunds);

router.get("/editProject/:projectId", projectController.getEditProject);
router.post("/updateProject/:projectId", upload.single("avatar"), auth, projectController.postEditProject )
router.get("/deleteProject/:projectId", auth, projectController.deleteProject)

module.exports = router