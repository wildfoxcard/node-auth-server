app.users.data.currentRoles = [];
app.users.data.availableRoles = [];
app.users.data.availablePermissions = [];
app.users.data.currentPermissions = [];
let currentlySelectedRoles = [];

app.users.deleteTag = (_id) => {
  for (var i = 0; i < currentlySelectedRoles.length; i++) {
    if (_id === currentlySelectedRoles[i]._id) {
      currentlySelectedRoles.splice(i, 1);
    }
  }

  $('.alert[data-id="' + _id + '"]').remove();
  app.users.refreshSelectRolesDropdown(currentlySelectedRoles);
};

app.users.createTag = (id, name) => {
  var permisionName = $("<p/>").html(name);
  var closeButton = $("<div/>")
    .addClass("btn")
    .addClass("btn-danger")
    .addClass("float-right")
    .on("click", () => {
      app.users.deleteTag(id);
    })
    .html("<strong>X</strong>");
  return $("<div/>")
    .addClass("alert")
    .addClass("alert-success")
    .attr("data-id", id)
    .append(closeButton)
    .append(permisionName);
};

app.users.addRoles = () => {
  var name = $("#availableRoles").find(":selected").text();
  var id = $("#availableRoles").find(":selected").val();

  currentlySelectedRoles.push({ _id: id, name: name });

  $("#roleTags").append(app.users.createTag(id, name));

  app.users.refreshSelectRolesDropdown(currentlySelectedRoles);
};

app.users.submitNewRolesToAdd = () => {
  for (var i = 0; i < currentlySelectedRoles.length; i++) {
    $.ajax({
      url: `/api/v1/users/${$("#_id").val()}/roles/`,
      type: "POST",
      async: true,
      data: currentlySelectedRoles[i],
      success: () => {
        if (i === currentlySelectedRoles.length) {
          currentlySelectedRoles = [];
          $("#rolesInUserTable").DataTable().ajax.reload();
          $("#roleTags").html("");
          $.notify(
            {
              title: "Update Complete : ",
              message: `Role(s) successfully added!`,
              icon: "fa fa-check",
            },
            {
              type: "info",
            }
          );
        }
        // window.location.href = "/roles/";
      },
    });
  }
};

app.users.deleteRole = (roleId) => {
  let role;
  for (var i = 0; i < app.users.data.availableRoles.length; i++) {
    if (roleId === app.users.data.availableRoles[i]._id) {
      role = app.users.data.availableRoles[i];
    }
  }

  swal({
    title: "Are you sure?",
    text: `You will not be able to recover this role '${role.name}' on this role! You can re-add the role later though.`,
    type: "warning",
    showCancelButton: true,
    buttons: ["No, cancel plx!", "Yes, I am sure!"],
    // confirmButtonText: "Yes, delete it!",
    // cancelButtonText: "No, cancel plx!",
    closeOnConfirm: false,
    closeOnCancel: false,
    confirmButtonClass: "btn-danger",
  }).then(function (isConfirm) {
    if (isConfirm) {
      swal(
        "Deleted!",
        `Your role '${role.name}' for this role has been deleted.`,
        "success"
      );
      $.ajax({
        url: `/api/v1/users/${$("#_id").val()}/roles/${roleId}/`,
        type: "DELETE",
        success: () => {
          $("#rolesInUserTable").DataTable().ajax.reload();
          // window.location.href = `/roles/form?id=${$("#_id").val()}`;
        },
      });
    } else {
      swal("Cancelled", "Your role is safe :)", "error");
    }
  });
};

app.users.refreshSelectRolesDropdown = (filterMoreList) => {
  var $el = $("#availableRoles");
  var currentRoles = app.users.generateAvailableRoles();

  if (filterMoreList) {
    //filter more by list.
    for (var i = filterMoreList.length - 1; i >= 0; i--) {
      if (currentRoles.length === 0) {
        break;
      }

      for (var y = currentRoles.length - 1; y >= 0; y--) {
        if (filterMoreList[i]._id === currentRoles[y]._id) {
          currentRoles.splice(y, 1);
        }
      }
    }
  }

  $el.empty(); // remove old options
  $.each(currentRoles, function (key, role) {
    $el.append($("<option></option>").attr("value", role._id).text(role.name));
  });
};

app.users.generateAvailableRoles = () => {
  const copyOfCurrentRoles = JSON.parse(
    JSON.stringify(app.users.data.currentRoles)
  );
  const copyOfAvailableRoles = JSON.parse(
    JSON.stringify(app.users.data.availableRoles)
  );

  for (var i = copyOfAvailableRoles.length - 1; i >= 0; i--) {
    // All current Roles have been removed
    for (var y = copyOfCurrentRoles.length - 1; y >= 0; y--) {
      if (copyOfCurrentRoles[y]._id === copyOfAvailableRoles[i]._id) {
        copyOfAvailableRoles.splice(i, 1);
        break;
      }
    }
  }

  return copyOfAvailableRoles;
};

app.users.addPermission = (permissionsId) => {
  $.ajax({
    url: `/api/v1/users/${$("#_id").val()}/permissions/`,
    type: "POST",
    data: {
      _id: permissionsId,
    },
    success: () => {
      $.notify(
        {
          title: "Update Complete : ",
          message: `Permission has been added.`,
          icon: "fa fa-check",
        },
        {
          type: "info",
        }
      );
      // swal("Updated", `Permission has been added.`, "success");
    },
  });
};

app.users.deletePermission = (permissionsId) => {
  $.ajax({
    url: `/api/v1/users/${$("#_id").val()}/permissions/${permissionsId}/`,
    type: "DELETE",
    success: () => {
      $.notify(
        {
          title: "Update Complete : ",
          message: `Permission has been deleted.`,
          icon: "fa fa-check",
        },
        {
          type: "info",
        }
      );
      // swal("Updated", `Permission has been deleted.`, "success");
    },
  });
};

app.users.togglePermission = function (elm, permissionsId) {
  const permissionSelected = $(elm).is(":checked");

  console.log('permissionSelected', permissionSelected, permissionsId)

  if (permissionSelected) {
    app.users.addPermission(permissionsId);
  } else {
    app.users.deletePermission(permissionsId);
  }
};

//permissions
app.users.refreshPermissionsList = () => {
  const currentRoles = app.users.data.currentRoles || [];
  const currentPermissions = app.users.data.currentPermissions || [];
  const copyOfAvailablePermissions = JSON.parse(
    JSON.stringify(app.users.data.availablePermissions)
  );

  console.log("roles in permissions", currentRoles, copyOfAvailablePermissions);

  for (var i = 0; i < currentRoles.length; i++) {
    for (var j = 0; j < currentRoles[i].permissions.length; j++) {
      const roles = currentRoles[i];
      const _permissionsId = currentRoles[i].permissions[j]._id;

      for (var x = 0; x < copyOfAvailablePermissions.length; x++) {
        if (copyOfAvailablePermissions[x]._id === _permissionsId) {
          copyOfAvailablePermissions[x].roles =
            copyOfAvailablePermissions[x].roles || [];
          copyOfAvailablePermissions[x].roles.push({
            name: roles.name,
            _id: roles._id,
          });

          break;
        }
      }
    }
  }

  for (var i = 0; i < currentPermissions.length; i++) {
    for (var y = 0; y < copyOfAvailablePermissions.length; y++) {
      if (currentPermissions[i]._id === copyOfAvailablePermissions[y]._id) {
        copyOfAvailablePermissions[y].checked = true;

        break;
      }
    }
  }

  console.log("copyOfAvailablePermissions", copyOfAvailablePermissions);

  $("#permissionsInUserTable").dataTable().fnClearTable();
  copyOfAvailablePermissions.map((per) => {
    $("#permissionsInUserTable").dataTable().fnAddData(per);
  });

  $("#permissionsLoading").hide();

  return copyOfAvailablePermissions;
};

$(() => {
  $.get({
    url: `/api/v1/roles/`,
    success: (results) => {
      results.data = results.data || [];
      app.users.data.availableRoles =
        results && results.data && Array.isArray(results.data)
          ? results.data
          : [results.data];
    },
  });

  if (app.users.data && app.users.data._id) {
    $("#permissionsInUserTable").DataTable({
      sDom: "t",
      // ajax: {
      //   url: `/api/v1/permissions/`,
      //   type: "GET",
      //   cache: false,
      //   dataSrc: function (json) {
      //     console.log("json p ", json);
      //     app.users.data.availablePermissions = json.data;
      //     // // $("#addRoles").modal("hide");
      //     // $("#permissionsLoading").hide();
      //     // app.users.refreshPermissionsList
      //     return json.data;
      //   },
      // },
      columns: [
        {
          data: null,
          display: "Toggle",
          render: function (data, type, row, meta) {
            if (data && data.roles && data.roles.length > 0) {
              return `<input type="checkbox" disabled checked />`;
            } else {
              return `<input type="checkbox" onchange="app.users.togglePermission(this, '${data._id}')" ${data.checked ? `checked="checked"` : ""} />`;
            }
          },
        },
        {
          data: "name",
          display: "Permission",
        },
        {
          data: null,
          display: "Role using permission.",
          render: function (data, type, row, meta) {
            // return "";
            return data && data.roles
              ? data.roles.map((role) => `${role.name}`).join(", ")
              : "";
          },
        },
      ],
    });

    //roles
    $("#rolesInUserTable").DataTable({
      sDom: "t",
      ajax: {
        url: `/api/v1/users/${$("#_id").val()}/`,
        type: "GET",
        cache: false,
        dataSrc: function (json) {
          app.users.data.currentRoles = json.data.roles;
          app.users.data.currentPermissions = json.data.permissions;
          $("#addRoles").modal("hide");
          $("#rolesLoading").hide();

          setTimeout(() => {
            $.get({
              url: `/api/v1/permissions/`,
              success: (results) => {
                app.users.data.availablePermissions = results.data;
                app.users.refreshPermissionsList();
              },
            });
          }, 1);

          return json.data.roles;
        },
      },
      columns: [
        {
          data: "name",
          display: "Role",
        },
        {
          data: null,
          display: "Action",
          render: function (data, type, row, meta) {
            return `<div class="btn btn-danger" onclick="app.users.deleteRole('${data._id}')">DELETE</div>`;
          },
        },
      ],
    });
  }
});
