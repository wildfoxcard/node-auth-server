app.settings.index = {};
app.settings.index.save = () => {
  var serverName = $("#serverName").val();
  var serverMainUrl = $("#serverMainUrl").val();
  $.post({
    url: "/api/v1/settings/general/",
    data: {
      serverName,
      serverMainUrl
    },
    success: (results) => {
      $('.app-header__logo').html(serverName)
      $.notify(
        {
          title: "Update Complete : ",
          message: `General settings has been updated!`,
          icon: "fa fa-check",
        },
        {
          type: "info",
        }
      );
      $("#settingsGeneralLoading").hide();
    },
  });
};

app.settings.index.load = () => {
  $.get({
    url: "/api/v1/settings/general/",
    success: (results) => {
      $("#serverName").val(results.data.serverName);
      $("#serverMainUrl").val(results.data.serverMainUrl);
      $("#settingsGeneralLoading").hide();
    },
  });
};

$(() => {
  $("#settingsGeneralLoading").show();
  app.settings.index.load();
});
