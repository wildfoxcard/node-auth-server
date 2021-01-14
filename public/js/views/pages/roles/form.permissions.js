app.roles.data.currentPermissions = [];
app.roles.data.availablePermissions = [];
let currentlySelectedPermissions = [];

app.roles.deleteTag = (_id) => {
  for (var i = 0; i < currentlySelectedPermissions.length; i++) {
    if (_id === currentlySelectedPermissions[i]._id) {
      currentlySelectedPermissions.splice(i, 1);
    }
  }

  $('.alert[data-id="' + _id + '"]').remove();
  app.roles.refreshSelectPermissionsDropdown(currentlySelectedPermissions);
};

app.roles.createTag = (id, name) => {
  var permisionName = $("<p/>").html(name);
  var closeButton = $("<div/>")
    .addClass("btn")
    .addClass("btn-danger")
    .addClass("float-right")
    .on("click", () => {
      app.roles.deleteTag(id);
    })
    .html("<strong>X</strong>");
  return $("<div/>")
    .addClass("alert")
    .addClass("alert-success")
    .attr("data-id", id)
    .append(closeButton)
    .append(permisionName);
};

app.roles.addPermission = () => {
  var name = $("#availablePermissions").find(":selected").text();
  var id = $("#availablePermissions").find(":selected").val();

  currentlySelectedPermissions.push({ _id: id, name: name });

  $("#permissionTags").append(app.roles.createTag(id, name));

  app.roles.refreshSelectPermissionsDropdown(currentlySelectedPermissions);
};

app.roles.submitNewPermissionsToAdd = () => {
  for (var i = 0; i < currentlySelectedPermissions.length; i++) {
    $.ajax({
      url: `/api/v1/roles/${$("#_id").val()}/permissions/`,
      type: "POST",
      async: true,
      data: currentlySelectedPermissions[i],
      success: () => {
        if (i === currentlySelectedPermissions.length) {
          currentlySelectedPermissions = [];
          $("#permissionsInRolesTable").DataTable().ajax.reload();
          $("#permissionTags").html("");
          $.notify(
            {
              title: "Update Complete : ",
              message: `Permission(s) successfully added!`,
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

app.roles.deletePermission = (permissionId) => {
  let permission;
  for (var i = 0; i < app.roles.data.availablePermissions.length; i++) {
    if (permissionId === app.roles.data.availablePermissions[i]._id) {
      permission = app.roles.data.availablePermissions[i];
    }
  }

  swal({
    title: "Are you sure?",
    text: `You will not be able to recover this permission '${permission.name}' on this role! You can re-add the permission later though.`,
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
        `Your permission '${permission.name}' for this role has been deleted.`,
        "success"
      );
      $.ajax({
        url: `/api/v1/roles/${$("#_id").val()}/permissions/${permissionId}/`,
        type: "DELETE",
        success: () => {
          $("#permissionsInRolesTable").DataTable().ajax.reload();
          // window.location.href = `/roles/form?id=${$("#_id").val()}`;
        },
      });
    } else {
      swal("Cancelled", "Your permission is safe :)", "error");
    }
  });
};

app.roles.refreshSelectPermissionsDropdown = (filterMoreList) => {
  var $el = $("#availablePermissions");
  var currentPermissions = app.roles.generateAvailablePermissions();

  if (filterMoreList) {
    //filter more by list.
    for (var i = filterMoreList.length - 1; i >= 0; i--) {
      if (currentPermissions.length === 0) {
        break;
      }

      for (var y = currentPermissions.length - 1; y >= 0; y--) {
        if (filterMoreList[i]._id === currentPermissions[y]._id) {
          currentPermissions.splice(y, 1);
        }
      }
    }
  }

  $el.empty(); // remove old options
  $.each(currentPermissions, function (key, permission) {
    $el.append(
      $("<option></option>").attr("value", permission._id).text(permission.name)
    );
  });
};

app.roles.generateAvailablePermissions = () => {
  const copyOfCurrentPermissions = JSON.parse(
    JSON.stringify(app.roles.data.currentPermissions)
  );
  const copyOfAvailablePermissions = JSON.parse(
    JSON.stringify(app.roles.data.availablePermissions)
  );

  for (var i = copyOfAvailablePermissions.length - 1; i >= 0; i--) {
    // All current Permissions have been removed
    for (var y = copyOfCurrentPermissions.length - 1; y >= 0; y--) {
      if (
        copyOfCurrentPermissions[y]._id === copyOfAvailablePermissions[i]._id
      ) {
        copyOfAvailablePermissions.splice(i, 1);
        break;
      }
    }
  }

  return copyOfAvailablePermissions;
};

$(() => {
  $.get({
    url: "/api/v1/permissions",
    success: (results) => {
      app.roles.data.availablePermissions = results.data || [];
    },
  });

  if (app.roles.data && app.roles.data._id) {
    $("#permissionsInRolesTable").DataTable({
      sDom: "t",
      ajax: {
        url: "/api/v1/roles/" + app.roles.data._id,
        type: "GET",
        cache: false,
        dataSrc: function (json) {
          app.roles.data.currentPermissions = json.data.permissions;
          $("#addPermission").modal("hide");
          $("#permissionsLoading").hide();

          return json.data.permissions;
        },
      },
      columns: [
        {
          data: "name",
          display: "Permission",
        },
        {
          data: null,
          display: "Action",
          render: function (data, type, row, meta) {
            return `<a class="btn btn-danger" href="#" onclick="app.roles.deletePermission('${data._id}')">DELETE</a>`;
          },
        },
      ],
    });
  }
});
