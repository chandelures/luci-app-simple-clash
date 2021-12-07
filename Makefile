include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Support for Clash
LUCI_DEPENDS:=+clash
LUCI_PKGARCH:=all

PKG_MAINTAINER:=Chandelure Wang <chandelurewang@gmail.com>
PKG_LICENSE:=MIT

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
