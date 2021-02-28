const { errorReporterWithHtml } = require("../../processes/errorReporter");

/**
 * GET /
 * Home page.
 */
exports.getAbout = async (req, res) => {
  try {
    res.render("pages/documentation/about", {
      title: "About | Docs"
    });
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

exports.getHooks = async (req, res) => {
  try {
    res.render("pages/documentation/hooks", {
      title: "Hooks | Docs"
    });
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

exports.getImports = async (req, res) => {
  try {
    res.render("pages/documentation/imports", {
      title: "Imports | Docs"
    });
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

exports.getWhitePaper = async (req, res) => {
  try {
    res.render("pages/documentation/white-paper", {
      title: "White Paper | Docs"
    });
  } catch (err) {
    errorReporterWithHtml({
      err,
      res,
      message: "Fatal Error Logged.",
    });
  }
};

