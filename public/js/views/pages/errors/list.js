$(function () {
    console.log('running...')
      $("#errorsList").DataTable({
        sDom: "t",
        ajax: {
          url: "/api/v1/errors",
          type: "GET",
          cache: false,
          dataSrc: function (json) {
              console.log('json', json, json.data)
            return json.data;
          },
        },
        columns: [
            {
              data: "application",
              display: "Application",
            },
          {
            data: "message",
            display: "Message",
          },
          {
            data: "createdAt",
            display: "Created At",
          },
          {
            data: null,
            display: "Action",
            render: function (data, type, row, meta) {
              return `<a class="btn btn-info" href="/errors/log?id=${row._id}">View</a>`;
            },
          },
        ],
      });
    });