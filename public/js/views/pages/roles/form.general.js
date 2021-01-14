app.roles.post = () => {
  $("#generalLoading").show();
  const name = $("#name").val();

  $.post({
    url: "/api/v1/roles",
    data: {
      name,
    },
    success: results => {
      window.location.href = `/roles/form/?id=${results.data._id}`;
      //   window.location.href = "/roles/";
    },
  });
};

app.roles.put = () => {
  $("#generalLoading").show();
  const name = $("#name").val();

  $.ajax({
    url: `/api/v1/roles/${$("#_id").val()}/`,
    type: "PUT",
    data: {
      name,
    },
    success: () => {
      $.notify(
        {
          title: "Update Complete : ",
          message: `Role now called ${name}!`,
          icon: "fa fa-check",
        },
        {
          type: "info",
        }
      );
      $("#generalLoading").hide();
      //   window.location.href = "/roles/";
    },
  });
};

$(() => {
  if ($("#name").val().length === 0) {
    $("#name").focus();
  }

  $("#role_form").on("submit", (e) => {
    e.preventDefault();

    if ($("#_id").length === 0) {
      app.roles.post();
    } else {
      app.roles.put();
    }

    return false;
  });
  $("#generalLoading").hide();
});
