$(function () {
  $("#search").on("submit", (e) => {
    e.preventDefault();
    $.get({
      url: "/api/v1/roles",
      data: {
        name: $("#search-input").val(),
      },
      success: (results) => {
        if (results.success) {
          $("#rolesTable").dataTable().fnClearTable();
          if (results.data) {
            results.data.map((per) => {
              $("#rolesTable").dataTable().fnAddData(per);
            });
          }
        }
      },
    });
  });
  $("#rolesTable").DataTable({
    sDom: "t",
    ajax: {
      url: "/api/v1/roles",
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
          return `<a class="btn btn-warning" href="/roles/form?id=${row._id}">Edit</a>`;
        },
      },
    ],
  });
});
