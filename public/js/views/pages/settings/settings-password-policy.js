app.settings.passwordPolicy.save = () => {
    const passwordLength = $("#passwordLength").val();
    const shouldHaveUppercaseLetter = $("#shouldHaveUppercaseLetter").is(":checked");
    const shouldHaveLowercaseLetter = $("#shouldHaveLowercaseLetter").is(":checked");
    const shouldHaveNumber = $("#shouldHaveNumber").is(":checked");
    const shouldHaveSymbol = $("#shouldHaveSymbol").is(":checked");

    $.post({
      url: "/api/v1/settings/password-policy/",
      data: {
        passwordLength: passwordLength,
        shouldHaveUppercaseLetter: shouldHaveUppercaseLetter,
        shouldHaveLowercaseLetter: shouldHaveLowercaseLetter,
        shouldHaveNumber: shouldHaveNumber,
        shouldHaveSymbol: shouldHaveSymbol,
      },
      success: (results) => {
          if (results.success) {
            $.notify(
                {
                  title: "Update Complete : ",
                  message: `Password Policy has been updated`,
                  icon: "fa fa-check",
                },
                {
                  type: "info",
                }
              );
          } else {
            $.notify(
                {
                  title: "Error : ",
                  message: results.message,
                  icon: "fa fa-exclamation-triangle",
                },
                {
                  type: "danger",
                }
              );
          }
        
        $("#settingsPasswordPolicyLoading").hide();
      },
    });
  };
  
  app.settings.passwordPolicy.load = () => {
    $.get({
      url: "/api/v1/settings/password-policy/",
      success: (results) => {
        $("#passwordLength").val(results.data.passwordLength);
        $("#shouldHaveUppercaseLetter").prop('checked',results.data.shouldHaveUppercaseLetter);
        $("#shouldHaveLowercaseLetter").prop('checked',results.data.shouldHaveLowercaseLetter);
        $("#shouldHaveNumber").prop('checked',results.data.shouldHaveNumber);
        $("#shouldHaveSymbol").prop('checked',results.data.shouldHaveSymbol);

        $("#settingsPasswordPolicyLoading").hide();
      },
    });
  };
  
  $(() => {
    $("#settingsPasswordPolicyLoading").show();
    app.settings.passwordPolicy.load();
  });
  