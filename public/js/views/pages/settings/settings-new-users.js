app.settings.newUsers.save = () => {
  var type = $("input:radio[name=newUsersType]:checked").val();
  var newUserPassword = $("#newUserPassword").val();

  console.log('hit', type, newUserPassword)

  $.ajax({
    url: "/api/v1/settings/new-users/",
    method: "POST",
    data: {
      type: type,
      password: newUserPassword,
    },
    success: (results) => {
      if (results.success) {
        $.notify(
          {
            title: "Update Complete : ",
            message: `Settings for new users has been updated!`,
            icon: "fa fa-check",
          },
          {
            type: "info",
          }
        );
  
      } else {
        $.notify(
          {
            title: "ERROR : ",
            message: `${results.message}`,
            // icon: "fa fa-check",
          },
          {
            type: "danger",
          }
        );
      }
      $("#settingsNewUsers").hide();
    },
  });
};

app.settings.newUsers.load = () => {
  $.get({
    url: "/api/v1/settings/new-users/",
    success: (results) => {
      console.log("results", results);
      $("#newUserPassword").val(results.data.password || "");
      $("input[name=newUsersType][value=" + results.data.type + "]").attr(
        "checked",
        "checked"
      );
      // $("#companyName").val(results.data.companyName);
      $("#settingsNewUsers").hide();
    },
  });
};

$(() => {
  $("#settingsNewUsers").show();
  app.settings.newUsers.load();
});
