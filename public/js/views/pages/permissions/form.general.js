app.permissions = {};

app.permissions.post = () => {
  $("#generalLoading").show();
  const name = $("#name").val();

  $.post({
    url: "/api/v1/permissions/",
    data: {
      name,
    },
    success: (results) => {
      window.location.href = `/permissions/form/?id=${results.data._id}`;
    },
  });
};

app.permissions.put = () => {
  $("#generalLoading").show();
  const name = $("#name").val();

  $.ajax({
    url: `/api/v1/permissions/${$("#_id").val()}/`,
    type: "PUT",
    data: {
      name,
    },
    success: () => {
      $.notify(
        {
          title: "Update Complete : ",
          message: `Permission now called ${name}!`,
          icon: "fa fa-check",
        },
        {
          type: "info",
        }
      );
      $("#generalLoading").hide();
    },
  });
};

$(() => {
  if ($("#name").val().length === 0) {
    $("#name").focus();
  }

  //submit form
  $("#permission_form").on("submit", (e) => {
    e.preventDefault();

    if ($("#_id").length === 0) {
      app.permissions.post();
    } else {
      app.permissions.put();
    }

    return false;
  });
  $("#generalLoading").hide();
});
