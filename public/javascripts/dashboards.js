$(document).ready(function() {

    // Load all dashboards in the global registry first.
    $.ajax({
        url: '/a/dashboards',
        success: function(data) {
            globalDashboards = data;
            applyDashboardsToAllSelectors();
        },
        error: function(data) {
            showError("Could not load list of dashboards");
        }
    });

    if ($(".gridster").size() > 0){
        dashboardGrid = $(".gridster ul").gridster({
            widget_margins: [10, 10],
            widget_base_dimensions: [400, 150]
        }).data('gridster').disable();
    }

    function applyDashboardsToAllSelectors() {
        if (Object.keys(globalDashboards).length > 0) {
            $("a.add-to-dashboard[data-widget-type]").each(function() {
                var dashboardList = $("ul.dashboard-selector", $(this).parent());
                $("li", dashboardList).remove();

                for (var key in globalDashboards) {
                    var dashboard = globalDashboards[key];
                    var link = "<li><a href='#' data-dashboard-id='" + key + "'>" + htmlEscape(dashboard.title) + "</a></li>"
                    dashboardList.append(link);
                }
            });
        }
    }

    $("ul.dashboard-selector li a[data-dashboard-id]").live("click", function() {
        delegateAddToDashboard($(this).closest("ul.dashboard-selector").attr("data-widget-type"), $(this).attr("data-dashboard-id"));
    })

    $(".dashboard .widget .remove-widget").live("click", function(e) {
        e.preventDefault();

        if(!confirm("Really remove widget? The page will reload after removing it.")) {
            return;
        }

        var widget = $(this).closest(".widget");

        $.ajax({
            url: '/a/dashboards/' + widget.attr("data-dashboard-id") + '/widgets/' + widget.attr("data-widget-id") + '/delete',
            type: 'POST',
            success: function() {
                showSuccess("Widget has been removed from dashboard!")
                widget.parent().remove();
                location.reload();
            },
            error: function(data) {
                showError("Could not remove widget from dashboard.");
            }
        });
    });

    function delegateAddToDashboard(widgetType, dashboardId) {
        switch(widgetType) {
            case "search-result-count":
                addSearchResultCountWidget(dashboardId);
                break;
        }
    }

    function addSearchResultCountWidget(dashboardId) {
        var params = originalUniversalSearchSettings();
        params.widgetType = "SEARCH_RESULT_COUNT";

        addWidget(dashboardId, params);
    }

    function addWidget(dashboardId, params) {
        $.ajax({
            url: '/a/dashboards/' + dashboardId + '/widgets',
            type: 'POST',
            data: params,
            success: function() {
                showSuccess("Widget added to dashboard!")
            },
            error: function(data) {
                showError("Could not add widget to dashboard.");
            }
        });
    }

    $(".unlock-dashboard-widgets").on("click", function() {
        dashboardGrid.enable();
        $(".dashboard .gridster .gs-w").css("cursor", "move");
        $(this).hide();
        $(".dashboard .widget .only-unlocked").show();
        $(".dashboard .widget .hidden-unlocked").hide();
        $(".lock-dashboard-widgets").show();
    });

    $(".lock-dashboard-widgets").on("click", function() {
        dashboardGrid.disable();
        $(".dashboard .gridster .gs-w").css("cursor", "default");
        $(this).hide();
        $(".dashboard .widget .hidden-unlocked").show();
        $(".dashboard .widget .only-unlocked").hide();
        $(".unlock-dashboard-widgets").show();
    });

    $(".dashboard .widget .edit-description").on("click", function() {
        var widget = $(this).closest(".widget");

        $(".description", widget).hide();
        $(".description-form", widget).show();
    });

    $(".dashboard .widget .description-form input").on("keyup", function() {
        var widget = $(this).closest(".widget");

        if ($(this).val().length > 0) {
            $("button.update-description", widget).prop("disabled", false);
        } else {
            $("button.update-description", widget).prop("disabled", true);
        }
    });

    $(".dashboard .widget .edit-cache-time").on("click", function() {
        var widget = $(this).closest(".widget");

        var dashboardId = widget.attr("data-dashboard-id");
        var widgetId = widget.attr("data-widget-id");

        var modalWindow = $("#dashboardwidget-cache-time");
        var button = $("button.update-cachetime", modalWindow);

        $("input.cachetime-value", modalWindow).val($(".cache-time-value", widget).text());
        button.attr("data-dashboard-id", dashboardId);
        button.attr("data-widget-id", widgetId);

        modalWindow.modal();
    });

    $("#dashboardwidget-cache-time input.cachetime-value").on("keyup", function() {
        if ($(this).val().length > 0 && isNumber($(this).val()) && parseInt($(this).val()) >= 1) {
            $("#dashboardwidget-cache-time button.update-cachetime").prop("disabled", false);
        } else {
            $("#dashboardwidget-cache-time button.update-cachetime").prop("disabled", true);
        }
    });

    $("#dashboardwidget-cache-time button.update-cachetime").on("click", function() {
        var widget = $('.dashboard .widget[data-widget-id="' + $(this).attr("data-widget-id") + '"]')
        var newVal = $("#dashboardwidget-cache-time input.cachetime-value").val();

        var dashboardId = widget.attr("data-dashboard-id");
        var widgetId = widget.attr("data-widget-id");

        $.ajax({
            url: '/a/dashboards/' + dashboardId + '/widgets/' + widgetId + '/cachetime',
            data: {
                cacheTime: newVal
            },
            type: 'POST',
            success: function(data) {
                $(".info .cache-info .cache-time .cache-time-value", widget).text(newVal);

                showSuccess("Widget cache time updated!")
            },
            error: function(data) {
                showError("Could not update widget cache time.")
            },
            complete: function(data) {
                $("#dashboardwidget-cache-time").modal('hide');
            }
        });
    });

    $("button.update-description").on("click", function() {
        var widget = $(this).closest(".widget");
        var dashboardId = widget.attr("data-dashboard-id");
        var widgetId = widget.attr("data-widget-id");

        var newVal = $(".description-value", widget).val().trim();

        $.ajax({
            url: '/a/dashboards/' + dashboardId + '/widgets/' + widgetId + '/description',
            data: {
                description: newVal
            },
            type: 'POST',
            success: function(data) {
                $(".description .title", widget).text(newVal);
                $(".description", widget).show();
                $(".description-form", widget).hide();
                $(".description", widget).show();

                showSuccess("Widget description updated!")
            },
            error: function(data) {
                showError("Could not update widget description.")
            }
        });
    });

    // Periodically poll every widget.
    (function updateDashboardWidgets() {
        var interval = 1000;

        if(!focussed) {
            setTimeout(updateDashboardWidgets, interval);
            return;
        }

        $(".dashboard .widget[data-widget-type][data-disabled!='true']").each(function() {
            switch($(this).attr("data-widget-type")) {
                case "search_result_count":
                    updateSearchResultCountWidget($(this));
                    break;
            }
        }).promise().done(function(){ setTimeout(updateDashboardWidgets, interval); });
    })();

    function updateSearchResultCountWidget(widget) {
        var dashboardId = widget.attr("data-dashboard-id");
        var widgetId = widget.attr("data-widget-id");

        $(".reloading", widget).show();

        $.ajax({
            url: '/a/dashboards/' + dashboardId + '/widgets/' + widgetId + '/value',
            type: 'GET',
            success: function(data) {
                $(".value", widget).text(numeral(data.result).format());
                $(".calculated-at", widget).attr("title", data.calculated_at);
                $(".calculated-at", widget).text(moment(data.calculated_at).fromNow());
            },
            error: function(data) {
                widget.attr("data-disabled", "true");
                showErrorInWidget(widget);
            },
            complete: function(data) {
                $(".reloading", widget).hide();
            }
        });
    }

    function showErrorInWidget(widget) {
        $(".value", widget).html("<i class='icon icon-warning-sign loading-failed'></i>");
    }

});