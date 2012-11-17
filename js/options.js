var Proxium = chrome.extension.getBackgroundPage().Proxium,
    proxyList = Proxium.getProxyList(),
    proxyEntryTemplate = $('#proxy-entry-template').html(),
    hostTemplate = $('#host-template').html(),
    $proxyList = $('.proxy-list');

// Show the default proxy server.
$('input[name=defaultProxyServer]').attr('value', Proxium.getDefaultProxyServer());

// Show the list of servers and their hosts.
for(var server in proxyList) {
    var $proxyEntry = $(proxyEntryTemplate.replace(/{server}/gi, server));
    for(var i=0, len=proxyList[server].length; i < len; ++i) {
        var $host = $(hostTemplate.replace(/{host}/gi, proxyList[server][i]));
        $proxyEntry.find('.hosts').append($host);
    }
    $($('#new-host-template').html())
        .find('input[name=host]').data('server', server)
        .end()
        .appendTo($proxyEntry.find('.hosts'));
    
    $proxyList.find('tbody').append($proxyEntry);
}

// Add the new proxy server form to the table.
$proxyList.find('tbody').append($($('#new-proxy-template').html()));

// Controls to add a new host.
$('.new-host button[name=add]').click(function() {
    var $host = $(this).parent().find('input[name=host]');
    if(/^[\w\.]+$/.test($host.val()) == false) {
        alert('Invalid host!');
        $host.focus();
        return;
    }
    Proxium.addToProxyList($host.val(), $host.data('server'));
    Proxium.refresh();
});

// Controls to add new proxy server.
$('button[name=addNewProxyServer]').click(function() {
    var server = $('.new-proxy').find('input[name=server]').val();
    var host = $('.new-proxy').find('input[name=host]').val();
    if(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/.test(server) == false) {
        alert('Invalid server address!');
        $('.new-proxy').find('input[name=server]').focus();
        return;
    }
    if(/^[\w\.]+$/.test(host) == false) {
        alert('Invalid host!');
        $('.new-proxy').find('input[name=host]').focus();
        return;
    }
    Proxium.addToProxyList(host, server);
    Proxium.refresh();
});

// Controls to update the default proxy server.
$('button[name=updateDefaultProxyServer]').click(function() {
    var server = $('input[name=defaultProxyServer]').val();
    if(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/.test(server) == false) {
        alert('Invalid server address!');
        $('input[name=defaultProxyServer]').focus();
        return;
    }
    Proxium.updateDefaultProxyServer($('input[name=defaultProxyServer]').val());
    Proxium.refresh();
});

// Controls to remove the host and for the animation.
$('.proxy-list .host').hover(function() {
    $(this).find('i').removeClass('icon-ok').addClass('icon-remove icon-white');
    $(this).addClass('btn-danger');
}, function() {
    $(this).find('i').removeClass('icon-remove icon-white').addClass('icon-ok');
    $(this).removeClass('btn-danger');
}).click(function() {
    Proxium.removeFromProxyList($(this).data('host'));
    Proxium.refresh();
});