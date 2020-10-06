/**
 * GET /
 * Home page.
 */
exports.getIndex = (req, res) => {
  res.render('pages/dashboard/dashboard-index', {
    title: 'Dashboard'
  });
};
