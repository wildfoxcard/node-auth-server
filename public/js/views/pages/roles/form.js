app.roles = {};


app.roles.post = () => {
  const name = $("#name").val();

  $.post({
    url: "/api/v1/roles",
    data: {
      name,
    },
    success: () => {
      window.location.href = "/roles/";
    },
  });
};

app.roles.put = () => {
  const name = $("#name").val();

  $.ajax({
    url: `/api/v1/roles/${$("#_id").val()}/`,
    type: "PUT",
    data: {
      name,
    },
    success: () => {
      window.location.href = "/roles/";
    },
  });
};

app.roles.delete = () => {
  if ($("#submitDeleteRole").attr("data-blocked") == "false") {
		console.log('delete triggered')
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
  //submit form
  $("#role_form").on("submit", (e) => {
    e.preventDefault();

    if ($("#_id").length === 0) {
      console.log("hit 1");
      app.roles.post();
    } else {
      console.log("hit 3");

      app.roles.put();
    }

    return false;
  });
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


// app.roles = {};

// app.roles.submit = () => {
//     const name = $('#name').val();

//     $.post({
//         url: "/api/v1/roles",
//         data: {
//             name
//         },
//         success: () => {
//             window.location.href="/roles/"
//         }
//     })
// }

// $(() => {
//     //submit form
//     $("#role_form").on("submit", e =>{
//         e.preventDefault();
        
//         app.roles.submit();
        
//         return false;
//       })
// })