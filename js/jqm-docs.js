//collapse page navs after use
$(function(){
	$('body').delegate('.content-secondary .ui-collapsible-content', 'click',  function(){
		$(this).trigger("collapse");
	});
});

// display the version of jQM
$(document).bind( 'pageinit', function() {
	var version = $.mobile.version || "dev",
		words = version.split( "-" ),
		ver = words[0],
		str = (words[1] || "Final"),
		html = ver,
		foothtml = "Version " + ver;

	if( str.indexOf( "rc" ) == -1 ){
		str = str.charAt( 0 ).toUpperCase() + str.slice( 1 );
	} else {
		str = str.toUpperCase().replace(".", "");
	}

	if ( $.mobile.version && str ) {
		html += " <b>" + str + "</b>";
		foothtml += " " + str;
	}

	$( ".type-home .ui-content p.jqm-version" ).html( html );
	$( ".footer-docs p.jqm-version" ).html( foothtml );
});

// Turn off AJAX for local file browsing
if (location.protocol.substr(0, 4) === 'file' ||
     location.protocol.substr(0, 11) === '*-extension' ||
     location.protocol.substr(0, 6) === 'widget') {

    // Start with links with only the trailing slash and that aren't external links
    var fixLinks = function () {
        $("a[href$='/'], a[href='.'], a[href='..']").not("[rel='external']").each(function () {
            this.href = $(this).attr("href").replace(/\/$/, "") + "/index.html";
        });
    };

    // fix the links for the initial page
    $(fixLinks);

    // fix the links for subsequent ajax page loads
    $(document).bind('pagecreate', fixLinks);
}
