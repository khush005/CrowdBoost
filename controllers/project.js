const { configDotenv } = require("dotenv");
const Project = require("../models/project");
const JWT = require("jsonwebtoken");
const sharp = require("sharp");
const User = require("../models/user");
const { default: mongoose } = require("mongoose");
require("dotenv").config();

exports.getCreateProject = async (req, res) => {
  try {
    res.render("user/createProject", {
      path: "/createProject",
    });
  } catch (e) {
    res.status(500).send(e);
    console.log(e);
  }
};

exports.postCreateProject = async (req, res) => {
  try {
    const token = req.cookies.jwt;
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    const user_id = decoded._id;

    console.log(token);
    const project = new Project({
      ...req.body,
      creator_id: user_id,
      avatar: req.file.buffer,
    });

    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    project.avatar = buffer;

    await project.save();

    res.redirect("/createProject");
    // res.status(201).send(project)
  } catch (e) {
    console.log(e);
    res.status(500).send("Internal server error");
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    // const project = await Project.find({}, { title: 1, target_amount: 1, current_amount: 1 })
    const project = await Project.find({});
    project.forEach((projectImg) => {
      if (projectImg.avatar) {
        projectImg.avatar = projectImg.avatar.toString("base64");
      }
    });
    // res.json(project)
    res.render("user/projects", {
      projects: project,
      // pageTitle: 'Project',
      path: "/getAllProjects",
    });
  } catch (e) {
    res.status(500).send(e);
  }
};

exports.getAllAuthProjects = async (req, res) => {
  try {
    // const project = await Project.find({}, { title: 1, target_amount: 1, current_amount: 1 })
    const project = await Project.find({});
    project.forEach((projectImg) => {
      if (projectImg.avatar) {
        projectImg.avatar = projectImg.avatar.toString("base64");
      }
    });
    // res.json(project)
    res.render("user/authProjects", {
      projects: project,
      // pageTitle: 'Project',
      path: "/getAllAuthProjects",
    });
  } catch (e) {
    res.status(500).send(e);
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const _id = req.params.id;
    // const project = await Project.findOne({ _id, creator_id: req.user._id})        // If to add authentication
    const project = await Project.findById(_id);
    if (!project) {
      res.status(404).send("No such project found");
    }
    // res.send(project)
    console.log(project);
    res.render("user/projectDetail", {
      project: project,
      path: "/getProjectById",
    });
  } catch (e) {
    res.status(400).send(e);
    console.log(e);
  }
};


exports.getUserProjectById = async (req, res) => {
  try {
    const _id = req.params.id;
    // const project = await Project.findOne({ _id, creator_id: req.user._id})        // If to add authentication
    const project = await Project.findById(_id);
    if (!project) {
      res.status(404).send("No such project found");
    }
    // res.send(project)
    console.log(project);
    res.render("user/userProjectDetails", {
      project: project,
      path: "/getUserProjectById",
    });
  } catch (e) {
    res.status(400).send(e);
    console.log(e);
  }
};

exports.getUserProjects = async (req, res) => {
  try {
    await req.user.populate({
      // userProjects: userProjects,
      path: "projects",
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
      },
    });

    req.user.projects.forEach((projectImg) => {
      if (projectImg.avatar) {
        projectImg.avatar = projectImg.avatar.toString("base64");
      }
    });

    res.render("user/getUserProjects", {
      userProjects: req.user.projects,
      path: "/getUserProjects",
    });
    // res.status(200).send(req.user.projects)
  } catch (e) {
    res.status(500).send("Internal server error");
    console.log(e);
  }
};

exports.getFundedProjects = async (req, res) => {
  try {
    await req.user.populate({
      path: "projects",
      match: {
        current_amount: { $gt: 0 },
      },
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
      },
      //   select: 'date title creator_id email current_amount'
    });

    res.render("user/fundProjects", {
      projectsFunded: req.user.projects,
      path: "/getFundedProjects",
    });
    // res.status(200).send(req.user.projects);
  } catch (e) {
    res.status(500).send("Internal server error");
    console.log(e);
  }
};

exports.getProjectDetails = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
    .populate({
      path: 'donations',
      populate: {path: "user_id"}
    })

    if (!project) {
      return res.status(404).render("error", { message: "Project not found" });
    }
    res.render("user/authProjects", { project, path: "/projects/:projectId" });

  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.raiseFunds = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const amtToAdd = parseInt(req.body.current_amount, 10);

    if (!amtToAdd || amtToAdd <= 0) {
      return res.status(400).send({ message: "Invalid amount" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).send({ message: "Project not found." });
    }

    project.current_amount += amtToAdd;
    await project.save();

    const userId = req.user._id;
    const user = await User.findById(userId);
    if(!user) {
      return res.status(404).send('User not found')
    }
    else {
      user.donations.push({
        project: projectId,
        title: project.title,
        amountDonated: amtToAdd,
        dateDonated: new Date(),
      });
    }

    // const isAlreadyDonated = user.donations.some((donation) =>
    //   donation.project.equals(projectId)
    // );

    // if (!isAlreadyDonated) {
      
      await user.save();
    // } else {
      // res.status(400).send("You have already donated to this project.");
    // }

    // res.redirect("/getAllAuthProjects");
    res.redirect("/getMyDonations")
    // res.redirect("/projects/:projectId" + projectId);
    // res.status(200).send({message: 'Funds Raised Successfully', project});
  } catch (e) {
    res.status(500).send("Internal server error");
    console.log(e);
  }
};

exports.getEditProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      throw new Error("Project Not Found");
    }

    if (project.avatar) {
      project.avatar = project.avatar.toString("base64")
    }

    res.render("user/editProject", {
      path: "/editProject",
      project
    })
  } catch (e) {
    res.status(500).send(e);
    console.log(e);
  }
};

exports.postEditProject = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No image has been provided')
    }

    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    // project.avatar = buffer;

    const { title, description, target_amount, current_amount  } = req.body;

    const project = await Project.findByIdAndUpdate(
      req.params.projectId,
      {
        title,
        description,
        target_amount,
        current_amount,
        avatar: buffer,
      },
      { new: true }
    );

    if (!project) {
      res.status(404).send("Project Not found!");
    } else {
      res.redirect("/getUserProjects");
    }
  } catch (e) {
    res.status(500).send(e);
    console.log(e);
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { _id: userId } = req.user;

    // Find the project to ensure it exists and belongs to the user
    const project = await Project.findOne({
      _id: projectId,
      creator_id: userId,
    });
    if (!project) {
      return res
        .status(404)
        .render("error", {
          message: "Project not found or not authorized to delete",
        });
    }

    // Delete the project
    await Project.findByIdAndDelete(projectId);

    // Remove the donations related to this project from all user documents
    await User.updateMany(
      { "donations.project": projectId },
      { $pull: { donations: { project: projectId } } }
    );

    res.redirect("/getUserProjects");
  } catch (e) {
    console.error(e);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};




