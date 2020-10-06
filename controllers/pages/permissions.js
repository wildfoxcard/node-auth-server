exports.getIndex = (req, res) => {
    res.render("pages/permissions/list", {
      title: "Permissions",
    });
  };
  
  exports.getForm = (req, res) => {
    res.render("pages/permissions/form", {
      title: "Form | Permissions",
      id: req.query.id
    });
  };
  