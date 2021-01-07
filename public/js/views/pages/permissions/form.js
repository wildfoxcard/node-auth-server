app.permissions = {};


app.permissions.post = () => {
  const name = $("#name").val();

  $.post({
    url: "/api/v1/permissions",
    data: {
      name,
    },
    success: () => {
      window.location.href = "/permissions/";
    },
  });
};

app.permissions.put = () => {
  const name = $("#name").val();

  $.ajax({
    url: `/api/v1/permissions/${$("#_id").val()}/`,
    type: "PUT",
    data: {
      name,
    },
    success: () => {
      window.location.href = "/permissions/";
    },
  });
};

app.permissions.delete = () => {
  if ($("#submitDeletePermission").attr("data-blocked") == "false") {
		console.log('delete triggered')
    $.ajax({
      url: `/api/v1/permissions/${$("#_id").val()}/`,
      type: "DELETE",
      success: () => {
        window.location.href = "/permissions/";
      },
    });
  }
};

$(() => {
  //submit form
  $("#permission_form").on("submit", (e) => {
    e.preventDefault();

    if ($("#_id").length === 0) {
      console.log("hit 1");
      app.permissions.post();
    } else {
      console.log("hit 3");

      app.permissions.put();
    }

    return false;
  });
  $("#userInputDeletePermission").on("keyup", (e) => {
    const requireText = `delete-${$("#deletePermission").text()}`;
    const userText = $("#userInputDeletePermission").val();

    if (userText === requireText) {
      $("#submitDeletePermission").removeAttr("disabled");
      $("#submitDeletePermission").addClass("btn-danger");
      $("#submitDeletePermission").removeClass("btn-secondary");
      $("#submitDeletePermission").attr("data-blocked", false);
    } else {
      $("#submitDeletePermission").attr("disabled", "disabled");
      $("#submitDeletePermission").addClass("btn-secondary");
      $("#submitDeletePermission").removeClass("btn-danger");
      $("#submitDeletePermission").attr("data-blocked", true);
    }
  });
});
