/**
 * Module dependencies.
 */
const express = require("express");
const compression = require("compression");
const session = require("express-session");
const bodyParser = require("body-parser");
const logger = require("morgan");
const chalk = require("chalk");
const errorHandler = require("errorhandler");
const lusca = require("lusca");
const dotenv = require("dotenv");
const MongoStore = require("connect-mongo")(session);
const flash = require("express-flash");
const path = require("path");
const mongoose = require("mongoose");
const passport = require("passport");
const expressStatusMonitor = require("express-status-monitor");
const sass = require("node-sass-middleware");
const multer = require("multer");
const jwt = require('./config/jwt');
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cors = require('cors');

const upload = multer({ dest: path.join(__dirname, "uploads") });

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: ".env.example" });

/**
 * Controllers (route handlers).
 */
const apiController = require("./controllers/api");
const dashboardController = require("./controllers/pages/dashboard");
const permissionsController = require("./controllers/pages/permissions");
const rolesController = require("./controllers/pages/roles");
const userManagementController = require("./controllers/pages/user-management");
const settingsController = require("./controllers/pages/settings");
const userController = require("./controllers/user");
const userApiController = require("./controllers/user-api");
const userRequestController = require("./controllers/pages/user-request");
const errorsController = require("./controllers/pages/errors");
const documentationController = require("./controllers/pages/documentation");


/**
 * Swagger configuration. https://swagger.io/specification/#infoObject
 */
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'Auth API',
      description: "This documentation is for JSON APIs. GraphQL is currectly not support.",
      contact: {
        name: "Wild Fox Card"
      },
      servers:["http://localhost:8080"],
    }
  },
  apis: ['./controllers/*.js', './controllers/pages/*.js']
}

const swaggerDocs = swaggerJsDoc(swaggerOptions)

/**
 * API keys and Passport configuration.
 */
const passportConfig = require("./config/passport");
const Settings = require("./models/Settings");

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on("error", (err) => {
  console.error(err);
  console.log(
    "%s MongoDB connection error. Please make sure MongoDB is running.",
    chalk.red("✗")
  );
  process.exit();
});

//create settings if doesn't exist.
(async () => {
  if (await Settings.countDocuments() <= 0) {
    const settings = new Settings();
  
    await settings.save();
  }
})()

/**
 * Express configuration.
 */
app.set("host", process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0");
app.set("port", process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(expressStatusMonitor());
app.use(compression());
app.use(
  sass({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
  })
);

app.options('*', cors()) // include before other routes
app.use(cors())
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    cookie: { maxAge: 1209600000 }, // two weeks in milliseconds
    store: new MongoStore({
      url: process.env.MONGODB_URI,
      autoReconnect: true,
    }),
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(jwt.authenticateToken);
app.use(flash());
app.use((req, res, next) => {
  if (req.path === "/api/upload" || req.path.substr(0, 4) === "/api") {
    // Multer multipart/form-data handling needs to occur before the Lusca CSRF check.
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
});
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));
app.disable("x-powered-by");
app.use(async (req, res, next) => {
  res.locals.user = req.user;
  
  const settingsForLocals = await Settings.findOne({});
  res.locals.serverName = settingsForLocals.general.serverName
  res.locals.serverMainUrl = settingsForLocals.general.serverMainUrl

  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (
    !req.user &&
    req.path !== "/login" &&
    req.path !== "/signup" &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/\./)
  ) {
    req.session.returnTo = req.originalUrl;
  } else if (
    req.user &&
    (req.path === "/account" || req.path.match(/^\/api/))
  ) {
    req.session.returnTo = req.originalUrl;
  }
  next();
});
app.use(
  "/",
  express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/chart.js/dist"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/popper.js/dist/umd"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/js"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/jquery/dist"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/chart.js/dist"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/datatables.net-bs4/js"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/datatables.net/js"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/datatables.net-buttons-bs4/js"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/bootstrap-notify"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/sweetalert/dist"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/css/lib",
  express.static(path.join(__dirname, "node_modules/datatables.net-bs4/css"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/css/lib",
  express.static(path.join(__dirname, "node_modules/datatables.net-buttons-bs4/css"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/webfonts",
  express.static(
    path.join(__dirname, "node_modules/@fortawesome/fontawesome-free/webfonts"),
    { maxAge: 31557600000 }
  )
);

/**
 * Accounts.
 */
app.get("/login/", userController.getLogin);
app.post("/login/", userController.postLogin);
// app.post("/api/v1/account/login/", userApiController.apiPostLogin)

app.get("/logout/", userController.logout);

// app.post('/api/v1/account/refresh-token/', userApiController.apiRefreshToken)

app.get("/forgot/", userController.getForgot);
app.post("/forgot/", userController.postForgot);
// app.post("/api/v1/account/forgot/", userApiController.apiPostForgot);

app.get("/reset/:token", userController.getReset);
app.post("/reset/:token", userController.postReset);
// app.post("/api/v1/account/reset/:token", userApiController.apiPostReset);

app.get("/signup/", userController.getSignup);
app.get("/signup/request/", userController.getRequest);
app.post("/signup/", userController.postSignup);
// app.post("/api/v1/account/signup/", userApiController.apiPostSignup);


app.post("/api/v1/login/", userApiController.postLogin);
app.post("/api/v1/signup/", userApiController.postSignup);
app.post("/api/v1/forgot/", userApiController.postForgot);
app.post("/api/v1/reset/:token/", userApiController.postReset);
app.post("/api/v1/account/profile/", passportConfig.isAuthenticated,userApiController.postUpdateProfile);
app.post("/api/v1/account/password/", passportConfig.isAuthenticated,userApiController.postUpdatePassword);
app.post("/api/v1/account/delete/",passportConfig.isAuthenticated, userApiController.postDeleteAccount);
app.post("/api/v1/account/verify/",passportConfig.isAuthenticated, userApiController.postVerifyEmail);
app.post("/api/v1/account/verify/:token",passportConfig.isAuthenticated, userApiController.postVerifyEmailToken);



app.get(
  "/account/verify/",
  passportConfig.isAuthenticated,
  userController.getVerifyEmail
);
app.get(
  "/account/verify/:token",
  passportConfig.isAuthenticated,
  userController.getVerifyEmailToken
);
app.get("/account/", passportConfig.isAuthenticated, userController.getAccount);
app.post(
  "/account/profile/",
  passportConfig.isAuthenticated,
  userController.postUpdateProfile
);
app.post(
  "/account/password/",
  passportConfig.isAuthenticated,
  userController.postUpdatePassword
);
app.post(
  "/account/delete/",
  passportConfig.isAuthenticated,
  userController.postDeleteAccount
);
app.get(
  "/account/unlink/:provider",
  passportConfig.isAuthenticated,
  userController.getOauthUnlink
);

/**
 * API Accounts.
 */
// app.post('/api/v1/account/login', userController.apiPostLogin)

/**
 * Primary app routes.
 */
app.get("/", passportConfig.isAdmin, dashboardController.getIndex);
app.get("/dashboard", passportConfig.isAdmin, dashboardController.getIndex);

app.get("/roles/", passportConfig.isAdmin, rolesController.getIndex);
app.get("/roles/form/", passportConfig.isAdmin, rolesController.getForm);
// roles api
app.get('/api/v1/roles/', passportConfig.isAdmin, rolesController.getManyForm); 
app.post('/api/v1/roles/', passportConfig.isAdmin, rolesController.postManyForm); 
app.put('/api/v1/roles/', passportConfig.isAdmin, rolesController.putManyForm); 
app.delete('/api/v1/roles/', passportConfig.isAdmin, rolesController.deleteManyForm);

app.get('/api/v1/roles/:_id/', passportConfig.isAdmin, rolesController.getSingleForm); 
app.post('/api/v1/roles/:_id/', passportConfig.isAdmin, rolesController.postSingleForm); 
app.put('/api/v1/roles/:_id/', passportConfig.isAdmin, rolesController.putSingleForm); 
app.delete('/api/v1/roles/:_id/', passportConfig.isAdmin, rolesController.deleteSingleForm);

app.post('/api/v1/roles/:_id/permissions', passportConfig.isAdmin, rolesController.postSingleAddPermissionToRole); 
app.delete('/api/v1/roles/:_id/permissions/:_permissionsId', passportConfig.isAdmin, rolesController.deleteSinglePermissionInArrayForRole);


//docs
app.get("/docs/about/", passportConfig.isAdmin, documentationController.getAbout);
app.get("/docs/hooks/", passportConfig.isAdmin, documentationController.getHooks);
app.get("/docs/imports/", passportConfig.isAdmin, documentationController.getImports);
app.get("/docs/white-paper/", passportConfig.isAdmin, documentationController.getWhitePaper);



app.get("/permissions/", passportConfig.isAdmin, permissionsController.viewIndex);
app.get("/permissions/form/", passportConfig.isAdmin, permissionsController.viewForm);
// permisions api
app.get('/api/v1/permissions/', passportConfig.isAdmin, permissionsController.getManyForm); 
app.post('/api/v1/permissions/', passportConfig.isAdmin, permissionsController.postManyForm); 
app.put('/api/v1/permissions/', passportConfig.isAdmin, permissionsController.putManyForm); 
app.delete('/api/v1/permissions/', passportConfig.isAdmin, permissionsController.deleteManyForm);

app.get('/api/v1/permissions/:_id/', passportConfig.isAdmin, permissionsController.getSingleForm); 
app.post('/api/v1/permissions/:_id/', passportConfig.isAdmin, permissionsController.postSingleForm); 
app.put('/api/v1/permissions/:_id/', passportConfig.isAdmin, permissionsController.putSingleForm); 
app.delete('/api/v1/permissions/:_id/', passportConfig.isAdmin, permissionsController.deleteSingleForm);


app.get("/user-management/", passportConfig.isAdmin, userManagementController.getIndex);
app.get("/user-management/form/", passportConfig.isAdmin, userManagementController.getForm);
// user api
app.get('/api/v1/users/', passportConfig.isAdmin, userManagementController.getManyForm); 
app.post('/api/v1/users/', passportConfig.isAdmin, userManagementController.postManyForm); 
app.put('/api/v1/users/', passportConfig.isAdmin, userManagementController.putManyForm); 
app.delete('/api/v1/users/', passportConfig.isAdmin, userManagementController.deleteManyForm);

app.get('/api/v1/users/:_id/', passportConfig.isAdmin, userManagementController.getSingleForm); 
app.post('/api/v1/users/:_id/', passportConfig.isAdmin, userManagementController.postSingleForm); 
app.put('/api/v1/users/:_id/', passportConfig.isAdmin, userManagementController.putSingleForm); 
app.delete('/api/v1/users/:_id/', passportConfig.isAdmin, userManagementController.deleteSingleForm);

app.post('/api/v1/users/:_id/permissions', passportConfig.isAdmin, userManagementController.postSingleAddPermissionToUser); 
app.delete('/api/v1/users/:_id/permissions/:_permissionsId', passportConfig.isAdmin, userManagementController.deleteSinglePermissionInArrayForUser);


app.post('/api/v1/users/:_id/roles', passportConfig.isAdmin, userManagementController.postSingleAddRoleToUser); 
app.delete('/api/v1/users/:_id/roles/:_rolesId', passportConfig.isAdmin, userManagementController.deleteSingleRoleInArrayForUser);

// user request
app.get('/api/v1/user-requests/', passportConfig.isAdmin, userRequestController.getManyForm); 
app.post('/api/v1/user-requests/', userRequestController.postManyForm); 
app.put('/api/v1/user-requests/', passportConfig.isAdmin, userRequestController.putManyForm); 
app.delete('/api/v1/user-requests/', passportConfig.isAdmin, userRequestController.deleteManyForm);

app.get('/api/v1/user-requests/:_id/', passportConfig.isAdmin, userRequestController.getSingleForm); 
app.post('/api/v1/user-requests/:_id/', passportConfig.isAdmin, userRequestController.postSingleForm); 
app.put('/api/v1/user-requests/:_id/', passportConfig.isAdmin, userRequestController.putSingleForm); 
app.delete('/api/v1/user-requests/:_id/', passportConfig.isAdmin, userRequestController.deleteSingleForm);

app.post('/api/v1/user-requests/:_id/approve/', passportConfig.isAdmin, userRequestController.postSingleFormApprove); 
app.post('/api/v1/user-requests/:_id/reject/', passportConfig.isAdmin, userRequestController.postSingleFormReject); 


app.get("/errors/", passportConfig.isAdmin, errorsController.viewList);
app.get("/errors/log/", passportConfig.isAdmin, errorsController.viewSingle);
// roles api
app.get('/api/v1/errors/', passportConfig.isAdmin, errorsController.getManyForm); 
app.post('/api/v1/errors/', passportConfig.isAdmin, errorsController.postManyForm); 
app.put('/api/v1/errors/', passportConfig.isAdmin, errorsController.putManyForm); 
app.delete('/api/v1/errors/', passportConfig.isAdmin, errorsController.deleteManyForm);

app.get('/api/v1/errors/:_id/', passportConfig.isAdmin, errorsController.getSingleForm); 
app.post('/api/v1/errors/:_id/', passportConfig.isAdmin, errorsController.postSingleForm); 
app.put('/api/v1/errors/:_id/', passportConfig.isAdmin, errorsController.putSingleForm); 
app.delete('/api/v1/errors/:_id/', passportConfig.isAdmin, errorsController.deleteSingleForm);


//settings api
app.get("/settings/", passportConfig.isAdmin, settingsController.viewGeneral);
app.get("/api/v1/settings/general/", passportConfig.isAdmin, settingsController.getGeneral);
app.post("/api/v1/settings/general/", passportConfig.isAdmin, settingsController.postGeneral);


app.get("/settings/new-users/", passportConfig.isAdmin, settingsController.viewNewUsers);
app.get("/api/v1/settings/new-users/", passportConfig.isAdmin, settingsController.getNewUsers);
app.post("/api/v1/settings/new-users/", passportConfig.isAdmin, settingsController.postNewUsers);

app.get("/settings/exports/", passportConfig.isAdmin, settingsController.viewExports);
app.post('/api/v1/settings/exports/', passportConfig.isAdmin, settingsController.postExports)
app.get('/api/v1/settings/exports/', passportConfig.isAdmin, settingsController.getExportsFile)
app.get("/settings/imports/", passportConfig.isAdmin, settingsController.viewImports);

app.get("/settings/email-templates/", passportConfig.isAdmin, settingsController.viewEmailTemplates);
app.get("/api/v1/settings/email-templates/", passportConfig.isAdmin, settingsController.getEmailTemplates);
app.post("/api/v1/settings/email-templates/", passportConfig.isAdmin, settingsController.postEmailTemplates);

app.get("/settings/password-policy/", passportConfig.isAdmin, settingsController.viewPasswordPolicy);
app.get("/api/v1/settings/password-policy/", passportConfig.isAdmin, settingsController.getPasswordPolicy);
app.post("/api/v1/settings/password-policy/", passportConfig.isAdmin, settingsController.postPasswordPolicy);




// docs
app.use('/docs/rest-api', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

/**
 * API examples routes.
 */
app.get("/docs/api/", passportConfig.isAdmin, apiController.getApi);
app.get("/api/lastfm", passportConfig.isAdmin, apiController.getLastfm);
app.get(
  "/api/nyt",
  passportConfig.isAdmin,
  apiController.getNewYorkTimes
);
app.get(
  "/api/steam",
  passportConfig.isAdmin,
  passportConfig.isAuthorized,
  apiController.getSteam
);
app.get("/api/stripe", passportConfig.isAdmin, apiController.getStripe);
app.post(
  "/api/stripe",
  passportConfig.isAdmin,
  apiController.postStripe
);
app.get(
  "/api/scraping",
  passportConfig.isAdmin,
  apiController.getScraping
);
app.get("/api/twilio", passportConfig.isAdmin, apiController.getTwilio);
app.post(
  "/api/twilio",
  passportConfig.isAdmin,
  apiController.postTwilio
);
app.get(
  "/api/foursquare",
  passportConfig.isAdmin,
  passportConfig.isAuthorized,
  apiController.getFoursquare
);
app.get(
  "/api/tumblr",
  passportConfig.isAdmin,
  passportConfig.isAuthorized,
  apiController.getTumblr
);
app.get(
  "/api/facebook",
  passportConfig.isAdmin,
  passportConfig.isAuthorized,
  apiController.getFacebook
);
app.get(
  "/api/github",
  passportConfig.isAdmin,
  passportConfig.isAuthorized,
  apiController.getGithub
);
app.get(
  "/api/twitter",
  passportConfig.isAdmin,
  passportConfig.isAuthorized,
  apiController.getTwitter
);
app.post(
  "/api/twitter",
  passportConfig.isAdmin,
  passportConfig.isAuthorized,
  apiController.postTwitter
);
app.get(
  "/api/twitch",
  passportConfig.isAdmin,
  passportConfig.isAuthorized,
  apiController.getTwitch
);
app.get(
  "/api/instagram",
  passportConfig.isAdmin,
  passportConfig.isAuthorized,
  apiController.getInstagram
);
app.get("/api/paypal", passportConfig.isAdmin, apiController.getPayPal);
app.get(
  "/api/paypal/success",
  passportConfig.isAdmin,
  apiController.getPayPalSuccess
);
app.get(
  "/api/paypal/cancel",
  passportConfig.isAdmin,
  apiController.getPayPalCancel
);
app.get("/api/lob", passportConfig.isAdmin, apiController.getLob);
app.get(
  "/api/upload",
  passportConfig.isAdmin,
  lusca({ csrf: true }),
  apiController.getFileUpload
);
app.post(
  "/api/upload",
  upload.single("myFile"),
  lusca({ csrf: true }),
  apiController.postFileUpload
);
app.get(
  "/api/pinterest",
  passportConfig.isAdmin,
  passportConfig.isAuthorized,
  apiController.getPinterest
);
app.post(
  "/api/pinterest",
  passportConfig.isAdmin,
  passportConfig.isAuthorized,
  apiController.postPinterest
);
app.get(
  "/api/here-maps",
  passportConfig.isAdmin,
  apiController.getHereMaps
);
app.get(
  "/api/google-maps",
  passportConfig.isAdmin,
  apiController.getGoogleMaps
);
app.get(
  "/api/google/drive",
  passportConfig.isAdmin,
  passportConfig.isAuthorized,
  apiController.getGoogleDrive
);
app.get("/api/chart", apiController.getChart);
app.get(
  "/api/google/sheets",
  passportConfig.isAdmin,
  passportConfig.isAuthorized,
  apiController.getGoogleSheets
);
app.get(
  "/api/quickbooks",
  passportConfig.isAdmin,
  passportConfig.isAuthorized,
  apiController.getQuickbooks
);

/**
 * OAuth authentication routes. (Sign in)
 */
app.get(
  "/auth/instagram",
  passport.authenticate("instagram", { scope: ["basic", "public_content"] })
);
app.get(
  "/auth/instagram/callback",
  passport.authenticate("instagram", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect(req.session.returnTo || "/login");
  }
);
app.get("/auth/snapchat", passport.authenticate("snapchat"));
app.get(
  "/auth/snapchat/callback",
  passport.authenticate("snapchat", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect(req.session.returnTo || "/login");
  }
);
app.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email", "public_profile"] })
);
app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect(req.session.returnTo || "/login");
  }
);
app.get("/auth/github", passport.authenticate("github"));
app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect(req.session.returnTo || "/login");
  }
);
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/spreadsheets.readonly",
    ],
    accessType: "offline",
    prompt: "consent",
  })
);
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect(req.session.returnTo || "/login");
  }
);
app.get("/auth/twitter", passport.authenticate("twitter"));
app.get(
  "/auth/twitter/callback",
  passport.authenticate("twitter", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect(req.session.returnTo || "/login");
  }
);
app.get(
  "/auth/linkedin",
  passport.authenticate("linkedin", { state: "SOME STATE" })
);
app.get(
  "/auth/linkedin/callback",
  passport.authenticate("linkedin", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect(req.session.returnTo || "/login");
  }
);
app.get("/auth/twitch", passport.authenticate("twitch", {}));
app.get(
  "/auth/twitch/callback",
  passport.authenticate("twitch", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect(req.session.returnTo || "/login");
  }
);

/**
 * OAuth authorization routes. (API examples)
 */
app.get("/auth/foursquare", passport.authorize("foursquare"));
app.get(
  "/auth/foursquare/callback",
  passport.authorize("foursquare", { failureRedirect: "/api" }),
  (req, res) => {
    res.redirect("/api/foursquare");
  }
);
app.get("/auth/tumblr", passport.authorize("tumblr"));
app.get(
  "/auth/tumblr/callback",
  passport.authorize("tumblr", { failureRedirect: "/api" }),
  (req, res) => {
    res.redirect("/api/tumblr");
  }
);
app.get("/auth/steam", passport.authorize("openid", { state: "SOME STATE" }));
app.get(
  "/auth/steam/callback",
  passport.authorize("openid", { failureRedirect: "/api" }),
  (req, res) => {
    res.redirect(req.session.returnTo);
  }
);
app.get(
  "/auth/pinterest",
  passport.authorize("pinterest", { scope: "read_public write_public" })
);
app.get(
  "/auth/pinterest/callback",
  passport.authorize("pinterest", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/api/pinterest");
  }
);
app.get(
  "/auth/quickbooks",
  passport.authorize("quickbooks", {
    scope: ["com.intuit.quickbooks.accounting"],
    state: "SOME STATE",
  })
);
app.get(
  "/auth/quickbooks/callback",
  passport.authorize("quickbooks", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect(req.session.returnTo);
  }
);

/**
 * Error Handler.
 */
if (process.env.NODE_ENV === "development") {
  // only use in development
  app.use(errorHandler());
} else {
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send("Server Error");
  });
}

/**
 * Start Express server.
 */
app.listen(app.get("port"), () => {
  console.log(
    "%s App is running at http://localhost:%d in %s mode",
    chalk.green("✓"),
    app.get("port"),
    app.get("env")
  );
  console.log("  Press CTRL-C to stop\n");
});

module.exports = app;
