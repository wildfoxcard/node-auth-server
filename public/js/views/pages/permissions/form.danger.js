app.permissions.delete = () => {
  if ($("#submitDeletePermission").attr("data-blocked") == "false") {
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
