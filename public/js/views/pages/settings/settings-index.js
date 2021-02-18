app.settings.index.save = () => {
  var companyName = $("#companyName").val();
  $.post({
    url: "/api/v1/settings/general/",
    data: {
      companyName: companyName,
    },
    success: (results) => {
      $.notify(
        {
          title: "Update Complete : ",
          message: `Company Name now called ${companyName}!`,
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
      $("#companyName").val(results.data.companyName);
      $("#settingsGeneralLoading").hide();
    },
  });
};

$(() => {
  $("#settingsGeneralLoading").show();
  app.settings.index.load();
});
