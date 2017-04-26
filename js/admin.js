//var SERVICE_BASEURL = "http://61.8.142.155:5656/";
var SERVICE_BASEURL = "http://techchef.dminc.com/";
//var SERVICE_BASEURL = "http://localhost:4587/";
//var SERVICE_BASEURL = "http://192.168.193.96:5656/";
//var SERVICE_BASEURL = "http://61.8.142.155:5555/";
//var SERVICE_BASEURL = "http://techchef.dminc.com/";
var USER_AUTH_JSON = '{"Password":"{0}", "UserName":"{1}", "UserType":"{2}", "FullName": "{3}"}';

var master_categories = null;
var master_teams = null;
var master_subCategories = null;
var master_scores = null;
var master_results = null;

var maxArray = new Array();
var selectedTeamID = 0;
var selectedCategoryID = 0;

var empSelectedTeamID = 0;
var empSelectedCategoryID = 0;

var selectedEmployeeID = 0;
var selectedEmployeeName = '';

var selectedJudgeID = 0;
var selectedJudgeName = '';

var UserID = "";
var UserDisplayName = "";
var expiryDateTime;


var collapsibleSections = "<div data-role='collapsible' data-collapsed='{2}' data-mini='true'><h3>{0}</h3><div><p><div style='overflow: auto; width: inherit'>{1}</div></p></div></div>";
//var accordion = '<div data-role="collapsible-set" data-theme="e" data-content-theme="e">{0}</div>';
var accordion = '<div>{0}</div>';

var chartDataJudgeCat, chartDataJudgeTeam, chartDataEmpCat, chartDataEmpTeam;
var cType, cUserType;

var chartWidth, chartHeight;
var enlargeTableHtml = '';
var enlargeTableTitle = '';
var ISCLIENTAPP = true;

var SCORING_OPEN = true;
var TOTAL_HEADER = 'Judge(s) Total';

$("#login").on("pagebeforecreate", function (event, ui) {

});

$("#login").on("pagecreate", function (event, ui) {

});


$('#login').on('pagebeforeshow', function (event, ui) {
    UserID = '';
    UserDisplayName = '';
});

$('#login').on('pageshow', function (event, ui) {
    
});


$(document).delegate('[data-role=page]', 'pageinit', function () {
    //$.mobile.touchOverflowEnabled = false;
    //$('[data-position=fixed]').fixedtoolbar({ tapToggle: false });
    //$.mobile.orientationChangeEnabled = false;
    //alert(GetScreenWidth());
});


function AuthenticationServiceFailed(xhr) {
    //UserID = '';
    HideLoading();
    NotifyUser("Service Error: Could not access the service!");
    return;
}

function ShowLoading() {
    $.mobile.loading("show");
}

function HideLoading() {

    try {
        setTimeout(function () { $.mobile.loading("hide"); }, 1000);
    }
    catch (err) {
        $.mobile.loading("hide");
    }
}

// Handle the back button
//
function onBackKeyDown() {
    if (ISCLIENTAPP) {

        try {
            navigator.notification.confirm('Are you sure you want to Log Out?',
            function (button) { if (button == 1) $.mobile.changePage("index.html", { transition: "slidedown", changeHash: true }); },
            'TECH CHEF', 'Yes,No');
        }
        catch (Err) {

        }
    }
    else {
        $.mobile.changePage("index.html", { transition: "slidedown", changeHash: true });
    }
}

var messageValue;

function AuthenticateUser(userType, isTab) {

    if (isTab)
        $("#btlTabLoginSubmit").focus();
    else
        $("#btlSPLoginSubmit").focus();

        
    try {

        var userAuthString = '';
        if (userType == 'admin') {
            var userName = '';
            var password = '';

            if (isTab) {
                userName = $('#txtTabUsername').val();
                password = $('#txtTabPassword').val();
            }
            else {
                userName = $('#txtSPUsername').val();
                password = $('#txtSPPassword').val();
            }

            //Check if the user name and pasword are entered by the user
            if (userName != null && userName != '' && password != null && password != '') {
            }
            else {
                HideLoading();
                NotifyUser('Please enter a valid Username and Password.');
                return false;
            }

            userAuthString = String.format(USER_AUTH_JSON, password, userName, "admin", "");

            ShowLoading();

            var Url = SERVICE_BASEURL + "Chef/Auth";

            if (checkConnection()) {
                $.ajax({
                    type: "POST", //GET or POST or PUT or DELETE verb
                    url: Url, // Location of the service
                    data: userAuthString,
                    contentType: "application/json",
                    dataType: 'json',
                    async: false,
                    crossdomain: true,
                    processdata: true,

                    success: function (msg) {//On Successfull service call
                        messageValue = msg;

                        if (msg.serviceStatus.Success != undefined &&
                        msg.serviceStatus.Success != false) {
                            expiryDateTime = parseJsonDate(msg.serviceStatus.Expiry);
                            UserID = msg.serviceStatus.UserToken;
                            UserDisplayName = msg.DisplayName;

                            SetEntities(msg);
                        }
                        else
                            UserID = '';

                    },
                    error: AuthenticationServiceFailed// When Service call fails
                });
            }
            else {
                HideLoading();
                return false;
            }
        }


        if (UserID != '') {
            setTimeout(function () {
                $.mobile.changePage("#judgeScore", { transition: "slide", changeHash: true });
                HideLoading();
            }, 1000);
            return false;
        }
        else {
            HideLoading();
            NotifyUser("Authentication failed!");
            return false;
        }
    }
    catch (err) {
        NotifyUser(err.Message);
    }

    HideLoading();

    return false;
}


function parseJsonDate(jsonDateString) {
    return new Date(parseInt(jsonDateString.replace('/Date(', '')));
}

function SetEntities(entities) {
    master_categories = entities.Categories;
    master_subCategories = entities.SubCategories;
    master_teams = entities.Teams;
    master_scores = entities.Scores;
    master_results = entities.UserData;
}




$('#judgeScore').on('pagebeforeshow', function (event, ui) {
    $("#ScoreByCategory").html('');
    $("#ScoreByTeam").html('');
    RenderJudgeScore(ui.prevPage.attr('id'));
}); 

$('#judgeScore').on('pageshow', function (event, ui) {

    JudgesScoreByTeams('jsTable');
    JudgesScoreByCategory('jsTable');
    //alert('Test');
    //ReOrderColumn();
});


function RefreshPage() {

    switch ($.mobile.activePage.attr('id')) {
        case "judgeScore": RefreshJudgeScore($.mobile.activePage.attr('id')); break;
        case "teamScore": RefreshTeamScore(); break;
        case "categoryScore": RefreshCategoryScore(); break;
        case "employeeScore": RefreshEmployeeScore(); break;
        case "employeeCatScore": RefreshEmpCatScore(); break;
        case "employeeTeamScore": RefreshEmpTeamScore(); break;
        case "employees": RefreshEmp(); break;
        case "employeeRating": RefreshEmpRating(); break;
        case "chartPage": RefreshChartPage(); break;
        case "judges": RefreshJudges(); break;
        case "judgeRating": RefreshJudgeRatings(); break;
        case "tablePage": RefreshTablePage(); break;
        case "operations": RefreshOperations(); break;
    }

    return false;
}

function RefreshJudgeScore(page) {
    $("#ScoreByCategory").html('');
    $("#ScoreByTeam").html('');
    RenderJudgeScore(page);
    JudgesScoreByTeams('jsTable');
    JudgesScoreByCategory('jsTable');
    //ReOrderColumn();
}

function ReOrderColumn() {
    var tbl = $('#jsTable');
    $.moveColumn(tbl, 5, 4);
}


function RenderJudgeScore(prevPage) {

    try {

        ShowLoading();

        if (prevPage != 'login') {
            GetJudgeScore()
        }


        SetUsreWelcomeText("#jsUser");
        ShowJudgeScore();
    }
    catch (err) {
    }

    HideLoading();
}

function GetJudgeScore() {

    if (checkConnection()) {
        var GetUrl = SERVICE_BASEURL + String.format("Chef/GetTeamsScore?userId={0}&utype=judge", UserID);

        $.ajax({
            type: "GET", //GET or POST or PUT or DELETE verb
            url: GetUrl, // Location of the service                
            dataType: 'json',
            crossdomain: true,
            async: false,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Accept", "application/json");
            },
            success: function (msg) {//On Successfull service call
                master_results = eval(msg);
            },
            error: AuthenticationServiceFailed// When Service call fails
        });
    }
}

var testObject;
function ShowJudgeScore() {

    var messageValue = eval(master_results);

    if (messageValue != null && messageValue.length > 0) {
        testObject =  messageValue;
        tempObject = DrawJSTable(messageValue, "1", true, 'team', 'category', 'jsTable', 'Scoretable');

        $("#jstableContainer").html(tempObject);

        $.each(maxArray, function () {
            $.each(this.CellIds, function () {
                $(String.format("#{0}", this)).addClass("HighstMarks");

            });
        });

        ReOrderColumn();

        $("#jtblEnlarge").show();
        $("#jTCEnlarge").show();
        $("#jCCEnlarge").show();
        $("#jClearScores").show();
        $("#jScores").show();
    }
    else {
        $("#jstableContainer").html("No scores added by the judges or employees.");
        $("#jtblEnlarge").hide();
        $("#jTCEnlarge").hide();
        $("#jCCEnlarge").hide();
        $("#jClearScores").hide();
        $("#jScores").hide();
    }
}


function SetUsreWelcomeText(elementID) {
    $(elementID).html(String.format("Welcome {0}", UserDisplayName));
}

function SetPageTitle(ID, elementID, type) {
    var strHtml = '';
    var refreshButton = '<span class="rating"><a href="#" onclick="return RefreshPage();"><img src="images/refresh.png"></a></span>';

    if (type == "team")
        strHtml = GetTeamTitle(ID);
    else if (type == "category")
        strHtml = GetCategoryTitle(ID);
    else if (type == "employee")
        strHtml = "Score: " + selectedEmployeeName;
    else if (type == "judge")
        strHtml = "Score: " + selectedJudgeName;

    strHtml += refreshButton;

    $(elementID).html(strHtml);
}

function MaxObject(value) {
    this.CellIds = new Array();
    this.Value = value;
}

function DrillDown(dType, value, tableID) {
    
    if (dType == "team") {

        if (tableID == "jsTable") {
            selectedTeamID = GetTeamID(value);
            $.mobile.changePage("#teamScore");
        }
        else {
            empSelectedTeamID = GetTeamID(value);
            $.mobile.changePage("#employeeTeamScore");
        }
    }
    else if (dType == "category") {
        
        if (tableID == "jsTable") {
            selectedCategoryID = GetCategoryID(value);    
            $.mobile.changePage("#categoryScore");
        }
        else {
            empSelectedCategoryID = GetCategoryID(value);
            $.mobile.changePage("#employeeCatScore");
        }

    }

    return false;
}


function GetTeamID(teamTitle) {
    var teamID = 0;

    $.each(master_teams, function (index, team) {

        if (team.Team_Name == teamTitle)
            teamID = team.Team_Id;
    });

    return teamID;
}


function GetTeamTitle(teamID) {
    var teamTitle = '';

    $.each(master_teams, function (index, team) {

        if (team.Team_Id == teamID)
            teamTitle = team.Team_Name;
    });

    return teamTitle;
}


function GetCategoryID(categoryTitle) {
    var categoryID;

    $.each(master_categories, function (index, category) {
        if (category.Category_Name == categoryTitle)
            categoryID = category.Category_Id;
    });

    return categoryID;
}

function GetCategoryTitle(categoryID) {
    var categoryTitle = '';

    $.each(master_categories, function (index, category) {
        if (category.Category_Id == categoryID)
            categoryTitle = category.Category_Name;
    });

    return categoryTitle;
}


function DrawJSTable(rawObject, sectionId, showTotal, aFirstRow, aFirstColumn, tableID, cssClass) {

    var table = String.format("<table id='{0}' width='100%' border='1' cellpadding='0' cellspacing='0' class='{1}'>", tableID, cssClass);
    var tableHeader = "";
    var tableRow = "";
    var row = 0;
    var column = 0;
    var totoalColumnNo = -1;
    var rowTotal = 0;

    maxArray = new Array();

    $.each(rawObject, function () {

        if (row == 0) {
            tableHeader = "<tr><th></th>";
        }

        if (aFirstColumn != '')
            tableRow = String.format("<tr><td class='anchorcell' onclick='return DrillDown(\"{1}\", \"{0}\", \"{2}\");'>{0}</td>", this.rowTitle, aFirstRow, tableID);
        else
            tableRow = String.format("<tr><td class='first'>{0}</td>", this.rowTitle);

        column = 0;
        $.each(this.columns, function () {
            if (row == 0) {
                if (aFirstColumn != '')
                    tableHeader += String.format("<th class='anchorcell' onclick='return DrillDown(\"{1}\", \"{0}\", \"{2}\");'>{0}</th>", this.ch, aFirstColumn, tableID);
                else
                    tableHeader += String.format("<th>{0}</th>", this.ch);

                var maxObj = new MaxObject(0);
                maxArray.push(maxObj);
            }
           
            if (this.ch != 'Style') {
                tableRow += String.format("<td id='c{1}_{0}_{3}'>{2}</td>", column, row, this.cc, sectionId);
                rowTotal += parseInt(this.cc);
            }
            else
                tableRow += String.format("<td class='Total2' id='c{1}_{0}_{3}'>{2}</td>", column, row, this.cc, sectionId);

            if (maxArray[column].Value < parseInt(this.cc)) {
                maxArray[column].CellIds = new Array();
                maxArray[column].Value = parseInt(this.cc);
                maxArray[column].CellIds.push(String.format("c{1}_{0}_{2}", column, row, sectionId));
            }
            else if (maxArray[column].Value == parseInt(this.cc)) {
                maxArray[column].CellIds.push(String.format("c{1}_{0}_{2}", column, row, sectionId));
            }
            column++;
        });

        if (row == 0) {
            if (showTotal) {
                tableHeader += String.format("<th>{0}</th>", TOTAL_HEADER);
            }
            table += tableHeader;
            table += "</tr>";
            var maxObj = new MaxObject(0);
            maxArray.push(maxObj);
        }
        if (showTotal)
            tableRow += String.format("<td class='Total1' id='c{1}_{0}_{3}'>{2}</td>", column, row, rowTotal, sectionId);
        tableRow += "</tr>";

        if (maxArray[column].Value < parseInt(rowTotal)) {
            maxArray[column].CellIds = new Array();
            maxArray[column].Value = parseInt(rowTotal);
            maxArray[column].CellIds.push(String.format("c{1}_{0}_{2}", column, row, sectionId));
        }
        else if (maxArray[column].Value == parseInt(rowTotal)) {
            maxArray[column].CellIds.push(String.format("c{1}_{0}_{2}", column, row, sectionId));
        }


        row++;
        rowTotal = 0;
        table += tableRow;


    });
    table += "</table>";

    return table;
}


$.moveColumn = function (table, from, to) {
    var rows = $('tr', table);
    var cols;
    rows.each(function () {
        cols = $(this).children('th, td');
        cols.eq(from).detach().insertBefore(cols.eq(to));
    });
}

function DrawTable(rawObject, sectionId, showTotal, aFirstRow, aFirstColumn, tableID, cssClass) {
    
    var table = String.format("<table id='{0}' width='100%' border='1' cellpadding='0' cellspacing='0' class='{1}'>", tableID, cssClass);
    var tableHeader = "";
    var tableRow = "";
    var row = 0;
    var column = 0;
    var totoalColumnNo = -1;
    var rowTotal = 0;

    maxArray = new Array();

    $.each(rawObject, function () {

        if (row == 0) {
            tableHeader = "<tr><th></th>";
        }

        if (aFirstColumn != '')
            tableRow = String.format("<tr><td class='anchorcell' onclick='return DrillDown(\"{1}\", \"{0}\", \"{2}\");'>{0}</td>", this.rowTitle, aFirstRow, tableID);
        else
            tableRow = String.format("<tr><td class='first'>{0}</td>", this.rowTitle);

        column = 0;
        $.each(this.columns, function () {
            if (row == 0) {
                if (aFirstColumn != '')
                    tableHeader += String.format("<th class='anchorcell' onclick='return DrillDown(\"{1}\", \"{0}\", \"{2}\");'>{0}</th>", this.ch, aFirstColumn, tableID);
                else
                    tableHeader += String.format("<th>{0}</th>", this.ch);

                var maxObj = new MaxObject(0);
                maxArray.push(maxObj);
            }
            tableRow += String.format("<td id='c{1}_{0}_{3}'>{2}</td>", column, row, this.cc, sectionId);
            rowTotal += parseInt(this.cc);
            if (maxArray[column].Value < parseInt(this.cc)) {
                maxArray[column].CellIds = new Array();
                maxArray[column].Value = parseInt(this.cc);
                maxArray[column].CellIds.push(String.format("c{1}_{0}_{2}", column, row, sectionId));
            }
            else if (maxArray[column].Value == parseInt(this.cc)) {
                maxArray[column].CellIds.push(String.format("c{1}_{0}_{2}", column, row, sectionId));
            }
            column++;
        });

        if (row == 0) {
            if (showTotal) {
                tableHeader += "<th>Total</th>";
            }
            table += tableHeader;
            table += "</tr>";
            var maxObj = new MaxObject(0);
            maxArray.push(maxObj);
        }
        if (showTotal)
            tableRow += String.format("<td class='Total' id='c{1}_{0}_{3}'>{2}</td>", column, row, rowTotal, sectionId);
        tableRow += "</tr>";

        if (maxArray[column].Value < parseInt(rowTotal)) {
            maxArray[column].CellIds = new Array();
            maxArray[column].Value = parseInt(rowTotal);
            maxArray[column].CellIds.push(String.format("c{1}_{0}_{2}", column, row, sectionId));
        }
        else if (maxArray[column].Value == parseInt(rowTotal)) {
            maxArray[column].CellIds.push(String.format("c{1}_{0}_{2}", column, row, sectionId));
        }


        row++;
        rowTotal = 0;
        table += tableRow;


    });
    table += "</table>";

    return table;
}

function GetJudgesScoreByCategory(tableID) {

    var table = document.getElementById(tableID);
    var strJson = '';

    if (table != null) {
        //Default value
        var TotalIndex = -1;

        for (var i = 0, row; row = table.rows[i]; i++) {
            var strRow = '';
            for (var j = 0, col; j < row.cells.length; j++) {
                col = row.cells[j];

                if (col.innerText == TOTAL_HEADER) {
                    TotalIndex = j;
                    continue;
                }

                if (i == 0) {
                    if (j == 0)
                        strRow = "'Teams'";
                    else {
                        if (j != TotalIndex)
                            strRow += String.format(",'{0}'", col.innerText);
                    }
                }
                else {
                    if (j != TotalIndex) {
                        if (j == 0)
                            strRow = "'" + col.innerText + "'";
                        else
                            strRow += String.format(",{0}", col.innerText);
                    }
                }
            }

            if (i != 0)
                strJson += ',';

            strJson += '[' + strRow + ']';
        }
    }

    return eval('[' + strJson + ']');
}


function GetJudgesScoreByTeams(tableID) {

    var table = document.getElementById(tableID);
    var strJson = '';

    if (table != null) {
        var strHeader = ''
        var strValues = '';
        var TotalIndex = 0;

        for (var i = 0, row; row = table.rows[i]; i++) {
   
            if (i == 0) {
                for (var j = 0, col; j < row.cells.length; j++) {
                    if (row.cells[j].innerText == TOTAL_HEADER) {
                        TotalIndex = j;
                        break;
                    }
                }
            }

            for (var j = 0, col; j < row.cells.length - 1; j++) {
                col = row.cells[j];

                if (i == 0) {
                    strHeader = "''";
                    strValues = "''";
                }
                else {
                    strHeader += String.format(",'{0}'", col.innerText);
                    strValues += String.format(",{0}", row.cells[TotalIndex].innerText);
                }

                break;
            }
        }

        strJson = String.format("[{0}],[{1}]", strHeader, strValues);
    }
    
    return eval('[' + strJson + ']');
}

function SetChartPageProperties(type, userType)
{
    cType = type;
    cUserType = userType;
    $.mobile.changePage("#chartPage");

}

function RenderChartScreen() {
   var titleText = '';
   var data;

   GetChartWidthHeight();

   if (cType == 'team') {
       if (cUserType == 'judge') {
           titleText = 'Score By Teams';
           data = chartDataJudgeTeam;
       }
       else if (cUserType == 'emp') {
           titleText = 'Score By Teams';
           data = chartDataEmpTeam;
       }
   }
   else if (cType == 'category') {
       if (cUserType == 'judge') {
           titleText = 'Score By Category';
           data = chartDataJudgeCat;
       }
       else if (cUserType == 'emp') {
           titleText = 'Score By Category';
           data = chartDataEmpCat;
       }
   }

   var chart;

   var containerHeight = chartHeight + 50;

   document.getElementById('cpChart').style.height = containerHeight + 'px';

   chart = new google.visualization.ComboChart(document.getElementById('cpChart'));

   var options = {
       title: titleText,
       vAxis: { title: "Score" },
       hAxis: { title: "Teams" },
       seriesType: "bars",
       series: { 5: { type: "line"} },
       fontSize: 10,
       height: chartHeight,
       width: chartWidth
   };

   chart.draw(data, options);

   return false;
}


function JudgesScoreByCategory(tableID) {

    var json = GetJudgesScoreByCategory(tableID);
    
    if (json != undefined && json != null && json != '') {

        var data = google.visualization.arrayToDataTable(json);

        var chart;
        var titleText = '';

        if (tableID == 'jsTable') {
            $("#ScoreByCategory").show();
            $("#jCCEnlarge").show();
            chart = new google.visualization.ComboChart(document.getElementById('ScoreByCategory'));
            titleText = 'Score By Category';
            chartDataJudgeCat = data;
        }
        else {
            $("#eScoreByCategory").show();
            $("#eCCEnlarge").show();
            chart = new google.visualization.ComboChart(document.getElementById('eScoreByCategory'));
            titleText = 'Score By Category';
            chartDataEmpCat = data;
        }

        var options = {
            title: titleText,
            vAxis: { title: "Score" },
            hAxis: { title: "Teams" },
            seriesType: "bars",
            fontSize: 10,
            series: { 5: { type: "line"} },
            height: 360,
            width: 600
        };

        chart.draw(data, options);
    }
    else {

        if (tableID == 'jsTable') {
            $("#ScoreByCategory").hide();
            $("#jCCEnlarge").hide();

            //$("#ScoreByCategory").html('');
        }
        else {
            $("#eScoreByCategory").hide();
            $("#eCCEnlarge").hide();
            //$("#eScoreByCategory").html('');
        }
    }
}


function HideCharts(bHide) {

    if (bHide) {
        if ($("#ScoreByCategory") != null)
            $("#ScoreByCategory").hide();

        if ($("#jCCEnlarge") != null)
            $("#jCCEnlarge").hide();

        if ($("#eScoreByCategory") != null)
            $("#eScoreByCategory").hide();

        if ($("#eCCEnlarge") != null)
            $("#eCCEnlarge").hide();
    }
    else {
        if ($("#ScoreByCategory") != null)
            $("#ScoreByCategory").show();

        if ($("#jCCEnlarge") != null)
            $("#jCCEnlarge").show();

        if ($("#eScoreByCategory") != null)
            $("#eScoreByCategory").show();

        if ($("#eCCEnlarge") != null)
            $("#eCCEnlarge").show();
    }
}

function JudgesScoreByTeams(tableID) {
    
    var json = GetJudgesScoreByTeams(tableID);

    if (json != undefined && json != null && json != '') {
        var data = google.visualization.arrayToDataTable(json);

        var chart;
        var titleText = '';

        if (tableID == 'jsTable') {
            $("#ScoreByTeam").show();
            $("#jTCEnlarge").show();
            chart = new google.visualization.ComboChart(document.getElementById('ScoreByTeam'));
            titleText = 'Score By Teams';
            chartDataJudgeTeam = data;
        }
        else {
            $("#eScoreByTeam").show();
            $("#eTCEnlarge").show();
            chart = new google.visualization.ComboChart(document.getElementById('eScoreByTeam'));
            titleText = 'Score By Teams';
            chartDataEmpTeam = data;
        }

        var options = {
            title: titleText,
            vAxis: { title: "Score" },
            hAxis: { title: "Teams" },
            seriesType: "bars",
            fontSize: 10,
            series: { 5: { type: "line"} },
            height: 360,
            width: 600
        };

        chart.draw(data, options);
    }
    else {

        if (tableID == 'jsTable') {
            $("#ScoreByTeam").hide();
            $("#jTCEnlarge").hide();
            //$("#ScoreByTeam").html('');
        }
        else {
            $("#eScoreByTeam").hide();
            $("#eTCEnlarge").hide();
            //$("#eScoreByTeam").html('');
        }
    }
}


$('#teamScore').on('pagebeforeshow', function (event, ui) {
    RefreshTeamScore();
});


function RefreshTeamScore() {

    ShowLoading();

    SetUsreWelcomeText("#tsUser");
    SetPageTitle(selectedTeamID, "#tsPageTitle", "team");
    ShowTeamScore();

    HideLoading();
}


function ShowTeamScore() {
    GetTeamScore();
}


function GetTeamScore() {

    if (checkConnection()) {
        var GetUrl = SERVICE_BASEURL + String.format("Chef/ReportByTeam?team_id={0}&userId={1}", selectedTeamID, UserID);
        $.ajax({
            type: "GET", //GET or POST or PUT or DELETE verb
            url: GetUrl, // Location of the service                
            dataType: 'json',
            crossdomain: true,
            async: false,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Accept", "application/json");
            },
            success: function (msg) {//On Successfull service call
                messageValue = eval(msg);

                var row = 0;
                var column = 0;

                var collapsibleHtml = '';
                var maxArrayList = new Array();

                $.each(messageValue, function (index) {
                    tempObject = DrawTable(this.sections, 'ts' + this.sectionId, true, '', '', 'tsTable' + this.sectionId, 'Scoretable');

                    var collapsed = 'true';

                    if (index == 0)
                        collapsed = 'false';

                    collapsibleHtml += String.format(collapsibleSections, this.sectionTitle, tempObject, collapsed);

                    maxArrayList.push(maxArray);
                });

                collapsibleHtml = String.format(accordion, collapsibleHtml);

                $("#tsCollapsible").html(collapsibleHtml);

                var str = '';

                $.each(maxArrayList, function () {
                    $.each(this, function () {
                        $.each(this.CellIds, function () {
                            str += this + ', ';
                            $(String.format("#{0}", this)).addClass("HighstMarks");
                        });
                    });
                });

                $("#tsCollapsible").trigger("create");

            },
            error: AuthenticationServiceFailed// When Service call fails
        });
    }
}


$('#categoryScore').on('pagebeforeshow', function (event, ui) {
    RefreshCategoryScore();
});


function RefreshCategoryScore() {
    ShowLoading();

    SetUsreWelcomeText("#csUser");
    SetPageTitle(selectedCategoryID, "#csPageTitle", "category");
    ShowCategoryScore();

    HideLoading();
}

function ShowCategoryScore() {
    GetCategoryScore();
}


function GetCategoryScore() {

    if (checkConnection()) {
        var GetUrl = SERVICE_BASEURL + String.format("Chef/ReportByCategory?cat_id={0}&userId={1}", selectedCategoryID, UserID);

        $.ajax({
            type: "GET", //GET or POST or PUT or DELETE verb
            url: GetUrl, // Location of the service                
            dataType: 'json',
            crossdomain: true,
            async: false,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Accept", "application/json");
            },
            success: function (msg) {//On Successfull service call
                messageValue = eval(msg);

                var row = 0;
                var column = 0;

                var collapsibleHtml = '';
                var maxArrayList = new Array();

                $.each(messageValue, function (index) {
                    tempObject = DrawTable(this.sections, 'cs' + this.sectionId, true, '', '', 'csTable' + this.sectionId, 'Scoretable');

                    var collapsed = 'true';

                    if (index == 0)
                        collapsed = 'false';

                    collapsibleHtml += String.format(collapsibleSections, this.sectionTitle, tempObject, collapsed);

                    maxArrayList.push(maxArray);
                });

                collapsibleHtml = String.format(accordion, collapsibleHtml);

                $("#csCollapsible").html(collapsibleHtml);

                var str = '';

                $.each(maxArrayList, function () {
                    $.each(this, function () {
                        $.each(this.CellIds, function () {
                            str += this + ', ';
                            $(String.format("#{0}", this)).addClass("HighstMarks");
                        });
                    });
                });

                $("#csCollapsible").trigger("create");

            },
            error: AuthenticationServiceFailed// When Service call fails
        });
    }
}


$('#employeeScore').on('pagebeforeshow', function (event, ui) {
    ShowLoading();
    $("#eScoreByCategory").html('');
    $("#eScoreByTeam").html('');
    SetUsreWelcomeText("#esUser");
    ShowEmployeeScore(0);
    HideLoading();
});


function RefreshEmployeeScore() {
    ShowLoading();
    $("#eScoreByCategory").html('');
    $("#eScoreByTeam").html('');
    SetUsreWelcomeText("#esUser");
    ShowEmployeeScore(0);
    JudgesScoreByTeams('esTable');
    JudgesScoreByCategory('esTable');
    HideLoading();
}


$('#employeeScore').on('pageshow', function (event, ui) {
    JudgesScoreByTeams('esTable');
    JudgesScoreByCategory('esTable');
});


function ShowEmployeeScore() {

    if (checkConnection()) {
        var GetUrl = SERVICE_BASEURL + String.format("Chef/GetTeamsScore?userId={0}&utype=user", UserID);

        $.ajax({
            type: "GET", //GET or POST or PUT or DELETE verb
            url: GetUrl, // Location of the service                
            dataType: 'json',
            crossdomain: true,
            async: false,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Accept", "application/json");
            },
            success: function (msg) {//On Successfull service call
                var messageValue = eval(msg);

                if (messageValue != null && messageValue.length > 0) {
                    tempObject = DrawTable(messageValue, "2", true, 'team', 'category', 'esTable', 'Scoretable');

                    $("#esTableContainer").html(tempObject);

                    $.each(maxArray, function () {
                        $.each(this.CellIds, function () {
                            $(String.format("#{0}", this)).addClass("HighstMarks");
                        });
                    });

                    $("#etblEnlarge").show();
                    $("#eTCEnlarge").show();
                    $("#eCCEnlarge").show();
                    $("#eScores").show();
                }
                else {
                    $("#esTableContainer").html("No scores added by the employees");
                    $("#etblEnlarge").hide();
                    $("#eTCEnlarge").hide();
                    $("#eCCEnlarge").hide();
                    $("#eScores").hide();
                }
            },
            error: AuthenticationServiceFailed// When Service call fails
        });
    }
}

$('#employeeCatScore').on('pagebeforeshow', function (event, ui) {
    RefreshEmpCatScore();
});

function RefreshEmpCatScore() {
    ShowLoading();
    SetUsreWelcomeText("#ecsUser");
    SetPageTitle(empSelectedCategoryID, "#ecsPageTitle", "category");
    ShowEmployeeCatScore(empSelectedCategoryID);
    HideLoading();
}

function ClosePanel() {
    $("#categoryPanel").panel("close");
}

function SetLeftNavigation(categoryID) {

    var selectFirstIndex = false;

    if (categoryID == 0)
        selectFirstIndex = true;

    var categoryMenuID = '#panelCategoryList';


    $(categoryMenuID + ' li').remove();
    $(categoryMenuID).append('<li data-icon="delete"><a href="#" onclick="ClosePanel(); return false;";>Close</a></li>');

    $.each(master_categories, function (index, category) {

        if (selectFirstIndex && index == 0) {
            $(categoryMenuID).append(String.format('<li data-theme="a"><a href="#" onclick="return false;">{0}</a></li>', category.Category_Name));
            selectedPanelCategoryID = category.Category_Id;
        }
        else {
            if (category.Category_Id == categoryID) {
                $(categoryMenuID).append(String.format('<li data-theme="a"><a href="#" onclick="return false;">{0}</a></li>', category.Category_Name));
                selectedPanelCategoryID = category.Category_Id;
            }
            else
                $(categoryMenuID).append(String.format('<li><a href="#" onclick="return SelectPanelCategory({0});">{1}</a></li>', category.Category_Id, category.Category_Name));
        }
    });

    $(categoryMenuID).listview('refresh');
}

function SelectPanelCategory(categoryID) {
    ShowLoading();

    ShowEmployeeCatScore(categoryID);
    ClosePanel();

    HideLoading();
}


function ShowEmployeeCatScore(categoryID) {
    ShowLoading();

    //SetLeftNavigation(categoryID);
    GetEmployeeCatScore(categoryID);

    HideLoading();
}


function GetEmployeeCatScore(categoryID) {

    if (checkConnection()) {
        var GetUrl = SERVICE_BASEURL + String.format("Chef/ReportRatingByCategory?cat_id={0}&userId={1}", categoryID, UserID);

        $.ajax({
            type: "GET", //GET or POST or PUT or DELETE verb
            url: GetUrl, // Location of the service                
            dataType: 'json',
            crossdomain: true,
            async: false,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Accept", "application/json");
            },
            success: function (msg) {//On Successfull service call
                messageValue = eval(msg);

                var row = 0;
                var column = 0;

                var collapsibleHtml = '';
                var maxArrayList = new Array();

                $.each(messageValue, function (index) {
                    tempObject = DrawTable(this.sections, 'ecs' + this.sectionId, true, '', '', 'ecsTable' + this.sectionId, 'Scoretable');

                    var collapsed = 'true';

                    if (index == 0)
                        collapsed = 'false';

                    collapsibleHtml += String.format(collapsibleSections, this.sectionTitle, tempObject, collapsed);

                    maxArrayList.push(maxArray);
                });

                collapsibleHtml = String.format(accordion, collapsibleHtml);

                $("#ecsCollapsible").html(collapsibleHtml);

                var str = '';

                $.each(maxArrayList, function () {
                    $.each(this, function () {
                        $.each(this.CellIds, function () {
                            str += this + ', ';
                            $(String.format("#{0}", this)).addClass("HighstMarks");
                        });
                    });
                });

                $("#ecsCollapsible").trigger("create");
            },
            error: AuthenticationServiceFailed// When Service call fails
        });
    }
}


$('#employeeTeamScore').on('pagebeforeshow', function (event, ui) {
    RefreshEmpTeamScore();
});

function RefreshEmpTeamScore() {
    ShowLoading();
    SetUsreWelcomeText("#etsUser");
    SetPageTitle(empSelectedTeamID, "#etsPageTitle", "team");
    ShowEmployeeTeamScore(empSelectedTeamID);
    HideLoading();
}

function ShowEmployeeTeamScore(teamID) {
    GetEmployeeTeamScore(teamID);
}


function GetEmployeeTeamScore(teamID) {

    if (checkConnection()) {
        var GetUrl = SERVICE_BASEURL + String.format("Chef/ReportRatingByTeam?userId={0}&Team_id={1}", UserID, teamID);

        $.ajax({
            type: "GET", //GET or POST or PUT or DELETE verb
            url: GetUrl, // Location of the service                
            dataType: 'json',
            crossdomain: true,
            async: false,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Accept", "application/json");
            },
            success: function (msg) {//On Successfull service call
                messageValue = eval(msg);

                var row = 0;
                var column = 0;

                var collapsibleHtml = '';
                var maxArrayList = new Array();

                $.each(messageValue, function (index) {
                    tempObject = DrawTable(this.sections, 'ets' + this.sectionId, true, '', '', 'etsTable' + this.sectionId, 'Scoretable');

                    var collapsed = 'true';

                    if (index == 0)
                        collapsed = 'false';

                    collapsibleHtml += String.format(collapsibleSections, this.sectionTitle, tempObject, collapsed);

                    maxArrayList.push(maxArray);
                });

                collapsibleHtml = String.format(accordion, collapsibleHtml);

                $("#etsCollapsible").html(collapsibleHtml);

                var str = '';

                $.each(maxArrayList, function () {
                    $.each(this, function () {
                        $.each(this.CellIds, function () {
                            str += this + ', ';
                            $(String.format("#{0}", this)).addClass("HighstMarks");
                        });
                    });
                });

                $("#etsCollapsible").trigger("create");
            },
            error: AuthenticationServiceFailed// When Service call fails
        });
    }
}


$('#employees').on('pagebeforeshow', function (event, ui) {
    RefreshEmp();
});

function RefreshEmp() {
    ShowLoading();
    SetUsreWelcomeText("#empUser");
    ShowEmployees();
    HideLoading();
}

function ShowEmployees() {
    if (checkConnection()) {
        var GetUrl = SERVICE_BASEURL + String.format("Chef/GetUsers?userType=user&cuserId={0}", UserID);

        $.ajax({
            type: "GET", //GET or POST or PUT or DELETE verb
            url: GetUrl, // Location of the service                
            dataType: 'json',
            crossdomain: true,
            async: false,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Accept", "application/json");
            },
            success: function (msg) {//On Successfull service call
                messageValue = eval(msg);
                SetEmployeesList(messageValue);

            },
            error: AuthenticationServiceFailed // When Service call fails
        });
    }

}

function SetEmployeesList(employees) {

    $('#employeesList li').remove();

    $.each(employees, function () {
        $('#employeesList').append(String.format("<li><a href='#' onclick='return selectEmployee(\"{0}\", \"{1}\");'>{1}</a></li>", this.Id, this.Name));
    });

    $('#employeesList').listview('refresh');
}


function selectEmployee(employeeID, employeeName) {
    selectedEmployeeID = employeeID;
    selectedEmployeeName = employeeName;

    $.mobile.changePage("#employeeRating");
}


$('#employeeRating').on('pagebeforeshow', function (event, ui) {
    RefreshEmpRating();
});


function RefreshEmpRating() {
    ShowLoading();
    SetUsreWelcomeText("#erUser");
    SetPageTitle(selectedEmployeeID, "#erPageTitle", "employee");
    ShowEmployeeRatings();
    HideLoading();
}

function ShowEmployeeRatings() {

    if (checkConnection()) {
        var GetUrl = SERVICE_BASEURL + String.format("Chef/ReportByUser?cuserId={0}&userId={1}", UserID, selectedEmployeeID);

        $.ajax({
            type: "GET", //GET or POST or PUT or DELETE verb
            url: GetUrl, // Location of the service                
            dataType: 'json',
            crossdomain: true,
            async: false,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Accept", "application/json");
            },
            success: function (msg) {//On Successfull service call
                messageValue = eval(msg);


                var collapsibleHtml = '';
                var maxArrayList = new Array();

                $.each(messageValue, function (index) {
                    tempObject = DrawTable(this.sections, 'er' + this.sectionId, true, '', '', 'erTable' + this.sectionId, 'Scoretable');

                    var collapsed = 'true';

                    if (index == 0)
                        collapsed = 'false';

                    collapsibleHtml += String.format(collapsibleSections, this.sectionTitle, tempObject, collapsed);

                    maxArrayList.push(maxArray);
                });

                collapsibleHtml = String.format(accordion, collapsibleHtml);

                $("#erCollapsible").html(collapsibleHtml);

                var str = '';

                $.each(maxArrayList, function () {
                    $.each(this, function () {
                        $.each(this.CellIds, function () {
                            str += this + ', ';
                            $(String.format("#{0}", this)).addClass("HighstMarks");
                        });
                    });
                });

                $("#erCollapsible").trigger("create");
            },
            error: AuthenticationServiceFailed // When Service call fails
        });

    }
}


$('#chartPage').on('pagebeforeshow', function (event, ui) {
    RefreshChartPage();
});


function RefreshChartPage() {
    ShowLoading();
    SetUsreWelcomeText("#chrtUser");
    RenderChartScreen();
    HideLoading();
}


$('#judges').on('pagebeforeshow', function (event, ui) {
    RefreshJudges();
});

function RefreshJudges() {
    ShowLoading();
    SetUsreWelcomeText("#judgeUser");
    ShowJudges();
    HideLoading();
}

function confirmClear() {

    if (ISCLIENTAPP) {
        try {
            navigator.notification.confirm('Are you sure to clear the scores of Judges and Employees?', function (button) { if (button == 1) clearScores(); },
            'TECH CHEF', 'Yes,No');
        }
        catch (Err) {

        }
    }
    else {

        var cResult = confirm("Are you sure to clear the scores of Judges and Employees?");

        if (cResult)
            clearScores();
    }
}

function clearScores() {
    if (checkConnection()) {
        var GetUrl = SERVICE_BASEURL + String.format("Chef/Clear?userId={0}", UserID);
        var scoreCleared = false;

        $.ajax({
            type: "GET", //GET or POST or PUT or DELETE verb
            url: GetUrl, // Location of the service                
            dataType: 'json',
            crossdomain: true,
            async: false,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Accept", "application/json");
            },
            success: function (msg) {//On Successfull service call

                try {
                    if (parseInt(msg) != 'NaN')
                        scoreCleared = true;
                    else
                        scoreCleared = false;
                }
                catch (Err) {
                    scoreCleared = false;

                }

            },
            error: AuthenticationServiceFailed // When Service call fails
        });

        if (scoreCleared) {
            NotifyUser("The scores of Judges and employees has been cleared.");
            HideCharts(true);
        }
        else
            NotifyUser("Error occured during clearing the score");
    }

}

function ShowJudges() {
    if (checkConnection()) {
        var GetUrl = SERVICE_BASEURL + String.format("Chef/GetUsers?userType=judge&cuserId={0}", UserID);

        $.ajax({
            type: "GET", //GET or POST or PUT or DELETE verb
            url: GetUrl, // Location of the service                
            dataType: 'json',
            crossdomain: true,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Accept", "application/json");
            },
            success: function (msg) {//On Successfull service call
                messageValue = eval(msg);
                SetJudgesList(messageValue);

            },
            error: AuthenticationServiceFailed // When Service call fails
        });
    }
}

function SetJudgesList(judges) {

    $('#judgesList li').remove();

    $.each(judges, function () {
        $('#judgesList').append(String.format("<li><a href='#' onclick='return selectJudge(\"{0}\", \"{1}\");'>{1}</a></li>", this.Id, this.Name));
    });

    $('#judgesList').listview('refresh');
}


function selectJudge(judgeID, judgeName) {
    selectedJudgeID = judgeID;
    selectedJudgeName = judgeName;

    $.mobile.changePage("#judgeRating");
}


$('#judgeRating').on('pagebeforeshow', function (event, ui) {
    RefreshJudgeRatings();
});


function RefreshJudgeRatings() {
    ShowLoading();
    SetUsreWelcomeText("#jrUser");
    SetPageTitle(selectedJudgeID, "#jrPageTitle", "judge");
    ShowJudgeRatings();
    HideLoading();
}

function ShowJudgeRatings() {
    if (checkConnection()) {
        var GetUrl = SERVICE_BASEURL + String.format("Chef/ReportByUser?cuserId={0}&userId={1}", UserID, selectedJudgeID);

        $.ajax({
            type: "GET", //GET or POST or PUT or DELETE verb
            url: GetUrl, // Location of the service                
            dataType: 'json',
            crossdomain: true,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Accept", "application/json");
            },
            success: function (msg) {//On Successfull service call
                messageValue = eval(msg);


                var collapsibleHtml = '';
                var maxArrayList = new Array();

                $.each(messageValue, function (index) {
                    tempObject = DrawTable(this.sections, 'jr' + this.sectionId, true, '', '', 'jrTable' + this.sectionId, 'Scoretable');

                    var collapsed = 'true';

                    if (index == 0)
                        collapsed = 'false';

                    collapsibleHtml += String.format(collapsibleSections, this.sectionTitle, tempObject, collapsed);

                    maxArrayList.push(maxArray);
                });

                collapsibleHtml = String.format(accordion, collapsibleHtml);

                $("#jrCollapsible").html(collapsibleHtml);

                var str = '';

                $.each(maxArrayList, function () {
                    $.each(this, function () {
                        $.each(this.CellIds, function () {
                            str += this + ', ';
                            $(String.format("#{0}", this)).addClass("HighstMarks");
                        });
                    });
                });

                $("#jrCollapsible").trigger("create");
            },
            error: AuthenticationServiceFailed // When Service call fails
        });

    }
}

function SetEnlargedTableHtml(tableID, userType) {
    enlargeTableHtml = $(tableID).html();
    if (userType == 'judge')
        enlargeTableTitle = "Results";
    else if (userType == 'emp')
        enlargeTableTitle = "Results";

    $.mobile.changePage("#tablePage");
}


$('#tablePage').on('pagebeforeshow', function (event, ui) {
    RefreshTablePage();
});


function RefreshTablePage() {
    ShowLoading();

    SetUsreWelcomeText("#tblUser");
    $('#tablePageTitle').html(enlargeTableTitle);
    $('#tblResult').html(enlargeTableHtml);

    HideLoading();
}

$('#operations').on('pagebeforeshow', function (event, ui) {
    RefreshOperations();
});


function RefreshOperations() {
    ShowLoading();
    SetUsreWelcomeText("#sUser");
    SetStatus();
    HideLoading();
}


function SetStatus() {
    if (checkConnection()) {
        var GetUrl = SERVICE_BASEURL + "Chef/GetStatus";

        $.ajax({
            type: "GET", //GET or POST or PUT or DELETE verb
            url: GetUrl, // Location of the service                
            dataType: 'json',
            crossdomain: true,
            aync: true,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Accept", "application/json");
            },
            success: function (isOpen) {
                SCORING_OPEN = isOpen;
                ShowOperations();

            },
            error: AuthenticationServiceFailed // When Service call fails
        });

    }
}


function ShowOperations() {
    
    $("#dOperations").html('<a href="#" onclick="return confirmClear();" data-role="button">Clear Scores</a>');

    if (SCORING_OPEN)
        $("#dOperations").append(String.format('<a href="#" onclick="return confirmStatusChange({0});" data-role="button">Close Competition</a>', "'false'"));
    else
        $("#dOperations").append(String.format('<a href="#" onclick="return confirmStatusChange({0});" data-role="button">Open Competition</a>', "'true'"));

    $("#dOperations").trigger("create");
}


function confirmStatusChange(changedStatus) {
    if (ISCLIENTAPP) {
        try {
            navigator.notification.confirm('Are you sure to change the competition status?', function (button) { if (button == 1) ChangeStatus(changedStatus); },
            'TECH CHEF', 'Yes,No');
        }
        catch (Err) {
        }
    }
    else {
        var cResult = confirm("Are you sure to change the competition status?");

        if (cResult)
            ChangeStatus(changedStatus);
    }
}

function ChangeStatus(changedStatus) {
    if (checkConnection()) {
        var GetUrl = SERVICE_BASEURL + String.format("Chef/ChangeStatus?status={0}&userId={1}", changedStatus, UserID);

        $.ajax({
            type: "GET", //GET or POST or PUT or DELETE verb
            url: GetUrl, // Location of the service                
            dataType: 'json',
            crossdomain: true,
            aync: false,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Accept", "application/json");
            },
            success: function (msg) {
                messageValue = msg;

                if (msg.Success != undefined &&
                        msg.Success != false) {
                    SCORING_OPEN = msg.IsOpen;

                    ShowOperations();

                    if (SCORING_OPEN)
                        NotifyUser("The competition is now open for scoring.");
                    else
                        NotifyUser("The competition is now closed for scoring.");
                }
                else {
                    NotifyUser("Error occured during changing the competition status.");
                }
            },
            error: AuthenticationServiceFailed // When Service call fails
        });
    }

    return false;
}

function NotifyUser(message) {
    showAlert(message, 'TECH CHEF', 'OK');
}


function booleanToString(isTrue) {

    if (isTrue)
        return 'true';
    else
        return 'false';
}

function ConvertSpaceToUnderScore(text) {
    text = text.replace(/\s/gi, "_");
    return text;
}

function ConvertUnderScoreToSpace(text) {
    text = text.replace(/_/gi, " ");
    return text;
}

function GetChartWidthHeight() {
    var screenWidth = GetScreenWidth();

    if ((screenWidth - 200) > 500) {
        chartWidth = screenWidth - 100;
        chartHeight = (screenWidth - 100) * 3 / 5;
    }
    else {
        chartWidth = 500;
        chartHeight = 300;
    }
}


function GetScreenWidth() {
    return $(window).width();
}

function GetScreenHeight() {
    return $(window).height();
}


String.format = function (text) {
    //check if there are two arguments in the arguments list
    if (arguments.length <= 1) {
        //if there are not 2 or more arguments there's nothing to replace
        //just return the original text
        return text;
    }

    //decrement to move to the second argument in the array
    var tokenCount = arguments.length - 2;
    for (var token = 0; token <= tokenCount; token++) {
        //iterate through the tokens and replace their placeholders from the original text in order
        text = text.replace(new RegExp("\\{" + token + "\\}", "gi"), arguments[token + 1]);
    }

    return text;
};

function showAlert(message, alertTitle, buttonText) {

    if (ISCLIENTAPP) {

        try {
            navigator.notification.alert(message, alertCallBack, alertTitle, buttonText);
        }
        catch (Err) {
            alert(Err.Message + " : " + message);
        }
    }
    else {
        alert(message);
    }
}


function alertCallBack()
{ }


function checkConnection() {

    var networkExist = false;

    if (ISCLIENTAPP) {
        try {
            var states = {};
            states[Connection.UNKNOWN] = 'Unknown connection';
            states[Connection.ETHERNET] = 'Ethernet connection';
            states[Connection.WIFI] = 'WiFi connection';
            states[Connection.CELL_2G] = 'Cell 2G connection';
            states[Connection.CELL_3G] = 'Cell 3G connection';
            states[Connection.CELL_4G] = 'Cell 4G connection';
            states[Connection.CELL] = 'Cell generic connection';
            states[Connection.NONE] = 'No network connection';

            var networkState = navigator.connection.type;

            if (states[networkState] == states[Connection.NONE])
                showAlert('Network Connection not available!', 'Network Connection', 'OK');
            else
                networkExist = true;
        }
        catch (Err) {
            networkExist = true;
        }
    }
    else
        networkExist = true;

    return networkExist;
}