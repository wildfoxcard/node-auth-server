app.users.post = () => {
  $("#generalLoading").show();
  const email = $("#email").val();

  $.post({
    url: "/api/v1/users",
    data: {
      email,
    },
    success: () => {
      window.location.href = "/user-management/";
      window.location.href = `/user-management/form/?id=${results.data._id}`;
    },
  });
};

app.users.put = () => {
  $("#generalLoading").show();
  const email = $("#email").val();

  $.ajax({
    url: `/api/v1/users/${$("#_id").val()}/`,
    type: "PUT",
    data: {
      email,
    },
    success: () => {
      $.notify(
        {
          title: "Update Complete : ",
          message: `User email now '${email}'`,
          icon: "fa fa-check",
        },
        {
          type: "info",
        }
      );
      $("#generalLoading").hide();
      //   window.location.href = "/user-management/";
    },
  });
};

$(() => {
  if ($("#email").val().length === 0) {
    $("#email").focus();
  }
  //submit form
  $("#user_form").on("submit", (e) => {
    e.preventDefault();

    if ($("#_id").length === 0) {
      app.users.post();
    } else {
      app.users.put();
    }

    return false;
  });
  $("#generalLoading").hide();
});
