app.users.delete = () => {
  if ($("#submitDeleteUser").attr("data-blocked") == "false") {
    console.log("delete triggered");
    $.ajax({
      url: `/api/v1/users/${$("#_id").val()}/`,
      type: "DELETE",
      success: () => {
        window.location.href = "/user-management/";
      },
    });
  }
};

app.users.block = () => {
  if ($("#submitBlockUser").attr("data-blocked") == "false") {
    $.ajax({
      url: `/api/v1/users/${$("#_id").val()}/`,
      type: "PUT",
      data: {
        isBlocked: true
      },
      success: () => {
        // window.location.href = "/user-management/";
      },
    });
  }
};


$(() => {
  $("#dangerLoading").hide();

  //block
  $("#userInputBlockUser").on("keyup", (e) => {
    const requireText = `block-${$("#blockUser").text()}`;
    const userText = $("#userInputBlockUser").val();

    if (userText === requireText) {
      $("#submitBlockUser").removeAttr("disabled");
      $("#submitBlockUser").addClass("btn-danger");
      $("#submitBlockUser").removeClass("btn-secondary");
      $("#submitBlockUser").attr("data-blocked", false);
    } else {
      $("#submitBlockUser").attr("disabled", "disabled");
      $("#submitBlockUser").addClass("btn-secondary");
      $("#submitBlockUser").removeClass("btn-danger");
      $("#submitBlockUser").attr("data-blocked", true);
    }
  });

  //delete
  $("#userInputDeleteUser").on("keyup", (e) => {
    const requireText = `delete-${$("#deleteUser").text()}`;
    const userText = $("#userInputDeleteUser").val();

    if (userText === requireText) {
      $("#submitDeleteUser").removeAttr("disabled");
      $("#submitDeleteUser").addClass("btn-danger");
      $("#submitDeleteUser").removeClass("btn-secondary");
      $("#submitDeleteUser").attr("data-blocked", false);
    } else {
      $("#submitDeleteUser").attr("disabled", "disabled");
      $("#submitDeleteUser").addClass("btn-secondary");
      $("#submitDeleteUser").removeClass("btn-danger");
      $("#submitDeleteUser").attr("data-blocked", true);
    }
  });
});
