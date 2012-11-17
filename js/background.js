var Proxium = {
    DEFAULT_PROXY_SERVER: 'Default Proxy Server',
    init: function() {
        Proxium.updateProxySettings();
        Proxium.addListeners();
    },
    addListeners: function() {
        chrome.tabs.onUpdated.addListener(function(tabid, changeInfo, tab) {
            Proxium.updateButtonUI(tab);
        });
        chrome.tabs.onActivated.addListener(function(info) {
            Proxium.getActiveTab(Proxium.updateButtonUI);
        });
        chrome.browserAction.onClicked.addListener(function(tab) {
            var uri = parseUri(tab.url);

            if(Proxium.isProxyEnabled(uri.host)) {
                Proxium.removeTabFromProxy(tab);
            } else {
                Proxium.addTabToProxy(tab);
            }
        });
    },
    isValidProtocol: function(protocol) {
        return "http" === protocol || "https" === protocol ;
    },
    getDefaultProxyServer: function() {
        return (localStorage.getItem('defaultProxyServer') !== null) ? localStorage.getItem('defaultProxyServer') : "74.112.203.74:80";
    },
    updateDefaultProxyServer: function(server) {
        var oldServer = localStorage['defaultProxyServer'];
        localStorage.setItem('defaultProxyServer', server);

        var proxyList = Proxium.getProxyList();
        if(typeof proxyList[oldServer] !== 'undefined') {
            var temp = proxyList[oldServer];
            delete proxyList[oldServer];
            proxyList[server] = temp;
        }

        localStorage.setItem('proxyList', JSON.stringify(proxyList));
        Proxium.updateProxySettings();
    },
    addToProxyList: function(host, server) {
        if(typeof server == 'undefined') server = 'Default Proxy Server';

        var proxyList = Proxium.getProxyList();
        if(typeof proxyList[server] == 'undefined') proxyList[server] = [host];
        else proxyList[server].push(host);

        localStorage.setItem('proxyList', JSON.stringify(proxyList));
        Proxium.updateProxySettings();
    },
    getProxyList: function() {
        return (localStorage.getItem('proxyList') !== null) ? JSON.parse(localStorage.getItem('proxyList')) : {};
    },
    removeFromProxyList: function(host) {
        var proxyList = Proxium.getProxyList();
        for(var server in proxyList) {
            var index = proxyList[server].indexOf(host);
            if(index > -1) {
                proxyList[server].splice(index, 1); // splice(m, n) remove n entries from mth position.
                if(proxyList[server].length == 0) delete proxyList[server];
                break;
            }
        }
        localStorage.setItem('proxyList', JSON.stringify(proxyList));
        Proxium.updateProxySettings();
    },
    isProxyEnabled: function(host) {
        var proxyList = Proxium.getProxyList();
        for(var server in proxyList) {
            if(proxyList[server].indexOf(host) > -1) return true;
        }
        return false;
    },
    addTabToProxy: function(tab) {
        var uri = parseUri(tab.url);
        if(!Proxium.isValidProtocol(uri.protocol)) {
            alert('Proxy can be enabled for http(s) only!');
        } else {
            Proxium.addToProxyList(uri.host);
            Proxium.refresh();
        }
    },
    removeTabFromProxy: function(tab) {
        var uri = parseUri(tab.url);
        if(Proxium.isProxyEnabled(uri.host)) {
            Proxium.removeFromProxyList(uri.host);
        }
        Proxium.refresh();
    },
    getActiveTab: function(cb) {
        chrome.tabs.query({active: true, windowId: chrome.windows.WINDOW_ID_CURRENT}, function(tabs) {
            if (tabs.length === 0) cb(null);
            cb(tabs[0]);
        });
    },
    updateProxySettings: function() {
        var proxyList = JSON.stringify(Proxium.getProxyList());
        proxyList = proxyList.replace(Proxium.DEFAULT_PROXY_SERVER, Proxium.getDefaultProxyServer());
        var pacScript = "var proxyList = "+ proxyList + ";\n" +
                        "function FindProxyForURL(url, host) {\n" +
                        "    for(var server in proxyList)\n" +
                        "        if(proxyList[server].indexOf(host) > -1)\n" +
                        "            return 'PROXY '+server;\n" +
                        "    return 'DIRECT';\n" +
                        "}";
        console.log(pacScript);
        var config = {
            mode: "pac_script",
            pacScript: {
                data: pacScript
            }
        };

        chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {}
        );
    },
    updateButtonUI: function(tab) {
        console.log('ActiveURL: '+tab.url+ 'TabID: '+tab.id);
        var uri = parseUri(tab.url);
        if(!Proxium.isValidProtocol(uri.protocol)) {
            return;
        }

        if(Proxium.isProxyEnabled(uri.host)) {
            chrome.browserAction.setIcon({path:"img/icon_38.png", tabId: tab.id});
            chrome.browserAction.setTitle({title: 'Disable Proxy!', tabId: tab.id});
        } else {
            chrome.browserAction.setIcon({path:"img/icon_38-grayscale.png", tabId: tab.id});
            chrome.browserAction.setTitle({title: 'Enable Proxy!', tabId: tab.id});
        }
    },
    refresh: function() {
        chrome.tabs.reload();
    }
};

Proxium.init();