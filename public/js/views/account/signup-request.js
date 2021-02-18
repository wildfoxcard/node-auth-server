app.account.request = {};

app.account.request.submit = e => {
    e.preventDefault();

    $.post({
        url: "/api/v1/user-requests/",
        data: {
            email: $("#email").val(),
            name: $('#name').val()
        },
        success: function () {
            window.location.href = "/signup/request/"
        }
    })
}

$(() => {
    $("#request-form").submit(app.account.request.submit)
})