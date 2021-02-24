app.users.post = () => {
  $("#generalLoading").show();
  const email = $("#email").val();
  const type = $("#userType").val();
  const password = $('#userPassword').val();
  const applicationToken = $('#applicationToken').val();
  const shouldSendEmailInvitation = $('#shouldSendEmailInvitation').is(':checked')
  const isAdmin = $('#userIsAdmin').is(':checked');

  let passwordOrToken = {};

  switch (type) {
    case "NORMAL":
      passwordOrToken = { password : $('#userPassword').val() }
      break;
    case "TEST":
      passwordOrToken = { password : $('#userPassword').val() }
      break;
    case "APPLICATION":
      passwordOrToken = { token : $('#applicationToken').val() }
      break;
  }

  $.post({
    url: "/api/v1/users",
    data: Object.assign(passwordOrToken, {
      email,
      type,
      password,
      applicationToken,
      shouldSendEmailInvitation,
      isAdmin,
    }),
    success: results => {
      if(results.success) {
        window.location.href = `/user-management/form/?id=${results.data._id}`;
      } else {
        $('#form-error').html(results.message)
        $("#generalLoading").hide();
      }
    },
  });
};

app.users.put = () => {
  $("#generalLoading").show();
  const email = $("#email").val();
  const isAdmin = $('#userIsAdmin').is(':checked');

  $.ajax({
    url: `/api/v1/users/${$("#_id").val()}/`,
    type: "PUT",
    data: {
      email,
      isAdmin,
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

app.users.toggleAdmin = () => {
  if ($("#userIsAdmin").is(":checked")) {
    $("#nonAdmin").hide();
  } else {
    $("#nonAdmin").show();
  }
};

app.users.toggleType = () => {
  const type = $("#userType").val();
  
  switch (type) {
    case "NORMAL":
      $('#tokenDisplay').addClass('d-none')
      $('#passwordDisplay').removeClass('d-none')
      break;
    case "TEST":
      $('#tokenDisplay').addClass('d-none')
      $('#passwordDisplay').removeClass('d-none')
      break;
    case "APPLICATION":
      $('#tokenDisplay').removeClass('d-none')
      $('#passwordDisplay').addClass('d-none')
      break;
  }
}

$(() => {
  if ($("#email").val().length === 0) {
    $("#email").focus();
  }

  $("#userIsAdmin").on("change", app.users.toggleAdmin);
  app.users.toggleAdmin();

  $("#userType").on("change", app.users.toggleType);

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
