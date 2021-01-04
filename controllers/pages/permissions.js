/**
 * @swagger
 *
 * definitions:
 *    Permission:
 *        type: "object"
 *        properties:
 *
 *          _id:
 *            type: "string"
 *          name:
 *            type: "string"
 *          createdAt:
 *            type: "string"
 *          updatedAt:
 *            type: "string"
 *
 *
 */

const PermissionModel = require("../../models/Permission");
const { errorReporter } = require("../../config/errorReporter");

exports.viewIndex = (req, res) => {
  res.render("pages/permissions/list", {
    title: "Permissions",
  });
};

exports.viewForm = (req, res) => {
  res.render("pages/permissions/form", {
    title: "Form | Permissions",
    id: req.query.id,
  });
};

/**
 * @swagger
 *
 * /api/v1/permissions/:
 *   get:
 *     description: You have to be an admin to use this endpoint. A list of all available permissions or a list of permissions filtered by name.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Permissions"
 *     responses:
 *       '200':
 *         description: A list of all available permissions or a list of permissions filtered by name.
 *       '400':
 *          description: Can be validation issue.
 *
 *     parameters:
 *       - in: query
 *         name: name
 *         required: false
 *         type: string
 *         description: Filter the list of permissions using permission's name.
 */
exports.getManyForm = async (req, res) => {
  const { name } = req.query;
  try {
    let permissions;

    console.log("name", name);

    if (name && name.length > 0) {
      permissions = await PermissionModel.find({
        name: { $regex: ".*" + name + ".*" },
        isDeleted: {
          $ne: true,
        },
      });
    } else {
      permissions = await PermissionModel.find({
        isDeleted: {
          $ne: true,
        },
      });
    }

    res.json({
      success: true,
      data: permissions,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/permissions/:
 *   post:
 *     description: You have to be an admin to use this endpoint. Create a new permission
 *     produces:
 *       - application/json
 *     tags:
 *       - "Permissions"
 *     responses:
 *       '201':
 *         description: Create a new permission.
 *     parameters:
 *       - name: name
 *         in: formData
 *         required: false
 *         type: string
 *
 */
exports.postManyForm = async (req, res) => {
  const { name } = req.body;

  console.log("permissions body", req.body);

  if (!name || name.length === 1) {
    return res.json({
      success: false,
      message: "Please enter a name for a permissions",
    });
  }

  const existingPermission = await PermissionModel.findOne({ name });

  if (existingPermission) {
    return res.json({
      success: false,
      message: "Permission already exist",
    });
  }

  const newPermission = new PermissionModel({
    name,
  });

  try {
    await newPermission.save();

    res.status(201).json({
      success: true,
      data: newPermission,
    });
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "There was an error with saving this permission.",
    });
  }
};

/**
 * @swagger
 *
 * /api/v1/permissions/:
 *   put:
 *     description: You have to be an admin to use this endpoint. Update many permissions at once, up to 10. Great for changing names.
 *     tags:
 *       - "Permissions"
 *     responses:
 *       '200':
 *         description: Update many permissions.
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: "The api wants a JSON object with a property of permissions. This property must be an array with a max length of 10."
 *         required: true
 *         schema:
 *            type: "object"
 *            properties:
 *              permissions:
 *                type: "array"
 *                items:
 *                  type: "object"
 *                  properties:
 *                    _id:
 *                      type: "string"
 *                      required: true
 *                    name:
 *                      type: "string"
 *
 *
 *
 *
 */

exports.putManyForm = async (req, res) => {
  let { permissions } = req.body;

  if (!permissions || permissions.length < 1) {
    return res.json({
      success: false,
      message: "Not permission properties found on attach object.",
    });
  }

  if (permissions.length > 10) {
    return res.json({
      success: false,
      message: "Permissions array can not be more than 10 items.",
    });
  }
  const permissionsRecordWithIdCount = permissions.filter((item) => {
    if (item._id) {
      return item;
    }
  }).length;

  if (permissions.length !== permissionsRecordWithIdCount) {
    return res.json({
      success: false,
      message: "Please ensure every record has an _id property.",
    });
  }

  try {
    const permissionsFromDb = await PermissionModel.find({
      _id: { $in: permissions.map((p) => p._id) },
      isDeleted: {
        $ne: true,
      },
    });

    if (permissions.length !== permissionsFromDb.length) {
      return res.json({
        success: false,
        message: "Note every record had a valid _id.",
      });
    }

    for (var i = 0; i < permissions.length; i++) {
      const permission = permissions[0];

      await PermissionModel.updateOne(
        { _id: permission._id },
        {
          $set: {
            name: permission.name,
          },
        }
      );
    }

    const returningPermissionsFromDb = await PermissionModel.find({
      _id: { $in: permissions.map((p) => p._id) },
    });

    res.json({
      success: true,
      data: returningPermissionsFromDb,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/permissions/:
 *   delete:
 *     description: You have to be an admin to use this endpoint. Delete many permissions at once, up to 10. Can be undone at a database level.
 *     tags:
 *       - "Permissions"
 *     responses:
 *       '200':
 *         description: You just soft deleted many permissions.
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: "The api wants a JSON object with a property of permissions. This property must be an array with a max length of 10."
 *         required: true
 *         schema:
 *            type: "object"
 *            properties:
 *              permissions:
 *                type: "array"
 *                items:
 *                  type: "object"
 *                  properties:
 *                    _id:
 *                      type: "string"
 *                      required: true
 *
 *
 *
 *
 */

exports.deleteManyForm = async (req, res) => {
  const { permissions } = req.body;
  const permissionsRecordWithIdCount = permissions.filter((item) => {
    if (item._id) {
      return item;
    }
  }).length;

  if (permissions.length !== permissionsRecordWithIdCount) {
    return res.json({
      success: false,
      message: "Please ensure every record has an _id.",
    });
  }

  try {
    const permissionsFromDb = await PermissionModel.find({
      _id: { $in: permissions.map((p) => p._id) },
    });

    if (permissions.length !== permissionsFromDb.length) {
      return res.json({
        success: false,
        message: "Please ensure every record has an existing _id.",
      });
    }

    for (var i = 0; i < permissions.length; i++) {
      const permission = permissions[0];

      await PermissionModel.updateOne(
        { _id: permission._id },
        {
          $set: {
            isDeleted: true,
          },
        }
      );
    }

    const returningPermissionsFromDb = await PermissionModel.find({
      _id: { $in: permissions.map((p) => p._id) },
    });

    res.json({
      success: true,
      message: "Multiple deletes executed successfully.",
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/permissions/{_id}:
 *   get:
 *     description: You have to be an admin to use this endpoint. Get a record of a permission.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Permissions"
 *     responses:
 *       '200':
 *         description: A record of a permission
 *
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         type: string
 *         description: Get permission by Id
 *
 */
exports.getSingleForm = async (req, res) => {
  const { _id } = req.params;

  console.log("id", req.params._id);

  try {
    const permission = await PermissionModel.findOne({
      _id,
      isDeleted: { $ne: true },
    });

    res.json({
      success: true,
      data: permission,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

exports.postSingleForm = async (req, res) => {
  res.send(405, "Method Not Allowed");
};

/**
 * @swagger
 *
 * /api/v1/permissions/{_id}:
 *   put:
 *     description: You have to be an admin to use this endpoint. Get a record of a permission.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Permissions"
 *     responses:
 *       '200':
 *         description: A record of a permission
 *
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         type: string
 *         description: Get permission by Id
 *       - in: "body"
 *         name: "body"
 *         description: "The api wants a JSON object with a property of permissions. This property must be an array with a max length of 10."
 *         required: true
 *         schema:
 *            type: "object"
 *            properties:
 *              name:
 *                type: "string"
 *
 */
exports.putSingleForm = async (req, res) => {
  const { body } = req;
  const { _id } = req.params;

  if (!body) {
    return res.json({
      success: false,
      message: "Did you attach anything to this request?",
    });
  }

  try {
    const permission = await PermissionModel.findOneAndUpdate(
      { _id, isDeleted: { $ne: true } },
      { name: body.name },
      { new: true }
    );

    res.json({
      success: true,
      data: permission,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/permissions/{_id}:
 *   delete:
 *     description: You have to be an admin to use this endpoint. Get a record of a permission.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Permissions"
 *     responses:
 *       '200':
 *         description: A record of a permission
 *
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         type: string
 *         description: Get permission by Id
 *
 */
exports.deleteSingleForm = async (req, res) => {
  const { body } = req;
  const { _id } = req.params;

  if (!body) {
    return res.json({
      success: false,
      message: "Did you attach anything to this request?",
    });
  }

  try {
    const permission = await PermissionModel.findOne({
      _id,
      isDeleted: { $ne: true },
    });

    if (!body) {
      return res.json({
        success: false,
        message: "Did you attach anything to this request?",
      });
    }

    const returningPermission = await PermissionModel.findOneAndUpdate(
      { _id },
      { isDeleted: true },
      { new: true }
    );

    res.json({
      success: true,
      data: returningPermission,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};
