/**
 * GET /
 * Home page.
 */
exports.getIndex = (req, res) => {
  res.render("pages/settings/settings-index", {
    title: "General | Settings",
  });
};


exports.getApplications = (req, res) => {
  res.render("pages/settings/settings-applications", {
    title: "Applications | Settings",
  });
};

exports.getCors = (req, res) => {
  res.render("pages/settings/settings-cors", {
    title: "Cors | Settings",
  });
};

exports.getEmailTemplates = (req, res) => {
  res.render("pages/settings/settings-email-templates", {
    title: "Email Templates | Settings",
  });
};

exports.getPasswordPolicy = (req, res) => {
  res.render("pages/settings/settings-password-policy", {
    title: "Password Policy | Settings",
  });
};

exports.getPrivacyPolicy = (req, res) => {
  res.render("pages/settings/settings-privacy-policy", {
    title: "Privacy Policy | Settings",
  });
};

exports.getThirdParties = (req, res) => {
  res.render("pages/settings/settings-third-parties", {
    title: "Third Parties | Settings",
  });
};





