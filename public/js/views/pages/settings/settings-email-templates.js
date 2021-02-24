app.settings.emailTemplates.save = () => {
  const emailVerificationSubject = $("#emailVerificationSubject").val();
  const emailVerificationMessage = $("#emailVerificationMessage").val();
  const passwordResetSubject = $("#passwordResetSubject").val();
  const passwordResetMessage = $("#passwordResetMessage").val();
  const emailChangeSubject = $("#emailChangeSubject").val();
  const emailChangeMessage = $("#emailChangeMessage").val();
  const userApprovedSubject = $("#userApprovedSubject").val();
  const userApprovedMessage = $("#userApprovedMessage").val();
  const inviteUserSubject = $("#inviteUserSubject").val();
  const inviteUserMessage = $("#inviteUserMessage").val();

  //vars
  const host = $("#userApprovedMessage").val();
  const fromEmail = $("#varsFromEmail").val();
  const company = $("#varsCompany").val();
  const username = $("#varsUsername").val();

  $.post({
    url: "/api/v1/settings/email-templates/",
    data: {
      emailVerificationSubject,
      emailVerificationMessage,
      passwordResetSubject,
      passwordResetMessage,
      emailChangeSubject,
      emailChangeMessage,
      userApprovedSubject,
      userApprovedMessage,
      inviteUserSubject,
      inviteUserMessage,
      vars: {
        host,
        fromEmail,
        company,
        username,
      },
    },
    success: (results) => {
      if (results.success) {
        $.notify(
          {
            title: "Update Complete : ",
            message: `Email Templates has been updated`,
            icon: "fa fa-check",
          },
          {
            type: "info",
          }
        );
      } else {
        $.notify(
          {
            title: "Error : ",
            message: results.message,
            icon: "fa fa-exclamation-triangle",
          },
          {
            type: "danger",
          }
        );
      }

      $("#settingsEmailTemplatesLoading").hide();
    },
  });
};

app.settings.emailTemplates.load = () => {
  $.get({
    url: "/api/v1/settings/email-templates/",
    success: (results) => {
      $("#emailVerificationSubject").val(results.data.emailVerificationSubject);
      $("#emailVerificationMessage").val(results.data.emailVerificationMessage);
      $("#passwordResetSubject").val(results.data.passwordResetSubject);
      $("#passwordResetMessage").val(results.data.passwordResetMessage);
      $("#resetPasswordEmailSubject").val(
        results.data.resetPasswordEmailSubject
      );
      $("#resetPasswordEmailMessage").val(
        results.data.resetPasswordEmailMessage
      );
      // $("#emailChangeSubject").val(results.data.emailChangeSubject);
      // $("#emailChangeMessage").val(results.data.emailChangeMessage);
      $("#userApprovedSubject").val(results.data.userApprovedSubject);
      $("#userApprovedMessage").val(results.data.userApprovedMessage);
      $("#inviteUserSubject").val(results.data.inviteUserSubject);
      $("#inviteUserMessage").val(results.data.inviteUserMessage);

      //vars
      $("#userApprovedMessage").val(results.data.vars.host);
      $("#varsFromEmail").val(results.data.vars.fromEmail || "");
      $("#varsCompany").val(results.data.vars.company);
      $("#varsUsername").val(results.data.vars.username);

      $("#settingsEmailTemplatesLoading").hide();
    },
  });
};

$(() => {
  $("#settingsEmailTemplatesLoading").show();
  app.settings.emailTemplates.load();
});
