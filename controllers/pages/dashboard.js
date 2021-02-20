const Users = require('../../models/User');

/**
 * GET /
 * Home page.
 */
exports.getIndex = async (req, res) => {
  let fromDate = new Date(Date.now() - 60 * 60 * 24 * 30 * 1000); //30days

  const usersCount = await Users.countDocuments({isDelete: { '$ne': true}})
  const users30DayCount = await Users.countDocuments({isDelete: { '$ne': true}, createdAt: {'$gte': fromDate}})
  const applicationUserCount = await Users.countDocuments({isDelete: { '$ne': true}, type: "APPLICATION"})
  res.render('pages/dashboard/dashboard-index', {
    title: 'Dashboard',
    usersCount,
    users30DayCount,
    applicationUserCount
  });
};
