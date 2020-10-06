exports.getIndex = (req, res) => {
    res.render("pages/user-management/list", {
      title: "User Management",
    });
  };
  
  exports.getForm = (req, res) => {
    res.render("pages/user-management/form", {
      title: "Form | User Management",
      id: req.query.id
    });
  };
  
  
  
  
  
  