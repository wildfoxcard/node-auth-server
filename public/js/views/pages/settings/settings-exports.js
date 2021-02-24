app.settings.exports.submit = () => {
  const permissions = [];
  const roles = [];
  const testUsers = [];
  const applicationUsers = [];
  const settings = {};

  const filename =
    $("#filename").val() !== "" ? $("#filename").val() : undefined;
  const defaultPassword =
    $("#defaultPassword").val() !== ""
      ? $("#defaultPassword").val()
      : undefined;

  $('input[name="permissions"]').each(function (i, obj) {
    if ($(obj).is(":checked")) {
      permissions.push($(obj).val());
    }
  });

  $('input[name="roles"]').each(function (i, obj) {
    if ($(obj).is(":checked")) {
      roles.push($(obj).val());
    }
  });

  $('input[name="testUsers"]').each(function (i, obj) {
    if ($(obj).is(":checked")) {
      testUsers.push($(obj).val());
    }
  });

  $('input[name="applicationUsers"]').each(function (i, obj) {
    if ($(obj).is(":checked")) {
      applicationUsers.push($(obj).val());
    }
  });

  if ($("#serverName").is(":checked")) {
    settings["serverName"] = $("#serverName").val();
  }

  if ($("#serverMainUrl").is(":checked")) {
    settings["serverMainUrl"] = $("#serverMainUrl").val();
  }

  if ($("#newUsersType").is(":checked")) {
    settings["newUsersType"] = $("#newUsersType").val();
  }

  if ($("#varsHost").is(":checked")) {
    settings["varsHost"] = $("#varsHost").val();
  }

  if ($("#varsFromEmail").is(":checked")) {
    settings["varsFromEmail"] = $("#varsFromEmail").val();
  }

  if ($("#varsCompany").is(":checked")) {
    settings["varsCompany"] = $("#varsCompany").val();
  }

  if ($("#varsUsername").is(":checked")) {
    settings["varsUsername"] = $("#varsUsername").val();
  }

  if ($("#emailVerificationSubject").is(":checked")) {
    settings["emailVerificationSubject"] = $("#emailVerificationSubject").val();
  }

  if ($("#emailVerificationMessage").is(":checked")) {
    settings["emailVerificationMessage"] = $("#emailVerificationMessage").val();
  }

  if ($("#passwordResetSubject").is(":checked")) {
    settings["passwordResetSubject"] = $("#passwordResetSubject").val();
  }

  if ($("#passwordResetMessage").is(":checked")) {
    settings["passwordResetMessage"] = $("#passwordResetMessage").val();
  }

  if ($("#resetPasswordEmailSubject").is(":checked")) {
    settings["resetPasswordEmailSubject"] = $("#resetPasswordEmailSubject").val();
  }

  if ($("#resetPasswordEmailMessage").is(":checked")) {
    settings["serverName"] = $("#serverName").val();
  }

  if ($("#userApprovedSubject").is(":checked")) {
    settings["userApprovedSubject"] = $("#userApprovedSubject").val();
  }

  if ($("#userApprovedMessage").is(":checked")) {
    settings["userApprovedMessage"] = $("#userApprovedMessage").val();
  }

  if ($("#inviteUserSubject").is(":checked")) {
    settings["inviteUserSubject"] = $("#inviteUserSubject").val();
  }

  if ($("#inviteUserMessage").is(":checked")) {
    settings["inviteUserMessage"] = $("#inviteUserMessage").val();
  }

  if ($("#passwordLength").is(":checked")) {
    settings["passwordLength"] = $("#passwordLength").val();
  }

  if ($("#shouldHaveUppercaseLetter").is(":checked")) {
    settings["shouldHaveUppercaseLetter"] = $("#shouldHaveUppercaseLetter").val() === "true";
  }

  if ($("#shouldHaveLowercaseLetter").is(":checked")) {
    settings["shouldHaveLowercaseLetter"] = $("#shouldHaveLowercaseLetter").val() === "true";
  }

  if ($("#shouldHaveNumber").is(":checked")) {
    settings["shouldHaveNumber"] = $("#shouldHaveNumber").val() === "true";
  }

  if ($("#shouldHaveSymbol").is(":checked")) {
    settings["shouldHaveSymbol"] = $("#shouldHaveSymbol").val() === "true";
  }

  // console.log(
  //   "data",
  //   permissions,
  //   roles,
  //   testUsers,
  //   applicationUsers,
  //   settings,
  //   filename,
  //   defaultPassword
  // );

  $.post({
    url: "/api/v1/settings/exports",
    data: {
      permissions,
      roles,
      testUsers,
      applicationUsers,
      filename,
      defaultPassword,
      settings
    },
    success: results => {
      if (results.success) {
        window.open(`/api/v1/settings/exports/?filename=${results.filename}`)
      }
    }
  });
};

$(() => {
  $("#selectAll").on("change", () => {
    console.log("hit");
    if ($("#selectAll").is(":checked")) {
      $('input[type="checkbox"]').prop("checked", true);
    } else {
      $('input[type="checkbox"]').prop("checked", false);
    }
  });
});
