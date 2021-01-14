app.roles.delete = () => {
  if ($("#submitDeleteRole").attr("data-blocked") == "false") {
    $.ajax({
      url: `/api/v1/roles/${$("#_id").val()}/`,
      type: "DELETE",
      success: () => {
        window.location.href = "/roles/";
      },
    });
  }
};

$(() => {
    $("#dangerLoading").hide();
  //delete modal
  $("#userInputDeleteRole").on("keyup", (e) => {
    const requireText = `delete-${$("#deleteRole").text()}`;
    const userText = $("#userInputDeleteRole").val();

    if (userText === requireText) {
      $("#submitDeleteRole").removeAttr("disabled");
      $("#submitDeleteRole").addClass("btn-danger");
      $("#submitDeleteRole").removeClass("btn-secondary");
      $("#submitDeleteRole").attr("data-blocked", false);
    } else {
      $("#submitDeleteRole").attr("disabled", "disabled");
      $("#submitDeleteRole").addClass("btn-secondary");
      $("#submitDeleteRole").removeClass("btn-danger");
      $("#submitDeleteRole").attr("data-blocked", true);
    }
  });
});
