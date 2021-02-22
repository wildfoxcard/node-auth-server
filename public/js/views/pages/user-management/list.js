app.userRequest = {};
app.userRequest.approve = (id, email, name) => {
  swal({
    title: "Are you sure?",
    text: `You are about to create a user. '${
      name || "The User"
    }' will be emailed at '${email}'`,
    type: "success",
    showCancelButton: true,
    buttons: ["No, cancel plx!", "Yes, I am sure!"],
    // confirmButtonText: "Yes, delete it!",
    // cancelButtonText: "No, cancel plx!",
    closeOnConfirm: false,
    closeOnCancel: false,
    confirmButtonClass: "btn-success",
  }).then(function (isConfirm) {
    if (isConfirm) {
      $.ajax({
        url: `/api/v1/user-requests/${id}/approve/`,
        type: "POST",
        success: () => {
          swal({
            title: "Edit new user",
            // text: ``,
            type: "success",
            showCancelButton: true,
            buttons: ["No, stay plx!", "Yes, Edit User!"],
            // confirmButtonText: "Yes, delete it!",
            // cancelButtonText: "No, cancel plx!",
            closeOnConfirm: false,
            closeOnCancel: false,
            confirmButtonClass: "btn-success",
          }).then(function (isConfirm) {
            window.location.href = `/user-management/form?id=${id}`;
          });
          // $("#rolesInUserTable").DataTable().ajax.reload();
          // window.location.href = `/roles/form?id=${$("#_id").val()}`;
        },
      });
    } else {
      swal("Cancelled", "Nothing has changed.", "error");
    }
  });
};

app.userRequest.reject = (id, email, name) => {
  swal({
    title: "Are you sure?",
    text: `You are about to reject a user request. Name: '${
      name || "The User"
    }', Email: '${email}'`,
    type: "danger",
    showCancelButton: true,
    buttons: ["No, cancel plx!", "Yes, I am sure!"],
    // confirmButtonText: "Yes, delete it!",
    // cancelButtonText: "No, cancel plx!",
    closeOnConfirm: false,
    closeOnCancel: false,
    confirmButtonClass: "btn-success",
  }).then(function (isConfirm) {
    if (isConfirm) {
      $.ajax({
        url: `/api/v1/user-requests/${id}/reject/`,
        type: "POST",
        success: () => {
          $.notify(
            {
              title: "Update Complete : ",
              message: `'${email}' was rejected.`,
              icon: "fa fa-check",
            },
            {
              type: "info",
            }
          );

          // $("#rolesInUserTable").DataTable().ajax.reload();
          // window.location.href = `/roles/form?id=${$("#_id").val()}`;
        },
      });
    } else {
      swal("Cancelled", "Nothing has changed.", "error");
    }
  });
};

const getFilterDataObj = () => {
  const filter = $("#filter").val();

  switch (filter) {
    case "All":
      return {};
    case "Admin":
      return { isAdmin: true };
    case "Normal Users":
      return { type: "NORMAL" };
    case "Test Users":
      return { type: "TEST" };
    case "Application Users":
      return { type: "APPLICATION" };
  }
};

const search = () => {
  $.get({
    url: "/api/v1/users",
    data: Object.assign(
      {
        email: $("#search-input").val(),
      },
      getFilterDataObj()
    ),
    success: (results) => {
      if (results.success) {
        $("#leadManagementTable").dataTable().fnClearTable();
        if (results.data) {
          results.data.map((per) => {
            $("#leadManagementTable").dataTable().fnAddData(per);
          });
        }
      }
    },
  });
}

$(function () {
  $("#search").on("submit", (e) => {
    e.preventDefault();
    search()
  });
  $("#filter").on("change", (e) => {
    e.preventDefault();
    search()
  });
  // #userRequestTable
  $("#userRequestTable").DataTable({
    sDom: "t",
    ajax: {
      url: "/api/v1/user-requests/",
      type: "GET",
      cache: false,
      dataSrc: function (json) {
        console.log("json", json, json.data);
        return json.data;
      },
    },

    columns: [
      {
        data: "email",
        display: "Email",
        render: function (data, type, row, meta) {
          return row.email || "";
        },
      },
      {
        data: "name",
        display: "Name",
        render: function (data, type, row, meta) {
          return row.name || "";
        },
      },
      {
        data: null,
        display: "Action",
        render: function (data, type, row, meta) {
          let approveButton = $(
            `<div class="btn btn-success mr-3" onclick="app.userRequest.approve('${data._id}', '${data.email}', '${data.name}')">`
          ).html("Approve");

          let rejectButton = $(
            `<div class="btn btn-danger" onclick="app.userRequest.reject('${data._id}', '${data.email}', '${data.name}')">`
          )
            .html("Reject")
            .on(`click`, () => {
              console.log("reject button clicked");
            });

          return $("<div>")
            .append(approveButton)
            .append(rejectButton)
            .prop("outerHTML");
        },
      },
    ],
  });

  $("#leadManagementTable").DataTable({
    sDom: "t",
    ajax: {
      url: "/api/v1/users",
      type: "GET",
      cache: false,
      dataSrc: function (json) {
        // console.log('json', json, json.data)
        return json.data;
      },
    },
    columns: [
      {
        data: "email",
        display: "Email",
      },
      {
        data: "type",
        display: "Type",
      },
      {
        data: "isAdmin",
        display: "Is Admin",
      },
      {
        data: null,
        display: "Action",
        render: function (data, type, row, meta) {
          return `<a class="btn btn-warning" href="/user-management/form?id=${row._id}">Edit</a>`;
        },
      },
    ],
  });
});
