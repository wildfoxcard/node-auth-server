$(function () {
  $("#search").on("submit", (e) => {
    e.preventDefault();
    $.get({
      url: "/api/v1/permissions",
      data: {
        name: $("#search-input").val(),
      },
      success: (results) => {
        if (results.success) {
          $("#permissionsList").dataTable().fnClearTable();
          if (results.data) {
            results.data.map((per) => {
              $("#permissionsList").dataTable().fnAddData(per);
            });
          }
        }
      },
    });
  });
  $("#permissionsList").DataTable({
    sDom: "t",
    ajax: {
      url: "/api/v1/permissions",
      type: "GET",
      cache: false,
      dataSrc: function (json) {
        console.log("json", json, json.data);
        return json.data;
      },
    },
    columns: [
      {
        data: "name",
        display: "Name",
      },
      {
        data: null,
        display: "Action",
        render: function (data, type, row, meta) {
          return `<a class="btn btn-warning" href="/permissions/form?id=${row._id}">Edit</a>`;
        },
      },
    ],
  });
});
