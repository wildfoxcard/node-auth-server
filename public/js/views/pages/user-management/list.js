$(function () {
  console.log('running...')
    $("#leadManagementTable").DataTable({
      sDom: "t",
      ajax: {
        url: "/api/v1/users",
        type: "GET",
        cache: false,
        dataSrc: function (json) {
            console.log('json', json, json.data)
          return json.data;
        },
      },
      columns: [
        {
          data: "email",
          display: "Email",
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
  