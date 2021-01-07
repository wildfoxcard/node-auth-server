/**
 * @swagger
 *
 * definitions:
 *    Role:
 *        type: "object"
 *        properties:
 *          _id:
 *            type: "string"
 *          name:
 *            type: "string"
 *          roles:
 *            type: "array"
 *            items:
 *              type: "object"
 *              properties:
 *                _id:
 *                  type: "string"
 *                  required: true
 *                name:
 *                  type: "string"
 *
 *
 */
const RoleModel = require("../../models/Role");
const PermissionModel = require("../../models/Permission");
const { errorReporter } = require("../../config/errorReporter");

exports.getIndex = (req, res) => {
  res.render("pages/roles/list", {
    title: "Roles",
  });
};

exports.getForm = async (req, res) => {
  let data;

  if (req.query.id) {
    data = await RoleModel.findById(req.query.id);
  }

  res.render("pages/roles/form", {
    title: "Form | Roles",
    id: req.query.id,
    data
  });
};

/**
 * @swagger
 *
 * /api/v1/roles/:
 *   get:
 *     description: You have to be an admin to use this endpoint. A list of all available roles or a list of roles filtered by name.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Roles"
 *     responses:
 *       '200':
 *         description: A list of all available roles or a list of roles filtered by name.
 *       '400':
 *          description: Can be validation issue.
 *
 *     parameters:
 *       - in: query
 *         name: name
 *         required: false
 *         type: string
 *         description: Filter the list of roles using role's name.
 */
exports.getManyForm = async (req, res) => {
  const { name } = req.query;
  try {
    let queryObj;

    if (name && name.length > 0) {
      queryObj = {
        name: { $regex: ".*" + name + ".*" },
        isDeleted: {
          $ne: true,
        },
      };
    } else {
      queryObj = {
        isDeleted: {
          $ne: true,
        },
      };
    }

    const roles = await RoleModel.find(queryObj).populate("permissions").exec();

    console.log("roles", roles);

    res.json({
      success: true,
      data: roles,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/roles/:
 *   post:
 *     description: You have to be an admin to use this endpoint. Create a new role
 *     produces:
 *       - application/json
 *     tags:
 *       - "Roles"
 *     responses:
 *       '201':
 *         description: Create a new role.
 *     parameters:
 *       - name: name
 *         in: formData
 *         required: false
 *         type: string
 *
 */
exports.postManyForm = async (req, res) => {
  const { name } = req.body;

  console.log("roles body", req.body);

  if (!name || name.length === 1) {
    return res.json({
      success: false,
      message: "Please enter a name for a roles",
    });
  }

  const existingRole = await RoleModel.findOne({ name });

  if (existingRole) {
    return res.json({
      success: false,
      message: "Role already exist",
    });
  }

  const newRole = new RoleModel({
    name,
  });

  try {
    await newRole.save();

    res.status(201).json({
      success: true,
      data: newRole,
    });
  } catch (err) {
    errorReporter({
      err,
      res,
      message: "There was an error with saving this role.",
    });
  }
};

/**
 * @swagger
 *
 * /api/v1/roles/:
 *   put:
 *     description: You have to be an admin to use this endpoint. Update many roles at once, up to 10. Great for changing names.
 *     tags:
 *       - "Roles"
 *     responses:
 *       '200':
 *         description: Update many roles.
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: "The api wants a JSON object with a property of roles. This property must be an array with a max length of 10."
 *         required: true
 *         schema:
 *            type: "object"
 *            properties:
 *              roles:
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
  let { roles } = req.body;

  if (!roles || roles.length < 1) {
    return res.json({
      success: false,
      message: "Not role properties found on attach object.",
    });
  }

  if (roles.length > 10) {
    return res.json({
      success: false,
      message: "Roles array can not be more than 10 items.",
    });
  }
  const rolesRecordWithIdCount = roles.filter((item) => {
    if (item._id) {
      return item;
    }
  }).length;

  if (roles.length !== rolesRecordWithIdCount) {
    return res.json({
      success: false,
      message: "Please ensure every record has an _id property.",
    });
  }

  try {
    const rolesFromDb = await RoleModel.find({
      _id: { $in: roles.map((p) => p._id) },
      isDeleted: {
        $ne: true,
      },
    });

    if (roles.length !== rolesFromDb.length) {
      return res.json({
        success: false,
        message: "Note every record had a valid _id.",
      });
    }

    for (var i = 0; i < roles.length; i++) {
      const role = roles[0];

      await RoleModel.updateOne(
        { _id: role._id },
        {
          $set: {
            name: role.name,
          },
        }
      );
    }

    const returningRolesFromDb = await RoleModel.find({
      _id: { $in: roles.map((p) => p._id) },
    });

    res.json({
      success: true,
      data: returningRolesFromDb,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/roles/:
 *   delete:
 *     description: You have to be an admin to use this endpoint. Delete many roles at once, up to 10. Can be undone at a database level.
 *     tags:
 *       - "Roles"
 *     responses:
 *       '200':
 *         description: You just soft deleted many roles.
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: "The api wants a JSON object with a property of roles. This property must be an array with a max length of 10."
 *         required: true
 *         schema:
 *            type: "object"
 *            properties:
 *              roles:
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
  const { roles } = req.body;
  const rolesRecordWithIdCount = roles.filter((item) => {
    if (item._id) {
      return item;
    }
  }).length;

  if (roles.length !== rolesRecordWithIdCount) {
    return res.json({
      success: false,
      message: "Please ensure every record has an _id.",
    });
  }

  try {
    const rolesFromDb = await RoleModel.find({
      _id: { $in: roles.map((p) => p._id) },
    });

    if (roles.length !== rolesFromDb.length) {
      return res.json({
        success: false,
        message: "Please ensure every record has an existing _id.",
      });
    }

    for (var i = 0; i < roles.length; i++) {
      const role = roles[0];

      await RoleModel.updateOne(
        { _id: role._id },
        {
          $set: {
            isDeleted: true,
          },
        }
      );
    }

    const returningRolesFromDb = await RoleModel.find({
      _id: { $in: roles.map((p) => p._id) },
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
 * /api/v1/roles/{_id}:
 *   get:
 *     description: You have to be an admin to use this endpoint. Get a record of a role.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Roles"
 *     responses:
 *       '200':
 *         description: A record of a role
 *
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         type: string
 *         description: Get role by Id
 *
 */
exports.getSingleForm = async (req, res) => {
  const { _id } = req.params;

  console.log("id", req.params._id);

  try {
    const role = await RoleModel.findOne({
      _id,
      isDeleted: { $ne: true },
    }).populate("permissions").exec();

    res.json({
      success: true,
      data: role,
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
 * /api/v1/roles/{_id}:
 *   put:
 *     description: You have to be an admin to use this endpoint. Get a record of a role.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Roles"
 *     responses:
 *       '200':
 *         description: A record of a role
 *
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         type: string
 *         description: Get role by Id
 *       - in: "body"
 *         name: "body"
 *         description: "The api wants a JSON object with a property of roles. This property must be an array with a max length of 10."
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
    const role = await RoleModel.findOneAndUpdate(
      { _id, isDeleted: { $ne: true } },
      { name: body.name },
      { new: true }
    );

    res.json({
      success: true,
      data: role,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/roles/{_id}:
 *   delete:
 *     description: You have to be an admin to use this endpoint. Get a record of a role.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Roles"
 *     responses:
 *       '200':
 *         description: A record of a role
 *
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         type: string
 *         description: Get role by Id
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
    const role = await RoleModel.findOne({
      _id,
      isDeleted: { $ne: true },
    });

    if (!body) {
      return res.json({
        success: false,
        message: "Did you attach anything to this request?",
      });
    }

    const returningRole = await RoleModel.findOneAndUpdate(
      { _id },
      { isDeleted: true },
      { new: true }
    );

    res.json({
      success: true,
      message: "Record has been successfully deleted.",
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/roles/{_rolesId}/permissions/:
 *   post:
 *     description: You have to be an admin to use this endpoint. Get a record of a role.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Roles"
 *     responses:
 *       '200':
 *         description: A record of a role
 *
 *     parameters:
 *       - in: path
 *         name: _rolesId
 *         required: true
 *         type: string
 *         description: "Get role by id"
 *
 *       - in: "body"
 *         name: "body"
 *         description: "Add permission to Role by _id"
 *         required: true
 *         schema:
 *            type: "object"
 *            properties:
 *              _id:
 *                type: "string"
 *                required: true
 *
 */

exports.postSingleAddPermissionToRole = async (req, res) => {
  const { body } = req;
  const _permissionId = body._id;
  const _roleId = req.params._id;

  if (!body) {
    return res.json({
      success: false,
      message: "Did you attach anything to this request?",
    });
  }

  if (!_permissionId) {
    return res.json({
      success: false,
      message: "request requires a json object with an _id of permissions _id.",
    });
  }

  try {
    const permissionsWithSameId = await PermissionModel.findById(_permissionId);

    if (permissionsWithSameId === null) {
      return res.json({
        success: false,
        message:
          "request requires a json object with an _id of an active permissions.",
      });
    }

    const newRole = await RoleModel.findOneAndUpdate(
      { _id: _roleId },
      { $push: { permissions: { _id: _permissionId } } },
      { new: true }
    );

    res.json({
      success: true,
      data: newRole,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};

/**
 * @swagger
 *
 * /api/v1/roles/{_rolesId}/permissions/{_permissionsId}:
 *   delete:
 *     description: You have to be an admin to use this endpoint. Get a record of a role.
 *     produces:
 *       - application/json
 *     tags:
 *       - "Roles"
 *     responses:
 *       '200':
 *         description: A record of a role
 *
 *     parameters:
 *       - in: path
 *         name: _rolesId
 *         required: true
 *         type: string
 *         description: The role record you want
 *       - in: path
 *         name: _permissionsId
 *         required: true
 *         type: string
 *         description: The permission you want to delete on this record.
 *
 */

exports.deleteSinglePermissionInArrayForRole = async (req, res) => {
  const _permissionId = req.params._permissionsId;
  const _roleId = req.params._id;

  try {
    const rolesWithSameId = await RoleModel.findById(_roleId);

    if (rolesWithSameId === null) {
      return res.json({
        success: false,
        message: "Role doesn't exist.",
      });
    }

    const newRole = await RoleModel.findOneAndUpdate(
      { _id: _roleId },
      { $pull: { permissions: { _id: _permissionId } } },
      { new: true }
    );

    res.json({
      success: true,
      data: newRole,
    });
  } catch (err) {
    errorReporter({ err, res });
  }
};
