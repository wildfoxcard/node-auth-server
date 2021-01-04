$(function () {
    $("#samppermissionsListeTable").DataTable({
      processing: true,
      serverSide: true,
      sDom: "t",
    //   ajax: {
    //     url: "/graphql",
    //     type: "POST",
    //     data: { query: "query{ users {email, id, created_at} }" },
    //     dataSrc: function (json) {
    //       //   console.log('json', json, json.data.users)
    //       return json.data.users;
    //     },
    //   },
    //   columns: [
    //     {
    //       data: "email",
    //       display: "Email",
    //     },
    //     {
    //       data: null,
    //       display: "Action",
    //       render: function (data, type, row, meta) {
    //         return `<a class="btn btn-warning" href="/user-management/form?id=${row.id}">Edit</a>`;
    //       },
    //     },
    //   ],
    });
  });
  