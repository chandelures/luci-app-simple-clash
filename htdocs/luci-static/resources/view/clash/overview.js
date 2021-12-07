"use strict";
"require form";
"require view";
"require uci";
return view.extend({
  load: function () {
    return Promise.all([L.uci.load("clash")]);
  },
  render: function (data) {
    let m, s, o;
    m = new form.Map("clash", _("Simple Clash"), _("descriptions"));
    s = m.section(form.NamedSection, "global", "clash", _("Settings"));
    s.tab("general", _("Basic Options"));
    s.tab("addition", _("Addtional Options"));
    s.tab("dns", _("DNS Settings"));
    o = s.taboption("general", form.Flag, "enabled", _("Enabled"));
    o.rmempty = false;
    o = s.taboption("general", form.Value, "current_profile", _("Profile"));
    for (const v of L.uci.sections(data[0], "profile")) {
      o.value(v[".name"], v[".name"]);
    }
    o.rmempty = false;
    o = s.taboption("general", form.Value, "mode", _("Mode"));
    o.value("direct", "Direct");
    o.value("rule", "Rule");
    o.value("global", "Global");
    o.rmempty = false;
    o.default = "Rule";
    o = s.taboption("general", form.Value, "http_port", _("Http Port"));
    o.datatype = "port";
    o.rmempty = false;
    o.default = 7890;
    o = s.taboption("general", form.Value, "socks_port", _("Socks Port"));
    o.datatype = "port";
    o.rmempty = false;
    o.default = 7891;
    o = s.taboption("general", form.Value, "mixed_port", _("Mixed Port"));
    o.datatype = "port";
    o.rmempty = false;
    o.default = 0;
    o = s.taboption(
      "general",
      form.Flag,
      "tproxy_enabled",
      _("TProxy Enabled")
    );
    o.rmempty = false;
    o = s.taboption("general", form.Value, "tproxy_port", _("TProxy Port"));
    o.depends("tproxy_enabled", "1");
    o.datatype = "port";
    o.rmempty = false;
    o.default = 7893;
    o = s.taboption("addition", form.Flag, "allow_lan", _("Allow Lan"));
    o.rmempty = false;
    o = s.taboption("addition", form.Value, "bind_addr", _("Bind Address"));
    o.depends("allow_lan", "1");
    o.datatype = "ipaddr";
    o.rmempty = false;
    o.default = "127.0.0.1";
    o = s.taboption(
      "addition",
      form.Flag,
      "udp_tproxy_enabled",
      _("UDP Tproxy")
    );
    o.rmempty = false;
    o = s.taboption("addition", form.Value, "log_level", _("Log Level"));
    o.value("silent", "Silent");
    o.value("debug", "Debug");
    o.value("error", "Error");
    o.value("warning", "Warning");
    o.value("info", "Info");
    o.rmempty = false;
    o = s.taboption("addition", form.Value, "api_host", _("Api Address"));
    o.datatype = "ipaddr";
    o.rmempty = false;
    o = s.taboption("addition", form.Value, "api_port", _("Api Port"));
    o.datatype = "port";
    o.rmempty = false;
    o = s.taboption("dns", form.Value, "dns_host", _("DNS Host"));
    o.datatype = "ipaddr";
    o.rmempty = false;
    o = s.taboption("dns", form.Value, "dns_port", _("DNS Port"));
    o.datatype = "port";
    o.rmempty = false;
    o = s.taboption(
      "dns",
      form.DynamicList,
      "default_nameserver",
      _("Default Nameservers")
    );
    o.datatype = "ipaddr";
    o.rmempty = false;
    o = s.taboption("dns", form.DynamicList, "nameserver", _("Nameservers"));
    o.datatype = "string";
    o.rmempty = false;
    o = s.taboption("dns", form.DynamicList, "fallback", _("Fallbacks"));
    o.datatype = "string";
    o.rmempty = false;
    s = m.section(form.GridSection, "profile", _("Profiles"));
    s.sortable = true;
    s.addremove = true;
    s.anonymous = true;
    s.addbtntitle = _("Add new profiles...");
    o = s.option(form.DummyValue, "_cfg_name", _("Name"));
    o.modalonly = false;
    o.textvalue = function (section_id) {
      return section_id;
    };
    o = s.option(form.Value, "type", _("Type"));
    s.handleAdd = function (ev) {
      let m2, s2, name, type;
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
      type.value("file", "file");
      type.default = "file";
      m2.render().then(
        L.bind(function (nodes) {
          ui.showModal(
            _("add new profile..."),
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
                      "handleCreateDDnsRule",
                      m,
                      name,
                      service_name,
                      ipv6
                    ),
                  },
                  _("Create service")
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
    o.modalonly = false;
    o.value("file", "file");
    o.rmempty = false;
    return m.render();
  },
});
