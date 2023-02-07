"use strict";
"require ui";
"require form";
"require view";
"require dom";
"require uci";
"require rpc";
"require fs";

return view.extend({
  callGetServiceStatus: rpc.declare({
    object: "luci.clash",
    method: "get_service_status",
    expect: {},
  }),
  callInitAction: rpc.declare({
    object: "luci",
    method: "setInitAction",
    params: ["name", "action"],
    expect: { result: false },
  }),
  callUpdateProfile: rpc.declare({
    object: "luci.clash",
    method: "update_profile",
    params: ["profile_name"],
    expect: {},
  }),
  handleOpenDashboard: function () {
    var path = "clash-dashboard";
    var host = window.location.host;
    var protocol = window.location.protocol;
    window.open("%s//%s/%s?hostname=%s".format(protocol, host, path, host));
  },
  handleUpdateProfile: function (m, profile_name, ev) {
    return this.callUpdateProfile(profile_name)
      .then(function (data) {
        if (!data["success"])
          ui.addNotification(null, E("p", _(data["message"])));
      })
      .then(L.bind(m.load, m))
      .then(L.bind(m.render, m));
  },
  load: function () {
    return Promise.all([this.callGetServiceStatus(), uci.load("clash")]);
  },
  render: function (data) {
    var _this = this;
    var status = data[0];
    var m, s, o;

    m = new form.Map(
      "clash",
      _("Simple Clash"),
      _(
        'LuCI support for clash to translate traffic. More infomation is available at the <a href="https://github.com/Dreamacro/clash/wiki">official ducument<a/>'
      )
    );

    s = m.section(form.NamedSection, "global", null, _("Infomations"));

    o = s.option(form.DummyValue, "_running", _("Status"));
    o.cfgvalue = function () {
      return status["enabled"] ? _("Running") : _("Not Running");
    };

    o = s.option(form.DummyValue, "_version", _("Version"));
    o.cfgvalue = function () {
      return _(status["version"]);
    };

    if (status["dashboard"]) {
      o = s.option(form.Button, "_dashboard", _("Web Interface"));
      o.inputtitle = _("Dashboard");
      o.inputstyle = "apply";
      o.onclick = _this.handleOpenDashboard;
    } else {
      o = s.option(form.DummyValue, "_dashboard", _("Web Interface"));
      o.cfgvalue = function () {
        return _("Please install 'clash-dashboard' package first.");
      };
    }

    o = s.option(form.Button, "_restart", _("Service"));
    o.inputtitle = _("Restart");
    o.inputstyle = "apply";
    o.onclick = function () {
      return _this
        .callInitAction("clash", "restart")
        .then(L.bind(m.load, m))
        .then(L.bind(m.render, m));
    };

    s = m.section(form.NamedSection, "global", "clash", _("Settings"));
    s.tab("general", _("Basic Options"));
    s.tab("addition", _("Addtional Options"));
    s.tab("dns", _("DNS Settings"));

    o = s.taboption(
      "general",
      form.Flag,
      "enabled",
      _("Enabled"),
      _("Enable the clash service.")
    );
    o.rmempty = false;

    o = s.taboption(
      "general",
      form.Flag,
      "tproxy_enabled",
      _("TProxy Enabled"),
      _("Enable the transparent proxy.")
    );
    o.rmempty = false;

    o = s.taboption(
      "general",
      form.Value,
      "tproxy_port",
      _("TProxy Port"),
      _("The port of transparent proxy server.")
    );
    o.depends("tproxy_enabled", "1");
    o.datatype = "port";
    o.rmempty = false;
    o.default = 7893;

    o = s.taboption(
      "general",
      form.ListValue,
      "current_profile",
      _("Profile"),
      _("List of avaliable configurations for clash.")
    );
    for (var v of L.uci.sections("clash", "profile")) {
      o.value(v[".name"], v[".name"]);
    }
    o.optional = true;

    o = s.taboption(
      "general",
      form.ListValue,
      "mode",
      _("Mode"),
      _("Clash router mode.")
    );
    o.value("direct", "Direct");
    o.value("rule", "Rule");
    o.value("global", "Global");
    o.rmempty = false;
    o.default = "Rule";

    o = s.taboption(
      "general",
      form.Value,
      "mixed_port",
      _("Socks & HTTP Port"),
      _(
        "The port of http and socks proxy server. Set 0 to close socks and http proxy."
      )
    );
    o.datatype = "port";
    o.rmempty = false;
    o.default = 0;

    o = s.taboption(
      "addition",
      form.Value,
      "prog",
      _("Custom Path"),
      _("The path of clash to execute.")
    );
    o.datatype = "string";
    o.rmempty = false;
    o.placeholder = "/usr/bin/clash";

    o = s.taboption(
      "addition",
      form.Flag,
      "allow_lan",
      _("Allow Lan"),
      _("Allow connections to the local server.")
    );
    o.rmempty = false;

    o = s.taboption(
      "addition",
      form.Value,
      "bind_addr",
      _("Bind Address"),
      _(
        "IP addresses be allowed to create connections. By default, this value is 0.0.0.0."
      )
    );
    o.depends("allow_lan", "1");
    o.datatype = "ipaddr";
    o.rmempty = false;
    o.default = "0.0.0.0";
    o.placeholder = "0.0.0.0";

    o = s.taboption(
      "addition",
      form.Flag,
      "ipv6",
      _("IPv6 Enabled"),
      _("Enable ipv6 support.")
    );

    o = s.taboption(
      "addition",
      form.ListValue,
      "log_level",
      _("Log Level"),
      _("Clash by default prints log.")
    );
    o.value("silent", "Silent");
    o.value("debug", "Debug");
    o.value("error", "Error");
    o.value("warning", "Warning");
    o.value("info", "Info");
    o.rmempty = false;

    o = s.taboption(
      "addition",
      form.Value,
      "api_host",
      _("Api Address"),
      _("The host of Clash RESTful API.")
    );
    o.datatype = "ipaddr";
    o.rmempty = false;
    o.default = "0.0.0.0";
    o.placeholder = "0.0.0.0";

    o = s.taboption(
      "addition",
      form.Value,
      "api_port",
      _("Api Port"),
      _("The port of Clash RESTful API.")
    );
    o.datatype = "port";
    o.rmempty = false;
    o.default = 9090;
    o.placeholder = 9090;

    o = s.taboption(
      "dns",
      form.Value,
      "dns_host",
      _("DNS Host"),
      _("The host of Clash built-in DNS server.")
    );
    o.datatype = "ipaddr";
    o.rmempty = false;
    o.default = "127.0.0.1";
    o.placeholder = "127.0.0.1";

    o = s.taboption(
      "dns",
      form.Value,
      "dns_port",
      _("DNS Port"),
      _("The port of Clash build-in DNS server.")
    );
    o.datatype = "port";
    o.rmempty = false;
    o.default = 5353;
    o.placeholder = 5353;

    o = s.taboption(
      "dns",
      form.DynamicList,
      "default_nameserver",
      _("Default Nameservers"),
      _(
        "Nameservers are used to resolve the DNS nameserver hostnames. Only support UDP."
      )
    );
    o.datatype = "ipaddr";
    o.rmempty = false;
    o.placeholder = "114.114.114.114";

    o = s.taboption(
      "dns",
      form.DynamicList,
      "nameserver",
      _("Nameservers"),
      _(
        "Nameservers are used to resolve all DNS query. Support UDP, TCP, DOT, DOH."
      )
    );
    o.datatype = "string";
    o.rmempty = false;
    o.placeholder = "114.114.114.114";

    s = m.section(form.GridSection, "profile", _("Profiles"));
    s.sortable = true;
    s.addremove = true;
    s.anonymous = true;
    s.nodescriptions = true;
    s.addbtntitle = _("Add new profiles...");
    s.modaltitle = function (section_id) {
      return _("Clash Profiles - %s".format(section_id));
    };

    o = s.option(form.DummyValue, "_cfg_name", _("Name"));
    o.modalonly = false;
    o.textvalue = function (section_id) {
      return section_id;
    };

    o = s.option(form.Value, "type", _("Type"));
    o.value("Static", "Static");
    o.value("URL", "URL");
    o.rmempty = false;

    o = s.option(
      form.Value,
      "url",
      _("URL"),
      _("This needs cURL with SSL support, install 'curl' package first.")
    );
    o.rmempty = false;
    o.depends("type", "URL");
    o.textvalue = function (section_id) {
      var maxLen = 40;
      var cval = this.cfgvalue(section_id);
      if (cval == null) return this.default;
      if (cval.length <= maxLen) return cval;
      return "%h...".format(cval.slice(0, maxLen));
    };

    o = s.option(form.DummyValue, "_modify_time", _("Last Update"));
    o.modalonly = false;
    o.load = function (section_id) {
      return fs
        .stat("/etc/clash/profiles/%s.yaml".format(section_id))
        .then(function (fileStat) {
          var mtime = new Date(fileStat.mtime * 1000);
          return mtime.toLocaleString();
        })
        .catch(function (e) {
          return "Never";
        });
    };

    s.handleCreateProfile = function (m, name, type, url, ev) {
      var section_id = name.isValid("_new_") ? name.formvalue("_new_") : null;
      var type_value = type.isValid("_new_") ? type.formvalue("_new_") : "";
      var url_value = url.isValid("_new_") ? url.formvalue("_new_") : "";

      if (section_id == null || type_value == "") return;
      if (type_value == "URL" && url_value == "") return;

      if (uci.get("clash", section_id) != null) {
        s.handleModalSave();
        ui.hideModal();
        return;
      }

      return m
        .save(function () {
          section_id = uci.add("clash", "profile", section_id);
          uci.set("clash", section_id, "type", type_value);
          if (type_value == "URL")
            uci.set("clash", section_id, "url", url_value);
        })
        .then(function () {
          return ui.hideModal();
        });
    };

    s.handleAdd = function (ev) {
      var m2, s2, name, type;

      m2 = new form.Map("clash");
      s2 = m2.section(form.NamedSection, "_new_");
      s2.render = function () {
        return Promise.all([{}, this.renderUCISection("_new_")]).then(
          this.renderContents.bind(this)
        );
      };

      name = s2.option(form.Value, "name", _("Name"));
      name.rmempty = false;
      name.datatype = "uciname";
      name.validate = function (section_id, value) {
        if (uci.get("clash", value) != null)
          return _("The profile name is already used");
        return true;
      };

      type = s2.option(form.Value, "type", _("Type"));
      type.rmempty = false;
      type.value("Static", "Static");
      type.value("URL", "URL");
      type.default = "Static";

      url = s2.option(
        form.Value,
        "url",
        _("URL"),
        _("This needs cURL with SSL support, install 'curl' package first.")
      );
      url.depends("type", "URL");
      url.rmempty = false;

      m2.render().then(
        L.bind(function (nodes) {
          ui.showModal(
            _("Add new profile..."),
            [
              nodes,
              E("div", { class: "right" }, [
                E("button", { class: "btn", click: ui.hideModal }, _("Cancel")),
                " ",
                E(
                  "button",
                  {
                    class: "cbi-button cbi-button-positive important",
                    click: ui.createHandlerFn(
                      this,
                      "handleCreateProfile",
                      m,
                      name,
                      type,
                      url
                    ),
                  },
                  _("Create profile")
                ),
              ]),
            ],
            "cbi-modal"
          );
          nodes
            .querySelector(
              '[id="%s"] input[type="text"]'.format(name.cbid("_new_"))
            )
            .focus();
        }, this)
      );
    };

    s.renderRowActions = function (section_id) {
      var element = this.super("renderRowActions", [section_id, _("Edit")]);
      var update_opt = {
        class: "cbi-button cbi-button-neutral",
        click: ui.createHandlerFn(_this, "handleUpdateProfile", m, section_id),
        title: _("Update this profile"),
      };
      if (uci.get("clash", section_id, "type") != "URL")
        update_opt["disabled"] = "disabled";
      dom.content(element.lastChild, [
        E("button", update_opt, _("Update")),
        element.lastChild.childNodes[0],
        element.lastChild.childNodes[1],
        element.lastChild.childNodes[2],
      ]);
      return element;
    };

    s.addModalOptions = function (s, section_id) {
      o = s.option(form.TextValue, null, _("Content"));
      o.rmempty = false;
      o.modalonly = true;
      o.monospace = true;
      o.rows = 20;
      o.load = function (section_id) {
        return fs
          .read("/etc/clash/profiles/%s.yaml".format(section_id), "")
          .then(function (value) {
            return value;
          })
          .catch(function (e) {
            var type = uci.get("clash", section_id, "type");
            if (type == "Static") return "";
            if (type == "URL") {
              o.readonly = true;
              return "Please update profile first.";
            }
          });
      };
      o.write = function (section_id, formvalue) {
        return fs
          .write("/etc/clash/profiles/%s.yaml".format(section_id), formvalue)
          .then(function () {
            s.textvalue = formvalue;
            ui.addNotification(null, E("p", _("Changes have been saved.")));
          })
          .catch(function (e) {
            ui.addNotification(
              null,
              E("p", _("Unable to save changes: %s").format(e.message))
            );
          });
      };
    };

    return m.render();
  },
});
