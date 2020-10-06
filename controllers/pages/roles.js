exports.getIndex = (req, res) => {
    res.render("pages/roles/list", {
      title: "Roles",
    });
  };
  
  exports.getForm = (req, res) => {
    res.render("pages/roles/form", {
      title: "Form | Roles",
      id: req.query.id
    });
  };
  
  
  
  
  
  