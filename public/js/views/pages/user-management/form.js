// app.users = {};


// app.users.post = () => {
//   const email = $("#email").val();

//   $.post({
//     url: "/api/v1/users",
//     data: {
//         email,
//     },
//     success: () => {
//       window.location.href = "/user-management/";
//     },
//   });
// };

// app.users.put = () => {
//   const email = $("#email").val();

//   $.ajax({
//     url: `/api/v1/users/${$("#_id").val()}/`,
//     type: "PUT",
//     data: {
//         email,
//     },
//     success: () => {
//       window.location.href = "/user-management/";
//     },
//   });
// };

// app.users.delete = () => {
//   if ($("#submitDeleteUser").attr("data-blocked") == "false") {
// 		console.log('delete triggered')
//     $.ajax({
//       url: `/api/v1/users/${$("#_id").val()}/`,
//       type: "DELETE",
//       success: () => {
//         window.location.href = "/user-management/";
//       },
//     });
//   }
// };

// $(() => {
//   //submit form
//   $("#user_form").on("submit", (e) => {
//     e.preventDefault();

//     if ($("#_id").length === 0) {
//       console.log("hit 1");
//       app.users.post();
//     } else {
//       console.log("hit 3");

//       app.users.put();
//     }

//     return false;
//   });
//   $("#userInputDeleteUser").on("keyup", (e) => {
//     const requireText = `delete-${$("#deleteUser").text()}`;
//     const userText = $("#userInputDeleteUser").val();

//     if (userText === requireText) {
//       $("#submitDeleteUser").removeAttr("disabled");
//       $("#submitDeleteUser").addClass("btn-danger");
//       $("#submitDeleteUser").removeClass("btn-secondary");
//       $("#submitDeleteUser").attr("data-blocked", false);
//     } else {
//       $("#submitDeleteUser").attr("disabled", "disabled");
//       $("#submitDeleteUser").addClass("btn-secondary");
//       $("#submitDeleteUser").removeClass("btn-danger");
//       $("#submitDeleteUser").attr("data-blocked", true);
//     }
//   });
// });
